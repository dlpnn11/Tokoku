import { supabase } from "@/lib/supabase";
import { Transaction, TransactionDetail } from "@/types/database";
import { CartItem } from "@/stores/cartStore";
import { roundPrice500 } from "@/lib/utils";

export interface CreateTransactionParams {
  invoiceNumber: string;
  userId: string;
  totalAmount: number;
  paymentMethod: "Tunai" | "QRIS";
  cashReceived: number;
  cashChange: number;
  customerPhone?: string;
  items: CartItem[];
}

export type TransactionWithDetails = Omit<Transaction, "user" | "details"> & {
  details: (TransactionDetail & { product: { name: string; sku: string; unit: string } })[];
  user: { full_name: string; role: string };
};

export interface TransactionFilterOptions {
  search?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  paymentMethod?: string;
  limit?: number;
  offset?: number;
}

export const transactionService = {
  /**
   * Atomic POS checkout using PostgreSQL stored function
   * Deducts current_stock and inserts transaction + details in single ACID lock
   */
  async checkout(params: CreateTransactionParams) {
    const formattedItems = params.items.map((item) => ({
      product_id: item.product.id,
      quantity: item.quantity,
      unit_price: roundPrice500(Number(item.product.sell_price)),
      subtotal: Number(item.subtotal),
    }));

    const { data, error } = await supabase.rpc("create_pos_transaction", {
      p_invoice_number: params.invoiceNumber,
      p_user_id: params.userId,
      p_total_amount: params.totalAmount,
      p_payment_method: params.paymentMethod,
      p_cash_received: params.cashReceived,
      p_cash_change: params.cashChange,
      p_customer_phone: params.customerPhone || null,
      p_items: formattedItems,
    });

    if (error) {
      throw new Error(error.message || "Gagal memproses transaksi kasir.");
    }

    return data as {
      success: boolean;
      transaction_id: string;
      invoice_number: string;
      message: string;
    };
  },

  /**
   * Find product by exact barcode or SKU for scanner
   */
  async getProductBySku(code: string) {
    const trimmed = code.trim();
    // 1. Try matching physical barcode first
    const { data: barcodeMatch } = await supabase
      .from("products")
      .select("*, category:categories(*)")
      .eq("barcode", trimmed)
      .single();

    if (barcodeMatch) return barcodeMatch;

    // 2. Fallback to SKU match
    const { data: skuMatch, error } = await supabase
      .from("products")
      .select("*, category:categories(*)")
      .eq("sku", trimmed)
      .single();

    if (error) return null;
    return skuMatch;
  },

  /**
   * Get filtered transactions with full relations
   */
  async getTransactions(options?: TransactionFilterOptions) {
    let query = supabase
      .from("transactions")
      .select(
        "*, user:users(full_name, role), details:transaction_details(*, product:products(name, sku, unit))",
        { count: "exact" }
      )
      .order("created_at", { ascending: false });

    if (options?.status && options.status !== "Semua") {
      query = query.eq("status", options.status);
    }

    if (options?.paymentMethod && options.paymentMethod !== "Semua") {
      query = query.eq("payment_method", options.paymentMethod);
    }

    if (options?.startDate) {
      query = query.gte("created_at", `${options.startDate}T00:00:00`);
    }

    if (options?.endDate) {
      query = query.lte("created_at", `${options.endDate}T23:59:59`);
    }

    if (options?.search && options.search.trim()) {
      const s = options.search.trim();
      query = query.or(`invoice_number.ilike.%${s}%,customer_phone.ilike.%${s}%`);
    }

    if (options?.limit) {
      const from = options.offset || 0;
      const to = from + options.limit - 1;
      query = query.range(from, to);
    }

    const { data, error, count } = await query;
    if (error) throw error;

    return {
      transactions: (data || []) as TransactionWithDetails[],
      totalCount: count || 0,
    };
  },

  /**
   * Get single transaction by ID
   */
  async getTransactionById(id: string) {
    const { data, error } = await supabase
      .from("transactions")
      .select("*, user:users(full_name, role), details:transaction_details(*, product:products(name, sku, unit))")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data as TransactionWithDetails;
  },

  /**
   * Cancel transaction and restock products via atomic RPC
   */
  async cancelTransaction(transactionId: string) {
    const { data, error } = await supabase.rpc("cancel_pos_transaction", {
      p_transaction_id: transactionId,
    });

    if (error) {
      throw new Error(error.message || "Gagal membatalkan transaksi.");
    }

    return data as { success: boolean; message: string };
  },

  /**
   * Get recent transactions
   */
  async getRecentTransactions(limit = 10) {
    const { transactions } = await this.getTransactions({ limit });
    return transactions;
  },
};
