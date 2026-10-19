/**
 * Error Sanitization & Information Disclosure Prevention (Modul 19)
 *
 * Prevents attackers and unauthorized users from mapping internal database schemas,
 * table names, column constraints, SQL syntax errors, or PostgREST signatures.
 *
 * In production:
 * Converts raw PostgreSQL / PostgREST / internal runtime errors into user-friendly,
 * safe Indonesian explanations without technical leakage.
 *
 * In development:
 * Logs full technical details (stack trace, error code, schema details) to console.error
 * for efficient debugging.
 */

export interface ErrorSanitizationOptions {
  fallbackMessage?: string;
  context?: string;
  logInDev?: boolean;
}

/**
 * Patterns of sensitive technical database keywords that must NEVER reach the UI or end-user
 */
const SENSITIVE_DATABASE_PATTERNS = [
  /schema\s+cache/i,
  /could\s+not\s+find\s+the\s+.*column/i,
  /column\s+.*in\s+the\s+schema\s+cache/i,
  /column\s+.*does\s+not\s+exist/i,
  /relation\s+["'][^"']+["']\s+does\s+not\s+exist/i,
  /column\s+["'][^"']+["']\s+does\s+not\s+exist/i,
  /table\s+["'][^"']+["']/i,
  /syntax\s+error\s+at\s+or\s+near/i,
  /violates\s+(?:not-null|foreign\s+key|unique|check)\s+constraint/i,
  /duplicate\s+key\s+value\s+violates/i,
  /permission\s+denied\s+for\s+(?:table|relation|sequence|function)/i,
  /new\s+row\s+violates\s+row-level\s+security/i,
  /pl\/?pgsql\s+function/i,
  /sql\s+statement/i,
  /function\s+["'][^"']+["']\s+does\s+not\s+exist/i,
  /\b(?:PGRST\d{3}|23505|23503|23514|23502|42P01|42703|42501|42601)\b/,
  /null\s+value\s+in\s+column/i,
  /deadlock\s+detected/i,
  /could\s+not\s+obtain\s+lock/i,
  /PostgREST/i,
  /supabase/i,
  /pg_catalog/i,
  /information_schema/i,
  /\bSELECT\b[\s\S]+\bFROM\b/i,
  /\bINSERT\s+INTO\b/i,
  /\bUPDATE\b[\s\S]+\bSET\b/i,
  /\bDELETE\s+FROM\b/i,
];

/**
 * Checks whether an error message contains internal database / SQL / framework leakage
 */
export function containsSensitiveDatabaseDetails(message: string): boolean {
  if (!message || typeof message !== "string") return false;
  return SENSITIVE_DATABASE_PATTERNS.some((pattern) => pattern.test(message));
}

/**
 * Sanitizes any raw database error, PostgREST exception, or unknown runtime error
 * into a secure, clean, user-friendly message.
 */
