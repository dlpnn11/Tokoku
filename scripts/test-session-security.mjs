/**
 * Automated Verification Test Suite for MODUL 06:
 * Anti-Tampering Session & Secure HttpOnly Storage
 *
 * Verifies:
 * 1. Cryptographic HMAC-SHA256 signature generation and constant-time verification.
 * 2. Protection against raw console injection (Missing signature envelope).
 * 3. Protection against role elevation within existing envelope (Signature mismatch).
 * 4. Protection against arbitrary JSON mutation / corrupt payload.
 * 5. Automatic storage purge and tamper containment.
 */

import {
  generateCanonicalSessionString,
  signSessionPayload,
  verifySessionPayload,
  verifyStorageData,
  constantTimeCompare,
  SESSION_STORAGE_KEY,
} from "../src/lib/sessionSecurity.ts";

let passedCount = 0;
let failedCount = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passedCount++;
  } else {
    console.error(`  ❌ FAIL: ${testName}`);
    failedCount++;
  }
}

async function runTestSuite() {
  console.log("\n🔐 ===================================================");
  console.log("   TEST SUITE: MODUL 06 ANTI-TAMPERING & SESSION SECURITY");
  console.log("===================================================\n");

  // 1. Timing-Safe String Comparison
  console.log("--- 1. Testing Timing-Safe Equality Comparison ---");
  assert(constantTimeCompare("abc123xyz", "abc123xyz") === true, "Identical strings match");
  assert(constantTimeCompare("abc123xyz", "abc123xyw") === false, "Different strings do not match");
  assert(constantTimeCompare("short", "much_longer_string") === false, "Different length strings fail safely");

  // 2. Canonical Payload Determinism
  console.log("\n--- 2. Testing Canonical Payload Generation ---");
  const userKasir = {
    id: "22222222-2222-2222-2222-222222222222",
    username: "kasir",
    role: "kasir",
    full_name: "Ani Rahayu",
  };
  const canonicalKasir = generateCanonicalSessionString(userKasir, true);
  assert(
    canonicalKasir === "CANONICAL_V1:id=22222222-2222-2222-2222-222222222222|user=kasir|role=kasir|auth=true",
    "Canonical string for Kasir is deterministic and standardized"
  );

  // 3. HMAC-SHA256 Signing & Verification
  console.log("\n--- 3. Testing HMAC-SHA256 Signing & Verification ---");
  const signature = await signSessionPayload(canonicalKasir);
  assert(typeof signature === "string" && signature.length === 64, "Signature is valid 64-character hex string");

  const isSigValid = await verifySessionPayload(canonicalKasir, signature);
  assert(isSigValid === true, "Legitimate Kasir signature verifies successfully");

  const tamperedCanonical = generateCanonicalSessionString(
    { ...userKasir, role: "pemilik" },
    true
  );
  const isTamperedSigValid = await verifySessionPayload(tamperedCanonical, signature);
  assert(isTamperedSigValid === false, "Signature verification fails when role is tampered from kasir to pemilik");

  // 4. Legitimate Storage Verification
  console.log("\n--- 4. Testing Legitimate Storage Envelope Verification ---");
  const legitimateEnvelope = JSON.stringify({
    state: {
      currentUser: userKasir,
      isAuthenticated: true,
    },
    version: 0,
    _integrity: {
      signature,
      timestamp: Date.now(),
      algorithm: "HMAC-SHA256",
    },
  });

  const legitimateCheck = await verifyStorageData(legitimateEnvelope);
  assert(legitimateCheck.isValid === true, "Legitimate session envelope accepted as valid");
  assert(legitimateCheck.role === "kasir", "Authoritative role accurately decoded as kasir");

  // 5. Exploit Attack 1: Raw Console Injection from User Prompt
  console.log("\n--- 5. Testing Attack Scenario 1: Console Injection without Signature ---");
  const exploitPayload1 = JSON.stringify({
    state: { currentUser: { role: "pemilik" }, isAuthenticated: true },
  });

  const attackCheck1 = await verifyStorageData(exploitPayload1);
  assert(attackCheck1.isValid === false, "Exploit payload 1 is rejected");
  assert(
    attackCheck1.reason === "missing_envelope",
    "Identifies missing_envelope when attacker runs localStorage.setItem without integrity envelope"
  );

  // 6. Exploit Attack 2: In-Place Role Privilege Escalation (Signature Mismatch)
  console.log("\n--- 6. Testing Attack Scenario 2: Modifying role to 'pemilik' inside envelope ---");
  const parsedEnvelope = JSON.parse(legitimateEnvelope);
  parsedEnvelope.state.currentUser.role = "pemilik"; // Attacker attempts privilege escalation
  const exploitPayload2 = JSON.stringify(parsedEnvelope);

  const attackCheck2 = await verifyStorageData(exploitPayload2);
  assert(attackCheck2.isValid === false, "Privilege escalation attempt rejected");
  assert(
    attackCheck2.reason === "signature_mismatch",
    "Identifies signature_mismatch when attacker edits role to pemilik"
  );

  // 7. Exploit Attack 3: Corrupted or Truncated JSON
  console.log("\n--- 7. Testing Corrupted JSON Storage ---");
  const attackCheck3 = await verifyStorageData("{ malformed_json...");
  assert(attackCheck3.isValid === false && attackCheck3.reason === "corrupt_json", "Corrupt JSON rejected safely");

  // Final Summary
  console.log("\n===================================================");
  console.log(`TOTAL TESTS: ${passedCount + failedCount}`);
  console.log(`✅ PASSED: ${passedCount}`);
  console.log(`❌ FAILED: ${failedCount}`);
  console.log("===================================================\n");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error("Test execution error:", err);
  process.exit(1);
});
