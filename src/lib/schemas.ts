import { z } from "zod";

/**
 * TokoKu POS & Inventory Runtime Input Schemas (Zod)
 * Defense-in-depth protection against buffer overflow, invalid types,
 * injection attempts, and malformed business mutation payloads.
 */

// 1. Product Input Schema
export const ProductInputSchema = z.object({
  name: z
    .string({ message: "Nama produk wajib diisi" })
    .trim()
    .min(2, "Nama produk minimal 2 karakter")
    .max(150, "Nama produk maksimal 150 karakter"),
  sku: z
    .string({ message: "Kode SKU wajib diisi" })
    .trim()
    .min(3, "Kode SKU minimal 3 karakter")
    .max(50, "Kode SKU maksimal 50 karakter")
    .regex(
      /^[A-Za-z0-9._-]+$/,
      "Kode SKU hanya boleh berisi huruf alfanumerik, titik, strip, dan underscore"
    ),
  barcode: z
    .string()
    .trim()
    .max(50, "Nomor barcode maksimal 50 karakter")
    .regex(/^[A-Za-z0-9-]+$/, "Format barcode tidak valid")
    .nullish()
    .or(z.literal("")),
  category_id: z
    .string({ message: "Kategori wajib dipilih" })
    .trim()
    .min(1, "Kategori wajib dipilih"),
  supplier_id: z.string().trim().nullish().or(z.literal("")),
  buy_price: z
    .number({ message: "Harga beli harus berupa angka" })
    .min(0, "Harga beli tidak boleh bernilai negatif")
    .max(1000000000, "Harga beli melebihi batas maksimum (Rp 1 Miliar)"),
  sell_price: z
    .number({ message: "Harga jual harus berupa angka" })
    .min(0, "Harga jual tidak boleh bernilai negatif")
    .max(1000000000, "Harga jual melebihi batas maksimum (Rp 1 Miliar)"),
  current_stock: z
    .number({ message: "Stok saat ini harus berupa angka" })
    .int("Stok saat ini harus berupa bilangan bulat")
    .min(0, "Stok saat ini tidak boleh bernilai negatif")
    .max(1000000, "Stok saat ini melebihi batas maksimum (1.000.000)"),
  minimum_stock: z
    .number({ message: "Stok minimum harus berupa angka" })
    .int("Stok minimum harus berupa bilangan bulat")
    .min(0, "Stok minimum tidak boleh bernilai negatif")
    .max(1000000, "Stok minimum melebihi batas maksimum (1.000.000)"),
  unit: z
    .string({ message: "Satuan unit barang wajib diisi" })
    .trim()
    .min(1, "Satuan unit barang tidak boleh kosong")
    .max(30, "Satuan unit barang maksimal 30 karakter"),
  image_url: z
    .string()
    .trim()
    .max(500, "URL gambar maksimal 500 karakter")
    .nullish()
    .or(z.literal("")),
  is_active: z.boolean().optional().default(true),
});

export type ProductInput = z.infer<typeof ProductInputSchema>;

// 2. Supplier Input Schema
export const SupplierInputSchema = z.object({
  name: z
    .string({ message: "Nama supplier wajib diisi" })
    .trim()
    .min(2, "Nama supplier minimal 2 karakter")
    .max(150, "Nama supplier maksimal 150 karakter"),
  phone: z
    .string()
    .trim()
    .max(25, "Nomor telepon maksimal 25 karakter")
    .refine(
      (val) => !val || /^(?:\+62|62|0)[0-9]{8,14}$/.test(val.replace(/[\s-]/g, "")),
      "Format nomor telepon tidak valid (contoh: 08123456789 atau +628123456789)"
    )
    .nullish()
    .or(z.literal("")),
  address: z
    .string()
    .trim()
    .max(300, "Alamat supplier maksimal 300 karakter")
    .nullish()
    .or(z.literal("")),
});

export type SupplierInput = z.infer<typeof SupplierInputSchema>;

