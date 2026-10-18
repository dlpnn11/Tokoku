/**
 * XSS Sanitization & Safe Output Encoding Utility for TokoKu POS & Inventory Management System.
 * (Security Defense-in-Depth - Modul 16)
 *
 * Provides robust protection against:
 * 1. Stored & Reflected Cross-Site Scripting (XSS) in catalog, cashier receipts, and print preview.
 * 2. Malicious HTML tag / event handler injection (<script>, <img onerror>, etc.).
 * 3. Unicode Bidi override & zero-width character spoofing (\u202E, \u200B, etc.).
 * 4. WhatsApp URL injection, phone number malformation, and protocol smuggling (javascript:, data:).
 */

/**
 * Escapes HTML characters to prevent XSS execution when rendered in HTML contexts.
 *
 * @param text Raw untrusted string
 * @returns Escaped HTML-safe string
 */
export function escapeHtml(text: unknown): string {
  if (typeof text !== "string") return "";

  const htmlEscapes: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#x27;",
    "/": "&#x2F;",
    "`": "&#x60;",
    "=": "&#x3D;",
  };

  return text.replace(/[&<>"'`/=]/g, (match) => htmlEscapes[match] || match);
}

/**
 * Strips HTML tags, dangerous scripts, control characters, and Unicode spoofing artifacts.
 *
 * @param input Raw untrusted text
 * @returns Plain text stripped of all HTML tags and control characters
 */
export function stripHtml(input: unknown): string {
  if (typeof input !== "string") return "";

  return input
    // 1. Remove dangerous Unicode control characters (Bidi overrides, zero-width characters, null bytes)
    // \u0000: Null byte
    // \u202A - \u202E: Directional embedding / override
    // \u2066 - \u2069: Directional isolate
    // \u200B - \u200D: Zero-width spaces & joiners
    // \uFEFF: Zero-width non-breaking space (BOM)
    .replace(/[\u0000\u200B-\u200D\u202A-\u202E\u2066-\u2069\uFEFF]/g, "")
    // 2. Remove script / style tags and their contents completely
    .replace(/<\s*(?:script|style|iframe|object|embed)[^>]*>[\s\S]*?<\s*\/\s*(?:script|style|iframe|object|embed)\s*>/gi, "")
    // 3. Remove all remaining HTML / XML tags
    .replace(/<[^>]+>/g, "")
    // 4. Strip dangerous pseudo-protocols like javascript: or data: in case of text evaluation
    .replace(/(?:javascript|vbscript|data):/gi, "");
}

/**
 * Sanitizes plain text input, enforcing strict length limits and removing HTML / control characters.
 * Ideal for product names, customer names, category titles, notes, and invoice codes.
 *
 * @param input Raw untrusted string
 * @param maxLength Maximum allowable characters (default: 255)
 * @returns Safe, single-line or normalized plain text
 */
export function sanitizePlainText(input: unknown, maxLength = 255): string {
  if (typeof input !== "string") return "";

  const stripped = stripHtml(input);

  // Normalize consecutive whitespace to a single space and trim
  const normalized = stripped.replace(/\s+/g, " ").trim();

  return normalized.slice(0, maxLength);
}

/**
 * Sanitizes multi-line text (e.g. receipt notes, formatted messages),
 * preserving newline breaks while stripping HTML tags and control chars.
 *
 * @param input Raw untrusted multi-line string
 * @param maxLength Maximum allowable characters (default: 4000)
 * @returns Safe multi-line text
 */
export function sanitizeMultiLineText(input: unknown, maxLength = 4000): string {
  if (typeof input !== "string") return "";

  const stripped = stripHtml(input);

  // Preserve single newlines, collapse 3+ consecutive newlines to maximum 2
  const cleaned = stripped
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return cleaned.slice(0, maxLength);
}

/**
 * Sanitizes and normalizes telephone numbers into E.164 international standard format
 * specifically optimized for Indonesian WhatsApp contacts (+62).
 *
 * Handles formats:
 * - "0812-3456-7890" -> "6281234567890"
 * - "+62 812 3456 7890" -> "6281234567890"
 * - "81234567890" -> "6281234567890"
 * - "6281234567890" -> "6281234567890"
 *
 * Rejects:
 * - Alphabetic strings, symbols, or injection payloads
 * - Numbers with invalid length (< 10 or > 15 digits according to ITU-T E.164)
 * - Non-Indonesian or malformed prefixes if unconvertible
 *
 * @param phone Raw phone number input
 * @returns Normalized digit-only string (e.g. "6281234567890") or "" if invalid
 */
export function sanitizePhoneNumber(phone: unknown): string {
  if (typeof phone !== "string" && typeof phone !== "number") return "";

  const raw = String(phone).trim();
  if (!raw) return "";

  // Extract only numerical digits
  let digits = raw.replace(/[^0-9]/g, "");
  if (!digits) return "";

  // Normalize Indonesian prefixes:
  // 1. Starts with 0 (e.g., 0812... -> 62812...)
  if (digits.startsWith("0")) {
    digits = "62" + digits.slice(1);
  }
  // 2. Starts with 8 (e.g., 812... -> 62812...)
  else if (digits.startsWith("8")) {
    digits = "62" + digits;
  }

  // Verification against ITU-T E.164 length constraints:
  // Indonesian numbers with 62 prefix typically span 11-14 digits (min 10, max 15)
  if (digits.length < 10 || digits.length > 15) {
    return "";
  }

  // Must start with valid country prefix (62 for TokoKu Indonesian retail standard)
  if (!digits.startsWith("62")) {
    // If international number between 10-15 digits, allow digits as-is
    return digits;
  }

  return digits;
}

/**
 * Checks whether a given phone number input is valid after sanitization.
 *
 * @param phone Raw phone number input
 * @returns boolean true if valid, false otherwise
 */
export function isValidPhoneNumber(phone: unknown): boolean {
  return sanitizePhoneNumber(phone) !== "";
}

/**
 * Builds a secure, validated WhatsApp API URL (wa.me) preventing XSS, protocol injection,
 * and URL corruption.
 *
 * Ensures:
 * 1. Protocol is strictly HTTPS and host is strictly wa.me.
 * 2. Phone number is validated and normalized to digits-only.
 * 3. Message is stripped of HTML, control chars, and securely encoded with encodeURIComponent.
 *
 * @param phone Customer or supplier phone number
 * @param message Raw text message to send
 * @returns Safe URL string (e.g. "https://wa.me/628123456789?text=...") or "" if phone is invalid
 */
export function buildSafeWhatsAppUrl(phone: unknown, message: unknown): string {
  const cleanPhone = sanitizePhoneNumber(phone);
  if (!cleanPhone) return "";

  const cleanMessage = sanitizeMultiLineText(message, 4000);
  const encodedText = encodeURIComponent(cleanMessage);

  return `https://wa.me/${cleanPhone}?text=${encodedText}`;
}

/**
 * Sanitizes entire receipt item list and details to guarantee zero unescaped/malicious
 * user inputs reach thermal printing or digital image generation canvases.
 */
export interface SanitizedReceiptItem {
  name: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface SanitizedReceiptData {
  invoiceNumber: string;
  date: string;
  cashierName: string;
  customerPhone?: string;
  paymentMethod: string;
  totalAmount: number;
  cashReceived: number;
  cashChange: number;
  items: SanitizedReceiptItem[];
  storeName?: string;
  storeAddress?: string;
}

export function sanitizeReceiptData(data: {
  invoiceNumber: string;
  date: string;
  cashierName: string;
  customerPhone?: string | null;
  paymentMethod: string;
  totalAmount: number;
  cashReceived?: number | null;
  cashChange?: number | null;
  items: {
    name?: string;
    product?: { name: string };
    quantity: number;
    unitPrice?: number;
    unit_price?: number;
    subtotal: number;
  }[];
  storeName?: string;
  storeAddress?: string;
}): SanitizedReceiptData {
  return {
    invoiceNumber: sanitizePlainText(data.invoiceNumber, 50),
    date: sanitizePlainText(data.date, 60),
    cashierName: sanitizePlainText(data.cashierName, 100),
    customerPhone: data.customerPhone ? sanitizePlainText(data.customerPhone, 25) : undefined,
    paymentMethod: sanitizePlainText(data.paymentMethod, 20),
    totalAmount: Number(data.totalAmount) || 0,
    cashReceived: Number(data.cashReceived) || 0,
    cashChange: Number(data.cashChange) || 0,
    storeName: sanitizePlainText(data.storeName || "Toko Grosir Sumber Rejeki", 100),
    storeAddress: sanitizePlainText(data.storeAddress || "Pasar Induk Kramat Jati Blok A5", 150),
    items: (data.items || []).map((item) => {
      const rawName = item.name || item.product?.name || "Produk";
      const unitPrice = Number(item.unitPrice ?? item.unit_price ?? 0);
      return {
        name: sanitizePlainText(rawName, 150),
        quantity: Math.max(1, Math.floor(Number(item.quantity) || 1)),
        unitPrice: Math.max(0, unitPrice),
        subtotal: Math.max(0, Number(item.subtotal) || 0),
      };
    }),
  };
}
