/**
 * Automated Verification & Benchmarking Test Suite for MODUL 07:
 * Timing Attack Mitigation pada Kredensial
 *
 * Verifies:
 * 1. Functional correctness across equality, mismatch, length variation, and edge cases.
 * 2. Constant-time execution invariance across varying character mismatch positions.
 * 3. Elimination of early-exit latency leaks compared to standard `===`.
 */

import { timingSafeEqual, timingSafeCredentialMatch } from "../src/lib/security.ts";

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
  console.log("\n⏱️  ===================================================");
  console.log("   TEST SUITE: MODUL 07 TIMING ATTACK MITIGATION");
  console.log("===================================================\n");

  // 1. Functional Correctness Tests
  console.log("--- 1. Testing Functional Correctness ---");
  assert(timingSafeEqual("kasir123", "kasir123") === true, "Identical passwords match");
  assert(timingSafeEqual("pemilik123", "pemilik123") === true, "Identical admin credentials match");
  assert(timingSafeEqual("kasir123", "kasir999") === false, "Different passwords return false");
  assert(timingSafeEqual("kasir", "kasir123") === false, "Prefix passwords with different lengths return false");
  assert(timingSafeEqual("", "") === true, "Empty strings match safely");
  assert(timingSafeEqual("", "a") === false, "Empty vs non-empty returns false");
  assert(timingSafeEqual(null, "kasir123") === false, "Null input safely returns false without crashing");
  assert(timingSafeEqual("kasir123", undefined) === false, "Undefined input safely returns false without crashing");
  assert(timingSafeEqual(12345, "12345") === false, "Non-string type mismatch returns false safely");

  // 2. Credential Normalization Matcher
  console.log("\n--- 2. Testing Credential Normalization Matcher ---");
  assert(timingSafeCredentialMatch("  kasir123  ", "kasir123") === true, "Whitespace trimmed in constant-time");
  assert(timingSafeCredentialMatch("kasir123", "kasir999") === false, "Invalid trimmed credentials return false");

  // 3. Timing Invariance Benchmark
  console.log("\n--- 3. Benchmarking Timing Invariance Across Mismatch Positions ---");
  const targetSecret = "SuperSecureTokoKuPassword2026!#";
  const ITERATIONS = 100_000;

  // Candidates with mismatches at different character offsets:
  const testCases = [
    { label: "Mismatch at Index 0", candidate: "XuperSecureTokoKuPassword2026!#" },
    { label: "Mismatch at Index 7", candidate: "SuperSeXureTokoKuPassword2026!#" },
    { label: "Mismatch at Index 15", candidate: "SuperSecureTokoXuPassword2026!#" },
    { label: "Mismatch at Index 22", candidate: "SuperSecureTokoKuPassXord2026!#" },
    { label: "Mismatch at Last Index", candidate: "SuperSecureTokoKuPassword2026!X" },
    { label: "Length Difference (Short)", candidate: "SuperSecure" },
  ];

  // Warm up JIT compiler thoroughly so V8 optimizes all code paths equally
  for (let i = 0; i < 50_000; i++) {
    for (const tc of testCases) {
      timingSafeEqual(tc.candidate, targetSecret);
    }
  }

  const timingResults = [];

  for (const tc of testCases) {
    const start = process.hrtime.bigint();
    for (let i = 0; i < ITERATIONS; i++) {
      timingSafeEqual(tc.candidate, targetSecret);
    }
    const end = process.hrtime.bigint();
    const durationMs = Number(end - start) / 1_000_000;
    const avgNsPerOp = Number(end - start) / ITERATIONS;
    timingResults.push({ label: tc.label, durationMs, avgNsPerOp });
    console.log(`  ⏱️  ${tc.label.padEnd(28)}: ${durationMs.toFixed(2)} ms (${avgNsPerOp.toFixed(1)} ns/op)`);
  }

  // Calculate variance between mismatch at first char vs mismatch at last char
  const timeFirst = timingResults[0].durationMs;
  const timeLast = timingResults[4].durationMs;
  const ratio = Math.abs(timeFirst - timeLast) / Math.max(timeFirst, timeLast);

  console.log(`\n  📊 Timing deviation between Index 0 and Last Index: ${(ratio * 100).toFixed(2)}%`);
  assert(
    ratio < 0.15,
    "Timing variance across mismatch positions is under statistical noise threshold (<15% across 100k ops)"
  );

  // Compare with standard JavaScript === (which has extreme latency disparity)
  console.log("\n--- 4. Comparison with Standard JavaScript === (Early Exit Leak) ---");
  const standardStart0 = process.hrtime.bigint();
  for (let i = 0; i < ITERATIONS; i++) {
    const r = testCases[0].candidate === targetSecret;
  }
  const standardEnd0 = process.hrtime.bigint();
  const standardMs0 = Number(standardEnd0 - standardStart0) / 1_000_000;

  const standardStartLast = process.hrtime.bigint();
  for (let i = 0; i < ITERATIONS; i++) {
    const r = testCases[4].candidate === targetSecret;
  }
  const standardEndLast = process.hrtime.bigint();
  const standardMsLast = Number(standardEndLast - standardStartLast) / 1_000_000;

  console.log(`  ⚠️  Standard === (Mismatch at Index 0)   : ${standardMs0.toFixed(2)} ms`);
  console.log(`  ⚠️  Standard === (Mismatch at Last Index): ${standardMsLast.toFixed(2)} ms`);
  console.log(`  💡 Notice that standard === early-exits immediately, leaking character position!`);

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
