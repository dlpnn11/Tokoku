export type UserRole = "pemilik" | "kasir";

export interface User {
  id: string;
  username: string;
  password_hash?: string;
  full_name: string;
  role: UserRole;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  icon_name?: string;
  created_at: string;
}

export interface Supplier {
  id: string;
  name: string;
  phone?: string;
  address?: string;
  created_at: string;
}

export interface Product {
  id: string;
  sku: string;
  barcode?: string | null;
  name: string;
  category_id: string;
  supplier_id?: string | null;
  buy_price: number;
  sell_price: number;
  current_stock: number;
  minimum_stock: number;
  unit: string;
  image_url?: string | null;
  is_active: boolean;
  created_at: string;
  category?: Category;
  supplier?: Supplier;
}

export type PaymentMethod = "Tunai" | "QRIS";
export type TransactionStatus = "Selesai" | "Dibatalkan";

export interface TransactionDetail {
  id: string;
  transaction_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  product?: Product;
}

export interface Transaction {
  id: string;
  invoice_number: string;
  user_id: string;
  total_amount: number;
  payment_method: PaymentMethod;
  cash_received?: number | null;
  cash_change?: number | null;
  customer_phone?: string | null;
  status: TransactionStatus;
  created_at: string;
  user?: User;
  details?: TransactionDetail[];
}

export interface CartItem {
  product: Product;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export type AuditAction =
  | "HARGA_DIUBAH"
  | "STOK_DISESUAIKAN"
  | "PRODUK_DIBUAT"
  | "PRODUK_DIUBAH"
  | "PRODUK_DIHAPUS"
  | "TRANSAKSI_DIBUAT"
  | "TRANSAKSI_DIBATALKAN"
  | "LOGIN_SUKSES"
  | "LOGIN_GAGAL"
  | "LOGOUT"
  | "TERMINAL_DIKUNCI"
  | "TERMINAL_DIBUKA"
  | "TAMPERING_DETECTED"
  | "CUSTOMER_PII_REVEALED"
  | "SUPERVISOR_OVERRIDE_APPROVED"
  | "SUPERVISOR_OVERRIDE_REJECTED"
  | "SHIFT_OPENED"
  | "SHIFT_CLOSED_RECONCILIATION";

export interface AuditLog {
  id: string;
  user_id?: string | null;
  action: AuditAction | string;
  entity: "products" | "transactions" | "auth" | "system" | "shifts" | string;
  entity_id?: string | null;
  old_values?: Record<string, any> | null;
  new_values?: Record<string, any> | null;
  ip_address?: string | null;
  user_agent?: string | null;
  created_at: string;
  user?: User | null;
}

export type ShiftReconciliationStatus = "BALANCED" | "OVER" | "SHORT";

export interface PosShift {
  id: string;
  user_id: string;
  cashier_name: string;
  start_time: string;
  end_time?: string | null;
  starting_cash: number;
  expected_cash?: number | null;
  actual_cash?: number | null;
  discrepancy?: number | null;
  total_cash_sales: number;
  total_qris_sales: number;
  total_sales: number;
  transactions_count: number;
  status: "open" | "closed";
  notes?: string | null;
  created_at: string;
  user?: User;
}

export interface ShiftSummaryCalculation {
  shiftId: string;
  startingCash: number;
  totalCashSales: number;
  totalQrisSales: number;
  totalSales: number;
  transactionsCount: number;
  expectedCash: number;
}


