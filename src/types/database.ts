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
