/**
 * Automated Verification Test Suite: XSS Sanitization & Safe WhatsApp URL Encoding (Modul 16)
 *
 * Verifies:
 * 1. HTML character escaping (escapeHtml) against Reflected & Stored XSS vectors.
 * 2. Tag stripping and dangerous protocol neutralization (stripHtml).
 * 3. Unicode Bidi override spoofing (\u202E) and zero-width character removal.
 * 4. Single-line and multi-line text sanitization (sanitizePlainText, sanitizeMultiLineText).
 * 5. E.164 Indonesian phone number normalization and validation (sanitizePhoneNumber, isValidPhoneNumber).
 * 6. Secure WhatsApp URL generation (buildSafeWhatsAppUrl) preventing protocol smuggling and URL injection.
 * 7. Receipt data structure sanitization (sanitizeReceiptData) for thermal & digital PNG generation.
 */

import {
  escapeHtml,
  stripHtml,
  sanitizePlainText,
  sanitizeMultiLineText,
  sanitizePhoneNumber,
  isValidPhoneNumber,
  buildSafeWhatsAppUrl,
  sanitizeReceiptData,
} from "../src/lib/sanitizer.ts";

let passedCount = 0;
let failedCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASSED: ${message}`);
    passedCount++;
  } else {
    console.error(`  ❌ FAILED: ${message}`);
    failedCount++;
    process.exit(1);
  }
}

async function runTestSuite() {
  console.log("==========================================================");
  console.log("🛡️  TEST SUITE: XSS Sanitization & Safe WhatsApp URL (Modul 16)");
  console.log("==========================================================\n");

  // 1. ESCAPE HTML TESTS
  console.log("[Test 1] escapeHtml: Core HTML Metacharacters Escaping");
  const rawSpecial = `<div class="test" id='item' data-val=\`1\` / &>`;
  const escaped = escapeHtml(rawSpecial);
  assert(!escaped.includes("<"), "No unescaped '<' remains");
  assert(!escaped.includes(">"), "No unescaped '>' remains");
  assert(!escaped.includes('"'), 'No unescaped double quotes remain');
  assert(!escaped.includes("'"), "No unescaped single quotes remain");
  assert(!escaped.includes("`"), "No unescaped backticks remain");
  assert(escaped.includes("&lt;") && escaped.includes("&gt;"), "Proper HTML entities produced");

  console.log("\n[Test 2] escapeHtml: Script and Event Handler Neutralization");
  const xssPayloads = [
    "<script>alert('XSS')</script>",
    `<img src=x onerror="alert(document.cookie)">`,
    `<svg/onload=alert(1)>`,
    `"><script src="http://attacker.com/evil.js"></script>`,
  ];
  for (const payload of xssPayloads) {
    const safeOutput = escapeHtml(payload);
    assert(
      !safeOutput.includes("<script") && !safeOutput.includes("<img") && !safeOutput.includes("<svg"),
      `Payload safely escaped: ${payload.slice(0, 30)}...`
    );
  }

  // 2. STRIP HTML & SCRIPT CLEANING
  console.log("\n[Test 3] stripHtml: Tag Stripping and Content Purging");
  const scriptContent = "Normal Text <script>evilPayload()</script> More Text";
  assert(stripHtml(scriptContent) === "Normal Text  More Text", "Script block and contents completely purged");

  const iframeContent = "Struk Belanja <iframe src='http://evil.com'></iframe> TokoKu";
  assert(stripHtml(iframeContent) === "Struk Belanja  TokoKu", "Iframe block completely purged");

  const inlineTags = "Produk <b>Minyak Goreng</b> <i>Bimoli 2L</i>";
  assert(stripHtml(inlineTags) === "Produk Minyak Goreng Bimoli 2L", "Inline formatting tags stripped cleanly");

  console.log("\n[Test 4] stripHtml: Protocol Smuggling Neutralization");
  const jsProtocol = "javascript:alert(1)";
  assert(stripHtml(jsProtocol) === "alert(1)", "javascript: protocol prefix neutralized");
  const dataProtocol = "data:text/html,<script>evil()</script>";
  assert(!stripHtml(dataProtocol).includes("data:"), "data: protocol prefix neutralized");

  // 3. UNICODE SPOOFING & CONTROL CHARACTERS
  console.log("\n[Test 5] stripHtml: Unicode Bidi Override & Zero-Width Stripping");
  // \u202E is Right-to-Left Override used to flip invoice numbers or file extensions
  const bidiPayload = "Invoice_\u202E999_Safe";
  const cleanedBidi = stripHtml(bidiPayload);
  assert(!cleanedBidi.includes("\u202E"), "Bidi override (\\u202E) removed");
  assert(cleanedBidi === "Invoice_999_Safe", "Content preserved without bidi character");

  // Zero-width space \u200B and BOM \uFEFF
  const zeroWidthPayload = "Toko\u200BKu\uFEFF POS";
  assert(stripHtml(zeroWidthPayload) === "TokoKu POS", "Zero-width spaces stripped");

  // Null byte \u0000
  const nullBytePayload = "Cashier\u0000_Admin";
  assert(stripHtml(nullBytePayload) === "Cashier_Admin", "Null byte stripped");

  // 4. PLAIN TEXT & MULTI-LINE SANITIZATION
  console.log("\n[Test 6] sanitizePlainText: Whitespace & Length Normalization");
  const messyText = "  <script>evil()</script>  Beras   Pandan   Wangi    5kg   ";
  assert(sanitizePlainText(messyText) === "Beras Pandan Wangi 5kg", "Collapsed whitespace and trimmed");

  const longText = "A".repeat(500);
  assert(sanitizePlainText(longText, 50).length === 50, "Enforced max length boundary");

  console.log("\n[Test 7] sanitizeMultiLineText: Preserve Linebreaks, Collapse Excess");
  const multiLine = "Line 1\n\n\n\n\nLine 2\r\nLine 3";
  const cleanedMulti = sanitizeMultiLineText(multiLine);
  assert(cleanedMulti === "Line 1\n\nLine 2\nLine 3", "Multi-line breaks normalized to max 2");

  // 5. PHONE NUMBER NORMALIZATION
  console.log("\n[Test 8] sanitizePhoneNumber: Standard Indonesian Phone Formats");
  assert(sanitizePhoneNumber("081234567890") === "6281234567890", "08... converted to 628...");
  assert(sanitizePhoneNumber("+62 812-3456-7890") === "6281234567890", "+62 with spaces & hyphens normalized");
  assert(sanitizePhoneNumber("81234567890") === "6281234567890", "8... without zero converted to 628...");
  assert(sanitizePhoneNumber("6281234567890") === "6281234567890", "62... retained as 62...");
  assert(isValidPhoneNumber("081234567890") === true, "isValidPhoneNumber returns true for valid phone");

  console.log("\n[Test 9] sanitizePhoneNumber: Malformed & Attack Payloads Rejection");
  assert(sanitizePhoneNumber("0812") === "", "Too short phone (< 10 digits) rejected");
  assert(sanitizePhoneNumber("081234567890123456789") === "", "Too long phone (> 15 digits) rejected");
  assert(sanitizePhoneNumber("<script>alert(1)</script>") === "", "XSS injection string rejected");
  assert(sanitizePhoneNumber("abcdefghijk") === "", "Alphabetic string rejected");
  assert(sanitizePhoneNumber(null) === "", "Null input handled safely as empty");
  assert(sanitizePhoneNumber(undefined) === "", "Undefined input handled safely as empty");
  assert(isValidPhoneNumber("abc") === false, "isValidPhoneNumber returns false for invalid phone");

  // 6. SAFE WHATSAPP URL GENERATION
  console.log("\n[Test 10] buildSafeWhatsAppUrl: Proper HTTPS wa.me URL Assembly");
  const testPhone = "0812-3456-7890";
  const testMessage = "*BUKTI PEMBAYARAN TOKOKU*\nTotal: Rp 50.000\nTerima kasih!";
  const safeUrl = buildSafeWhatsAppUrl(testPhone, testMessage);

  assert(safeUrl.startsWith("https://wa.me/6281234567890?text="), "URL strictly targets https://wa.me with normalized phone");
  assert(!safeUrl.includes("<") && !safeUrl.includes(">"), "No unescaped angle brackets in URL");
  assert(safeUrl.includes(encodeURIComponent("BUKTI PEMBAYARAN TOKOKU")), "Message correctly URI-encoded");

  console.log("\n[Test 11] buildSafeWhatsAppUrl: Injection Payloads in WhatsApp Text");
  const maliciousMessage = "Struk TokoKu <script>document.location='http://attacker.com'</script> Beli Gula";
  const safeUrlWithAttack = buildSafeWhatsAppUrl(testPhone, maliciousMessage);
  assert(!decodeURIComponent(safeUrlWithAttack).includes("<script>"), "Script tag stripped from decoded text");
  assert(decodeURIComponent(safeUrlWithAttack).includes("Beli Gula"), "Legitimate text preserved");

  console.log("\n[Test 12] buildSafeWhatsAppUrl: Invalid Phone Rejection");
  const invalidUrl = buildSafeWhatsAppUrl("invalid-phone", "Halo");
  assert(invalidUrl === "", "Returns empty string when phone number is invalid");

  // 7. RECEIPT DATA STRUCTURE SANITIZATION
  console.log("\n[Test 13] sanitizeReceiptData: Full POS Receipt Payload Defense");
  const dirtyReceipt = {
    invoiceNumber: "INV-20261018-001<script>alert(1)</script>",
    date: "18 Okt 2026, 21:00\u202E",
    cashierName: "Budi <b>Kasir</b>",
    customerPhone: "0812-9999-8888",
    paymentMethod: "Tunai",
    totalAmount: 35000,
    cashReceived: 50000,
    cashChange: 15000,
    storeName: "TokoKu <img src=x onerror=alert(1)>",
    storeAddress: "Pasar Kramat Jati\0 Blok A",
    items: [
      {
        name: "Minyak Goreng <script>evil()</script>2L",
        quantity: 2,
        unitPrice: 15000,
        subtotal: 30000,
      },
      {
        product: { name: "Gula Pasir 1kg" },
        quantity: 1,
        unit_price: 5000,
        subtotal: 5000,
      },
    ],
  };

  const cleanReceipt = sanitizeReceiptData(dirtyReceipt);
  assert(cleanReceipt.invoiceNumber === "INV-20261018-001", "Invoice number stripped of <script>");
  assert(!cleanReceipt.date.includes("\u202E"), "Receipt date stripped of Bidi override");
  assert(cleanReceipt.cashierName === "Budi Kasir", "Cashier name stripped of <b> tag");
  assert(cleanReceipt.storeName === "TokoKu", "Store name stripped of <img> tag");
  assert(!cleanReceipt.storeAddress.includes("\0"), "Store address stripped of null byte");
  assert(cleanReceipt.items[0].name === "Minyak Goreng 2L", "Item name stripped of script tag");
  assert(cleanReceipt.items[1].name === "Gula Pasir 1kg", "Fallback product.name properly extracted and sanitized");
  assert(cleanReceipt.totalAmount === 35000, "Numeric total preserved");

  console.log("\n==========================================================");
  console.log(`🎉 ALL ${passedCount} XSS SANITIZATION & WA URL TESTS PASSED!`);
  console.log("==========================================================\n");
}

runTestSuite().catch((err) => {
  console.error("Test Suite crashed with unexpected error:", err);
  process.exit(1);
});