export function getSafeErrorMessage(
  error: unknown,
  options?: string | ErrorSanitizationOptions
): string {
  const opts: ErrorSanitizationOptions =
    typeof options === "string" ? { fallbackMessage: options } : options || {};

  const fallback =
    opts.fallbackMessage ||
    "Terjadi kesalahan pada sistem. Silakan coba beberapa saat lagi.";
  const logInDev = opts.logInDev !== false;

  // Extract raw message, code, and details
  let rawMessage = "";
  let errorCode = "";
  let errorDetails = "";

  if (typeof error === "string") {
    rawMessage = error;
  } else if (error && typeof error === "object") {
    const errObj = error as Record<string, any>;
    rawMessage = String(errObj.message || errObj.error_description || "");
    errorCode = String(errObj.code || "");
    errorDetails = String(errObj.details || errObj.hint || "");
  }

  // Developer logging (always safe in development, silent in production)
  if (logInDev && process.env.NODE_ENV !== "production") {
    console.error(`[Security Debug] Raw Error [${opts.context || "Operation"}]:`, {
      message: rawMessage,
      code: errorCode,
      details: errorDetails,
      original: error,
    });
  }

  // If no message, return fallback
  if (!rawMessage && !errorCode) {
    return fallback;
  }

  const combined = `${rawMessage} ${errorDetails} ${errorCode}`.toLowerCase();

  // 1. Zod runtime validation errors or custom intentional business exceptions
  if (
    rawMessage.startsWith("Validasi") ||
    rawMessage.includes("Keranjang belanja tidak boleh kosong") ||
    rawMessage.includes("Stok produk") ||
    rawMessage.includes("Uang tunai yang diterima") ||
    rawMessage.includes("Manipulasi") ||
    rawMessage.includes("Token pairing") ||
    rawMessage.includes("Sesi Anda telah berakhir") ||
    rawMessage.includes("Username atau password salah") ||
    rawMessage.includes("Akun Anda telah dinonaktifkan") ||
    rawMessage.includes("Terlalu banyak percobaan")
  ) {
    // These are already sanitized application-level business messages
    return rawMessage;
  }

  // 2. Specific PostgreSQL Error Codes & Signatures

  // 2.1 Unique Constraint Violation (Code 23505)
  if (
    errorCode === "23505" ||
    combined.includes("unique constraint") ||
    combined.includes("duplicate key")
  ) {
    if (combined.includes("barcode") || combined.includes("idx_products_barcode_unique")) {
      return "Barcode produk sudah digunakan oleh produk lain. Silakan gunakan barcode yang berbeda.";
    }
    if (combined.includes("sku") || combined.includes("products_sku_key")) {
      return "SKU produk sudah terdaftar dalam sistem. Silakan gunakan kode SKU yang unik.";
    }
    if (combined.includes("invoice") || combined.includes("invoice_number")) {
      return "Nomor faktur transaksi sudah ada dalam sistem.";
    }
    if (combined.includes("username") || combined.includes("users_username_key")) {
      return "Username sudah terdaftar. Silakan pilih username lain.";
    }
    return "Data dengan informasi tersebut sudah terdaftar dalam sistem. Harap gunakan data yang unik.";
  }

  // 2.2 Foreign Key Violation (Code 23503)
  if (
    errorCode === "23503" ||
    combined.includes("foreign key constraint") ||
    combined.includes("violates foreign key")
  ) {
    if (combined.includes("categories") || combined.includes("category")) {
      return "Kategori tidak dapat dihapus karena masih digunakan oleh produk aktif.";
    }
    if (combined.includes("suppliers") || combined.includes("supplier")) {
      return "Supplier tidak dapat dihapus karena masih memiliki produk terhubung.";
    }
    return "Data tidak dapat diubah atau dihapus karena masih terhubung dengan data lain dalam sistem.";
  }

  // 2.3 Check Constraint Violation (Code 23514)
  if (
    errorCode === "23514" ||
    combined.includes("check constraint") ||
    combined.includes("chk_")
  ) {
    if (
      combined.includes("chk_tx_cash_integrity") ||
      combined.includes("cash_received") ||
      combined.includes("cash_change")
    ) {
      return "Integritas pembayaran tidak valid: nominal uang diterima kurang dari total belanja atau nilai kembalian tidak sesuai.";
    }
    if (combined.includes("current_stock") || combined.includes("chk_stock")) {
      return "Jumlah stok tidak memenuhi ketentuan validasi (stok tidak boleh negatif).";
    }
    if (
      combined.includes("price") ||
      combined.includes("sell_price") ||
      combined.includes("buy_price")
    ) {
      return "Harga produk tidak valid (harga tidak boleh bernilai negatif).";
    }
    return "Nilai data yang dimasukkan tidak memenuhi aturan validasi sistem.";
  }

  // 2.4 Not-Null Constraint Violation (Code 23502)
  if (
    errorCode === "23502" ||
    combined.includes("violates not-null constraint") ||
    combined.includes("null value in column")
  ) {
    return "Terdapat data wajib yang belum diisi dengan lengkap. Mohon lengkapi formulir.";
  }

  // 2.5 Undefined Table, Column, or Schema (Code 42P01, 42703, PGRST204)
  if (
    errorCode === "42P01" ||
    errorCode === "42703" ||
    errorCode === "PGRST204" ||
    errorCode === "PGRST200" ||
    combined.includes("does not exist") ||
    combined.includes("undefined table") ||
    combined.includes("undefined column") ||
    combined.includes("schema cache") ||
    combined.includes("could not find the")
  ) {
    return "Terjadi kendala pada sinkronisasi data sistem. Silakan muat ulang halaman atau hubungi administrator.";
  }

  // 2.6 Insufficient Privilege / Row Level Security Violation (Code 42501)
  if (
    errorCode === "42501" ||
    combined.includes("permission denied") ||
    combined.includes("row-level security policy")
  ) {
    return "Akses ditolak: Anda tidak memiliki izin untuk melakukan tindakan ini.";
  }

  // 2.7 PostgREST Filter Syntax / Injection Attack Rejection (Code 42601, PGRST100)
  if (
    errorCode.startsWith("PGRST") ||
    errorCode === "42601" ||
    combined.includes("syntax error") ||
    combined.includes("failed to parse")
  ) {
    return "Format parameter pencarian atau permintaan data tidak valid.";
  }

  // 2.8 Network / Connection Timeout / Offline
  if (
    combined.includes("failed to fetch") ||
    combined.includes("networkerror") ||
    combined.includes("network request failed") ||
    combined.includes("connection refused") ||
    combined.includes("aborterror") ||
    combined.includes("econnrefused")
  ) {
    return "Gagal terhubung ke server. Silakan periksa koneksi internet Anda dan coba kembali.";
  }

  // 2.9 Deadlock / Lock Timeout (Code 55P03, 40P01)
  if (
    errorCode === "55P03" ||
    errorCode === "40P01" ||
    combined.includes("lock_not_available") ||
    combined.includes("deadlock detected")
  ) {
    return "Sistem sedang sibuk memproses transaksi kasir lain. Silakan coba kembali dalam beberapa detik.";
  }

  // 3. Fallback: If raw message contains ANY sensitive technical leakage, suppress it!
  if (
    containsSensitiveDatabaseDetails(rawMessage) ||
    containsSensitiveDatabaseDetails(errorDetails)
  ) {
    return fallback;
  }

  // If the error message is clean and doesn't reveal any internal schema, it is safe to return
  return rawMessage || fallback;
}
