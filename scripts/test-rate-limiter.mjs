/**
 * Test Suite: Rate Limiting & Brute Force Protection (Modul 09)
 *
 * Verifies:
 * 1. Sliding window rate limiter state.
 * 2. Progressive delay threshold at attempt >= 3.
 * 3. Lockout trigger at 5 consecutive failed attempts (5 minutes / 300s).
 * 4. Status persistence across checks.
 * 5. Successful login resets counter.
 * 6. Countdown formatting helper.
 */

import {
  checkRateLimit,
  recordFailedAttempt,
  recordSuccessfulLogin,
  formatCountdown,
  MAX_FAILED_ATTEMPTS,
  PROGRESSIVE_DELAY_THRESHOLD,
} from "../src/lib/rateLimiter.ts";

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ PASSED: ${message}`);
  }
}

async function runTests() {
  console.log("=================================================");
  console.log("🛡️  TEST SUITE: Rate Limiting & Brute Force Protection");
  console.log("=================================================\n");

  const testUser = `attacker_test_${Date.now()}`;

  // 1. Initial State Check
  console.log("[Test 1] Initial state for new user/client");
  const initial = checkRateLimit(testUser);
  assert(initial.isLocked === false, "User should not be locked initially");
  assert(initial.remainingAttempts === 5, "Initial remaining attempts must be 5");
  assert(initial.shouldDelay === false, "Progressive delay should be false initially");
  assert(initial.retryAfterSeconds === 0, "Initial retry seconds must be 0");

  // 2. Failed Attempt 1
  console.log("\n[Test 2] Failed attempt 1");
  const fail1 = recordFailedAttempt(testUser);
  assert(fail1.isLocked === false, "User should not be locked after attempt 1");
  assert(fail1.remainingAttempts === 4, "Remaining attempts must be 4");
  assert(fail1.shouldDelay === false, "Progressive delay not triggered yet (<3)");

  // 3. Failed Attempt 2
  console.log("\n[Test 3] Failed attempt 2");
  const fail2 = recordFailedAttempt(testUser);
  assert(fail2.isLocked === false, "User should not be locked after attempt 2");
  assert(fail2.remainingAttempts === 3, "Remaining attempts must be 3");
  assert(fail2.shouldDelay === false, "Progressive delay not triggered yet (<3)");

  // 4. Failed Attempt 3 - Progressive Delay Threshold
  console.log("\n[Test 4] Failed attempt 3 (Progressive delay threshold)");
  const fail3 = recordFailedAttempt(testUser);
  assert(fail3.isLocked === false, "User should not be locked after attempt 3");
  assert(fail3.remainingAttempts === 2, "Remaining attempts must be 2");
  assert(fail3.shouldDelay === true, "Progressive delay penalty must trigger at attempt >= 3");

  // 5. Failed Attempt 4
  console.log("\n[Test 5] Failed attempt 4");
  const fail4 = recordFailedAttempt(testUser);
  assert(fail4.isLocked === false, "User should not be locked after attempt 4");
  assert(fail4.remainingAttempts === 1, "Remaining attempts must be 1");
  assert(fail4.shouldDelay === true, "Progressive delay penalty persists");

  // 6. Failed Attempt 5 - Account Lockout Trigger
  console.log("\n[Test 6] Failed attempt 5 (Lockout trigger)");
  const fail5 = recordFailedAttempt(testUser);
  assert(fail5.isLocked === true, "User MUST be locked out after 5 consecutive failures");
  assert(fail5.remainingAttempts === 0, "Remaining attempts must be 0 when locked");
  assert(fail5.retryAfterSeconds >= 290 && fail5.retryAfterSeconds <= 300, `RetryAfterSeconds (${fail5.retryAfterSeconds}) should be ~300s (5 min)`);

  // 7. Verify Lockout Persistence
  console.log("\n[Test 7] Verify lockout persistence on subsequent checks");
  const checkWhileLocked = checkRateLimit(testUser);
  assert(checkWhileLocked.isLocked === true, "Rate limit check must return isLocked=true");
  assert(checkWhileLocked.remainingAttempts === 0, "Remaining attempts must stay 0");
  assert(checkWhileLocked.retryAfterSeconds > 0, "RetryAfterSeconds must be positive during lockout");

  // 8. Countdown Formatter Verification
  console.log("\n[Test 8] Verify countdown formatting helper");
  assert(formatCountdown(300) === "05:00", `300s should format to 05:00 (got: ${formatCountdown(300)})`);
  assert(formatCountdown(299) === "04:59", `299s should format to 04:59 (got: ${formatCountdown(299)})`);
  assert(formatCountdown(45) === "00:45", `45s should format to 00:45 (got: ${formatCountdown(45)})`);
  assert(formatCountdown(0) === "00:00", `0s should format to 00:00 (got: ${formatCountdown(0)})`);

  // 9. Reset on Successful Login
  console.log("\n[Test 9] Reset attempts upon successful login");
  const legitUser = `legit_user_${Date.now()}`;
  recordFailedAttempt(legitUser);
  recordFailedAttempt(legitUser);
  const midState = checkRateLimit(legitUser);
  assert(midState.remainingAttempts === 3, "Legit user should have 3 remaining attempts before success");

  recordSuccessfulLogin(legitUser);
  const postSuccess = checkRateLimit(legitUser);
  assert(postSuccess.isLocked === false, "Legit user should not be locked");
  assert(postSuccess.remainingAttempts === 5, "Remaining attempts must reset to 5 after successful login");

  console.log("\n🎉 ALL 9 RATE LIMITING & BRUTE FORCE PROTECTION TESTS PASSED SUCCESSFULLY!\n");
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
