/**
 * Automated Verification Test Suite: Customer PII Masking & Privacy Guard (UU PDP - Modul 22)
 *
 * Verifies:
 * 1. Customer telephone number masking (maskPhoneNumber) across various Indonesian and international formats.
 * 2. Hyphenated and custom character masking options (maskChar, formatWithHyphen).
 * 3. Prevention of double-masking (idempotency check).
 * 4. Safe handling of invalid, empty, or short phone numbers without crashes.
 * 5. Customer name masking (maskCustomerName) according to UU PDP minimization standards.
 * 6. Email masking (maskEmail) protecting customer communication identifiers.
 * 7. Verification of isPIIMasked helper.
 * 8. Defense against shoulder surfing and staff harvesting with zero-friction WhatsApp integration.
 */

import {
  maskPhoneNumber,
  maskCustomerName,
  maskEmail,
  isPIIMasked,
  sanitizePhoneNumber,
  buildSafeWhatsAppUrl,
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
  console.log("==================================================================");
  console.log("🛡️  TEST SUITE: Customer PII Masking & Privacy Guard (UU PDP - Modul 22)");
  console.log("==================================================================\n");

  // 1. STANDARD INDONESIAN PHONE NUMBER MASKING
  console.log("[Test 1] maskPhoneNumber: Standard Indonesian Mobile Numbers");
  const phone1 = "081234567890";
  const masked1 = maskPhoneNumber(phone1);
  assert(masked1 === "0812****7890", `081234567890 masked correctly: "${masked1}"`);
  assert(!masked1.includes("3456"), "Middle digits (3456) are completely obscured");
  assert(masked1.startsWith("0812"), "Preserves recognizable operator prefix (0812)");
  assert(masked1.endsWith("7890"), "Preserves customer identification suffix (7890)");

  console.log("\n[Test 2] maskPhoneNumber: 11-digit and 10-digit Mobile Numbers");
  const phone11 = "08571234567";
  const masked11 = maskPhoneNumber(phone11);
  assert(masked11 === "0857****4567", `11-digit phone masked: "${masked11}"`);

  const phone10 = "0812345678";
  const masked10 = maskPhoneNumber(phone10);
  assert(masked10 === "0812****5678", `10-digit phone masked: "${masked10}"`);

  console.log("\n[Test 3] maskPhoneNumber: International +62 and 62 Prefixes");
  const phonePlus62 = "+6281234567890";
  const maskedPlus62 = maskPhoneNumber(phonePlus62);
  assert(maskedPlus62 === "+62812****7890", `+62 format masked correctly: "${maskedPlus62}"`);

  const phone62 = "6281234567890";
  const masked62 = maskPhoneNumber(phone62);
  assert(masked62 === "62812****7890", `62 without plus masked correctly: "${masked62}"`);

  console.log("\n[Test 4] maskPhoneNumber: Formatted Strings with Dashes and Spaces");
  const phoneFormatted = "0812-3456-7890";
  const maskedFormatted = maskPhoneNumber(phoneFormatted);
  assert(maskedFormatted === "0812****7890", `Formatted phone string cleaned & masked: "${maskedFormatted}"`);

  const phoneSpaced = "0812 3456 7890";
  const maskedSpaced = maskPhoneNumber(phoneSpaced);
  assert(maskedSpaced === "0812****7890", `Spaced phone string cleaned & masked: "${maskedSpaced}"`);

  console.log("\n[Test 5] maskPhoneNumber: Hyphenated Output Format Option");
  const maskedWithHyphen = maskPhoneNumber("081234567890", { formatWithHyphen: true });
  assert(maskedWithHyphen === "0812-****-7890", `Hyphenated format option works: "${maskedWithHyphen}"`);

  console.log("\n[Test 6] maskPhoneNumber: Custom Bullet Character (•)");
  const maskedBullet = maskPhoneNumber("081234567890", { maskChar: "•" });
  assert(maskedBullet === "0812••••7890", `Bullet character mask: "${maskedBullet}"`);

  console.log("\n[Test 7] maskPhoneNumber: Idempotency (Prevention of Double-Masking)");
  const alreadyMaskedAsterisk = "0812****7890";
  const reMasked = maskPhoneNumber(alreadyMaskedAsterisk);
  assert(reMasked === "0812****7890", `Already masked asterisk string returned untouched: "${reMasked}"`);

  const alreadyMaskedBullet = "0812••••7890";
  const reMaskedBullet = maskPhoneNumber(alreadyMaskedBullet);
  assert(reMaskedBullet === "0812••••7890", `Already masked bullet string returned untouched: "${reMaskedBullet}"`);

  console.log("\n[Test 8] maskPhoneNumber: Short, Falsy, and Invalid Inputs");
  assert(maskPhoneNumber(null) === "", "Null input returns empty string");
  assert(maskPhoneNumber(undefined) === "", "Undefined input returns empty string");
  assert(maskPhoneNumber("") === "", "Empty string returns empty string");
  assert(maskPhoneNumber("   ") === "", "Whitespace-only returns empty string");
  assert(maskPhoneNumber(false) === "", "Boolean returns empty string");
  assert(maskPhoneNumber("12345") === "***45", "Short 5-digit number masked safely");
  assert(maskPhoneNumber("12") === "**", "2-digit number masked safely");

  console.log("\n[Test 9] maskCustomerName: Customer Name Minimization (UU PDP)");
  const twoNames = maskCustomerName("Budi Santoso");
  assert(twoNames === "Budi S***", `Two-word name masked: "${twoNames}"`);

  const threeNames = maskCustomerName("Siti Nurhaliza Putri");
  assert(threeNames === "Siti N*** P***", `Three-word name masked: "${threeNames}"`);

  const singleName = maskCustomerName("Alexander");
  assert(singleName === "A***r", `Single name masked: "${singleName}"`);

  const shortName = maskCustomerName("Al");
  assert(shortName === "Al", `Short 2-char name left intact: "${shortName}"`);

  assert(maskCustomerName("") === "", "Empty name returns empty string");
  assert(maskCustomerName("Budi S***") === "Budi S***", "Already masked name is idempotent");

  console.log("\n[Test 10] maskEmail: Customer Email Minimization");
  const email1 = maskEmail("customer@example.com");
  assert(email1 === "c***r@example.com", `Standard email masked: "${email1}"`);

  const email2 = maskEmail("budi.santoso@gmail.com");
  assert(email2 === "b***o@gmail.com", `Long username email masked: "${email2}"`);

  assert(maskEmail("") === "", "Empty email returns empty string");

  console.log("\n[Test 11] isPIIMasked: Detection Helper");
  assert(isPIIMasked("0812****7890") === true, "Detects asterisk mask");
  assert(isPIIMasked("0812••••7890") === true, "Detects bullet mask");
  assert(isPIIMasked("081234567890") === false, "Returns false for unmasked number");
  assert(isPIIMasked("Budi Santoso") === false, "Returns false for unmasked name");
  assert(isPIIMasked("Budi S***") === true, "Returns true for masked name");

  console.log("\n[Test 12] Zero-Friction WhatsApp Integration Compatibility");
  // Ensure unmasked real phone creates valid HTTPS URL
  const realPhone = "081234567890";
  const sampleMsg = "Bukti Pembayaran TokoKu";
  const safeWaUrl = buildSafeWhatsAppUrl(realPhone, sampleMsg);
  assert(
    safeWaUrl.startsWith("https://wa.me/6281234567890?text="),
    `Valid WhatsApp URL generated: ${safeWaUrl.slice(0, 45)}...`
  );

  // Ensure masked phone is rejected by sanitizePhoneNumber to prevent corrupted URLs
  const maskedPhone = maskPhoneNumber(realPhone);
  const invalidWaUrl = buildSafeWhatsAppUrl(maskedPhone, sampleMsg);
  assert(
    invalidWaUrl === "",
    "buildSafeWhatsAppUrl rejects masked phone number directly, enforcing separation of display vs action"
  );

  console.log("\n==================================================================");
  console.log(`🎉 ALL ${passedCount} PRIVACY & PII MASKING TESTS PASSED! (Failed: ${failedCount})`);
  console.log("🔒 UU No. 27/2022 (UU PDP) Data Privacy Guard Successfully Verified.");
  console.log("==================================================================");
}

runTestSuite().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
