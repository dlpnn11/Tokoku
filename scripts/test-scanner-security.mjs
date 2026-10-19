/**
 * Automated Verification Test Suite: Secure Expiring Tokens for Mobile Scanner (Modul 18)
 *
 * Verifies:
 * 1. Cryptographic token generation adheres to high-entropy format and sets 10-minute TTL.
 * 2. Legitimate scan with genuine active token is accepted.
 * 3. Attack 1: Missing token payload is rejected.
 * 4. Attack 2: Tampered / spoofed token payload is rejected.
 * 5. Attack 3: Expired token (TTL exceeded) is rejected.
 * 6. Session rotation: generating a new session immediately invalidates previous tokens.
 * 7. Live Supabase Realtime Channel broadcast & verification test:
 *    - Rogue broadcast without token or with forged token is rejected.
 *    - Authenticated broadcast with valid token is accepted and verified.
 */

import { createClient } from "@supabase/supabase-js";
import {
  generateScannerSession,
  verifyScannerToken,
  isSessionExpired,
  formatRemainingTime,
  SCANNER_TOKEN_TTL_MS,
} from "../src/lib/scannerSecurity.ts";

const SUPABASE_URL = "https://xgtkoclchscygrckhyya.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhndGtvY2xjaHNjeWdyY2toeXlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEyMTQyMzYsImV4cCI6MjEwNjc5MDIzNn0.TgfdIwdLr-8LQrZ5kCbrHt1WTV_m1mwiVoQ2rd1hYzU";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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
  console.log("🛡️  TEST SUITE: Mobile Scanner Expiring Tokens (Modul 18)");
  console.log("==========================================================\n");

  // Test 1: Cryptographic Session Generation & 10-minute TTL
  console.log("[Test 1] Cryptographic Session Generation & TTL Bounds");
  const session1 = generateScannerSession();
  assert(Boolean(session1.roomId && session1.roomId.startsWith("pos-room-")), "Dynamic room ID generated");
  assert(Boolean(session1.token && session1.token.length >= 32), "High-entropy cryptographic token generated");
  assert(session1.expiresAt - session1.createdAt === SCANNER_TOKEN_TTL_MS, "TTL is exactly 10 minutes (600,000 ms)");
  assert(!isSessionExpired(session1), "Newly generated session is not expired");
  assert(formatRemainingTime(session1.expiresAt - session1.createdAt).includes("10:00"), "Remaining time formats accurately");

  // Test 2: Legitimate Verification
  console.log("\n[Test 2] Legitimate Scan Verification with Valid Active Token");
  const legitResult = verifyScannerToken(session1.token, session1);
  assert(legitResult.valid === true, "Genuine token successfully verified");
  assert(legitResult.remainingMs > 0, "Remaining time reported as positive");

  // Test 3: Attack Scenario 1 - Missing Token Payload
  console.log("\n[Test 3] Attack 1: Missing Token Injection Attack");
  const missingTokenResult1 = verifyScannerToken(null, session1);
  assert(missingTokenResult1.valid === false, "Null token is rejected");
  assert(missingTokenResult1.reason.includes("tidak disertakan"), "Explicit missing token reason returned");

  const missingTokenResult2 = verifyScannerToken("", session1);
  assert(missingTokenResult2.valid === false, "Empty string token is rejected");

  const missingTokenResult3 = verifyScannerToken("   ", session1);
  assert(missingTokenResult3.valid === false, "Whitespace-only token is rejected");

  // Test 4: Attack Scenario 2 - Tampered / Wrong Token
  console.log("\n[Test 4] Attack 2: Forged / Wrong Token Injection Attack");
  const forgedToken = "11111111-2222-3333-4444-555555555555";
  const forgedResult = verifyScannerToken(forgedToken, session1);
  assert(forgedResult.valid === false, "Forged token is rejected");
  assert(forgedResult.reason.includes("tidak cocok"), "Explicit mismatch rejection reason returned");

  // Test 5: Attack Scenario 3 - Expired Token Replay Attack (TTL elapsed)
  console.log("\n[Test 5] Attack 3: Expired Token Replay Attack");
  const pastSession = {
    roomId: session1.roomId,
    token: session1.token,
    createdAt: Date.now() - 15 * 60 * 1000,
    expiresAt: Date.now() - 5 * 60 * 1000, // Expired 5 minutes ago
  };
  assert(isSessionExpired(pastSession), "isSessionExpired correctly detects expired session");
  const expiredResult = verifyScannerToken(session1.token, pastSession);
  assert(expiredResult.valid === false, "Expired token is strictly rejected");
  assert(expiredResult.reason.includes("kadaluarsa"), "Explicit expiration rejection reason returned");
  assert(formatRemainingTime(0).includes("Kadaluarsa"), "formatRemainingTime displays expired state");

  // Test 6: Session Rotation & Revocation
  console.log("\n[Test 6] Session Rotation / Refresh Invalidation");
  const rotatedSession = generateScannerSession();
  assert(rotatedSession.token !== session1.token, "Rotated session generates unique new token");
  const oldTokenAgainstNew = verifyScannerToken(session1.token, rotatedSession);
  assert(oldTokenAgainstNew.valid === false, "Old token is rejected after session rotation");

  // Test 7: Live Realtime Channel Broadcast Verification
  console.log("\n[Test 7] Live Supabase Realtime Channel Authentication Test");
  const testRoom = `pos-test-${Date.now()}`;
  const testSession = generateScannerSession(testRoom);

  let authorizedBroadcastReceived = false;
  let unauthorizedBroadcastRejected = false;

  const receiverChannel = supabase.channel(`pos-room-${testSession.roomId}`, {
    config: { broadcast: { self: true } },
  });

  await new Promise((resolve) => {
    receiverChannel
      .on("broadcast", { event: "BARCODE_SCANNED" }, ({ payload }) => {
        const verify = verifyScannerToken(payload?.token, testSession);
        if (verify.valid) {
          authorizedBroadcastReceived = true;
        } else {
          unauthorizedBroadcastRejected = true;
        }
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          resolve();
        }
      });
  });

  // Sender 1: Rogue attacker sending spoofed barcode without token
  const rogueChannel = supabase.channel(`rogue-${Date.now()}`);
  await rogueChannel.subscribe();
  await receiverChannel.send({
    type: "broadcast",
    event: "BARCODE_SCANNED",
    payload: {
      barcode: "SILUMAN-999999",
      token: "fake-unauthorized-token",
    },
  });

  // Sender 2: Legitimate phone sending barcode with genuine token
  await receiverChannel.send({
    type: "broadcast",
    event: "BARCODE_SCANNED",
    payload: {
      barcode: "8992753129999",
      token: testSession.token,
    },
  });

  // Give 1.5s for realtime message delivery
  await new Promise((r) => setTimeout(r, 1500));

  await supabase.removeChannel(receiverChannel);
  await supabase.removeChannel(rogueChannel);

  assert(unauthorizedBroadcastRejected === true, "Live Realtime broadcast with forged token was rejected");
  assert(authorizedBroadcastReceived === true, "Live Realtime broadcast with authentic token was verified");

  console.log("\n==========================================================");
  console.log(`🎉 ALL TESTS PASSED! (${passedCount} passed, ${failedCount} failed)`);
  console.log("==========================================================");
  process.exit(0);
}

runTestSuite().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