// 3. Category Input Schema
export const CategoryInputSchema = z.object({
  name: z
    .string({ message: "Nama kategori wajib diisi" })
    .trim()
    .min(2, "Nama kategori minimal 2 karakter")
    .max(50, "Nama kategori maksimal 50 karakter"),
  icon_name: z
    .string()
    .trim()
    .max(50, "Nama icon maksimal 50 karakter")
    .optional()
    .default("Package"),
});

export type CategoryInput = z.infer<typeof CategoryInputSchema>;

// 4. Stock Adjustment Schema (Stock Opname)
export const StockAdjustmentSchema = z.object({
  productId: z.string().trim().min(1, "Product ID wajib diisi"),
  newStock: z
    .number({ message: "Stok baru harus berupa angka" })
    .int("Stok baru harus berupa bilangan bulat")
    .min(0, "Stok opname tidak boleh bernilai negatif")
    .max(1000000, "Stok opname melebihi batas maksimum"),
});

export type StockAdjustmentInput = z.infer<typeof StockAdjustmentSchema>;

// 5. Transaction Item & POS Checkout Schemas
export const TransactionItemSchema = z.object({
  product_id: z.string().trim().min(1, "ID produk wajib diisi"),
  quantity: z
    .number({ message: "Kuantitas barang harus berupa angka" })
    .int("Kuantitas barang harus berupa bilangan bulat")
    .min(1, "Kuantitas barang minimal 1")
    .max(10000, "Kuantitas barang melebihi batas transaksi kasir (maks 10.000)"),
  unit_price: z
    .number({ message: "Harga satuan harus berupa angka" })
    .min(0, "Harga satuan tidak boleh bernilai negatif"),
  subtotal: z
    .number({ message: "Subtotal harus berupa angka" })
    .min(0, "Subtotal tidak boleh bernilai negatif"),
});

export const TransactionInputSchema = z.object({
  invoiceNumber: z
    .string({ message: "Nomor faktur/struk wajib diisi" })
    .trim()
    .min(5, "Nomor invoice minimal 5 karakter")
    .max(50, "Nomor invoice maksimal 50 karakter")
    .regex(/^[A-Za-z0-9_-]+$/, "Format nomor invoice tidak valid"),
  userId: z.string().trim().min(1, "User ID kasir wajib diisi"),
  totalAmount: z
    .number({ message: "Total transaksi harus berupa angka" })
    .min(0, "Total transaksi tidak boleh bernilai negatif"),
  paymentMethod: z.enum(["Tunai", "QRIS"], {
    message: "Metode pembayaran hanya boleh 'Tunai' atau 'QRIS'",
  }),
  cashReceived: z
    .number({ message: "Uang diterima harus berupa angka" })
    .min(0, "Uang diterima tidak boleh bernilai negatif"),
  cashChange: z
    .number({ message: "Kembalian harus berupa angka" })
    .min(0, "Kembalian tidak boleh bernilai negatif"),
  customerPhone: z
    .string()
    .trim()
    .max(25, "Nomor WhatsApp pelanggan maksimal 25 karakter")
    .refine(
      (val) => !val || /^(?:\+62|62|0)[0-9]{8,14}$/.test(val.replace(/[\s-]/g, "")),
      "Format nomor WhatsApp pelanggan tidak valid (contoh: 08123456789)"
    )
    .nullish()
    .or(z.literal("")),
  items: z
    .array(TransactionItemSchema)
    .min(1, "Keranjang belanja tidak boleh kosong"),
});

export type TransactionInput = z.infer<typeof TransactionInputSchema>;

/**
 * Formats Zod validation issues into a single, user-friendly error string.
 */
export function formatZodError(error: z.ZodError): string {
  const issues = error?.issues || (error as any)?.errors || [];
  return issues.map((e) => e.message).join(", ");
}

/**
 * Universal safe parser returning clean discriminated union.
 */
export function validateWithSchema<T>(
  schema: z.ZodType<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: string; issues: z.ZodIssue[] } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return {
    success: false,
    error: formatZodError(result.error),
    issues: result.error.issues,
  };
}
