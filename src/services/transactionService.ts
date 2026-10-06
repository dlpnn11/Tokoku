import { supabase } from "@/lib/supabase";
import { Transaction, TransactionDetail } from "@/types/database";
import { CartItem } from "@/stores/cartStore";

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

export const transactionService = {
  /**
   * Atomic POS checkout using PostgreSQL stored function
   * Deducts current_stock and inserts transaction + details in single ACID lock
   */
  async checkout(params: CreateTransactionParams) {
    const formattedItems = params.items.map((item) => ({
      product_id: item.product.id,
      quantity: item.quantity,
      unit_price: Number(item.product.sell_price),
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
   * Find product by exact SKU / barcode for scanner
   */
  async getProductBySku(sku: string) {
    const { data, error } = await supabase
      .from("products")
      .select("*, category:categories(*)")
      .eq("sku", sku.trim())
      .single();

    if (error) return null;
    return data;
  },

  /**
   * Get recent transactions
   */
  async getRecentTransactions(limit = 10) {
    const { data, error } = await supabase
      .from("transactions")
      .select("*, user:users(full_name, role), details:transaction_details(*, product:products(name, sku, unit))")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data || []) as TransactionWithDetails[];
  },
};
