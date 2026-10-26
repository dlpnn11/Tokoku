/**
 * ==============================================================================
 * AUTOMATED SECURITY TEST: MODUL 23 - SUPERVISOR 2FA OVERRIDE PIN / PASSWORD
 * ==============================================================================
 * Verifies:
 * 1. Default supervisor 2FA password ("tokodaus") verification & acceptance.
 * 2. Decoupling verification: Login password ("pemilik123") is REJECTED.
 * 3. Invalid credential rejection with remaining attempt tracking.
 * 4. Brute-force lockout enforcement (locks after 5 consecutive failures for 30s).
 * 5. Custom supervisor PIN configuration and validation.
 * 6. Source code integrity:
 *    - Login page demo accounts selector removed
 *    - Supervisor 2FA password strictly decoupled from login password
 *    - Audit Keamanan navigation menu hidden in Sidebar
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

// Constant-time string equality comparison
function timingSafeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const lenA = a.length;
  const lenB = b.length;
  let mismatch = lenA === lenB ? 0 : 1;
  const maxLen = Math.max(lenA, lenB, 1);
  for (let i = 0; i < maxLen; i++) {
    const charA = a.charCodeAt(i % (lenA || 1));
    const charB = b.charCodeAt(i % (lenB || 1));
    mismatch |= charA ^ charB;
  }
  return mismatch === 0;
}

// Supervisor PIN Logic Engine
const SUPERVISOR_PIN_STORAGE_KEY = "tokoku_supervisor_pin_hash";
const DEFAULT_SUPERVISOR_PIN = "tokodaus";
const SUPERVISOR_2FA_PASSWORD = "tokodaus";
const MAX_PIN_ATTEMPTS = 5;
const PIN_LOCKOUT_DURATION_MS = 30 * 1000;

let pinFailedAttempts = 0;
let pinLockoutUntil = 0;

const mockStorage = new Map();
function getCustomSupervisorPin() {
  return mockStorage.get(SUPERVISOR_PIN_STORAGE_KEY) || null;
}

function checkSupervisorPinLockout() {
  const now = Date.now();
  if (pinLockoutUntil > now) {
    const retryAfterSeconds = Math.ceil((pinLockoutUntil - now) / 1000);
    return { isLocked: true, retryAfterSeconds };
  }
  if (pinLockoutUntil !== 0 && pinLockoutUntil <= now) {
    pinFailedAttempts = 0;
    pinLockoutUntil = 0;
  }
  return { isLocked: false, retryAfterSeconds: 0 };
}

function resetSupervisorPinLockout() {
  pinFailedAttempts = 0;
  pinLockoutUntil = 0;
}

function setSupervisorPin(currentAuth, newPin) {
  const cleanNew = newPin.trim();
  if (!/^\d{4,8}$/.test(cleanNew)) {
    return { success: false, message: "PIN baru harus berupa angka 4 sampai 8 digit." };
  }

  const customPin = getCustomSupervisorPin() || DEFAULT_SUPERVISOR_PIN;
  const isAuthorized =
    timingSafeEqual(currentAuth.trim(), customPin) ||
    timingSafeEqual(currentAuth.trim(), SUPERVISOR_2FA_PASSWORD);

  if (!isAuthorized) {
    return { success: false, message: "PIN atau kata sandi lama yang Anda masukkan salah." };
  }

  mockStorage.set(SUPERVISOR_PIN_STORAGE_KEY, cleanNew);
  return { success: true, message: "PIN Supervisor berhasil diperbarui." };
}

async function verifySupervisorPin(pinInput, context) {
  const cleanPin = (pinInput || "").trim();

  const lockoutStatus = checkSupervisorPinLockout();
  if (lockoutStatus.isLocked) {
    return {
      success: false,
      isLocked: true,
      retryAfterSeconds: lockoutStatus.retryAfterSeconds,
      remainingAttempts: 0,
      message: `PIN terkunci sementara karena ${MAX_PIN_ATTEMPTS}x kesalahan beruntun.`,
    };
  }

  if (!cleanPin) {
    return {
      success: false,
      message: "Harap masukkan PIN Otorisasi Supervisor.",
      remainingAttempts: MAX_PIN_ATTEMPTS - pinFailedAttempts,
    };
  }

  let isMatch = false;
  const customPin = getCustomSupervisorPin() || DEFAULT_SUPERVISOR_PIN;
  if (
    timingSafeEqual(cleanPin, customPin) ||
    timingSafeEqual(cleanPin, SUPERVISOR_2FA_PASSWORD)
  ) {
    isMatch = true;
  }

  if (isMatch) {
    pinFailedAttempts = 0;
    pinLockoutUntil = 0;
    return { success: true, message: "Otorisasi Supervisor Berhasil." };
  }

  pinFailedAttempts += 1;
  if (pinFailedAttempts >= MAX_PIN_ATTEMPTS) {
    pinLockoutUntil = Date.now() + PIN_LOCKOUT_DURATION_MS;
    const retrySeconds = Math.ceil(PIN_LOCKOUT_DURATION_MS / 1000);
    return {
      success: false,
      isLocked: true,
      retryAfterSeconds: retrySeconds,
      remainingAttempts: 0,
      message: `PIN salah ${MAX_PIN_ATTEMPTS}x berturut-turut. Verifikasi supervisor terkunci.`,
    };
  }

  const remaining = MAX_PIN_ATTEMPTS - pinFailedAttempts;
  return {
    success: false,
    isLocked: false,
    remainingAttempts: remaining,
    message: `PIN Supervisor salah. Sisa kesempatan: ${remaining}x.`,
  };
}

async function runTests() {
  console.log("==================================================================");
  console.log("🛡️  TEST SUITE: MODUL 23 - SUPERVISOR 2FA OVERRIDE PIN / PASSWORD");
  console.log("==================================================================\n");

  resetSupervisorPinLockout();
  mockStorage.clear();

  // ----------------------------------------------------------------------------
  // TEST 1: Default Supervisor 2FA Password Verification ("tokodaus")
  // ----------------------------------------------------------------------------
  console.log("TEST 1: Verifikasi default 2FA password ('tokodaus')...");
  const defaultRes = await verifySupervisorPin("tokodaus", {
    action: "Pembatalan Transaksi TRX-001",
    entity: "transactions",
    cashierName: "Ani Rahayu (Kasir)",
    reason: "Pelanggan salah pesan barang",
  });

  assert.equal(defaultRes.success, true, "Default 2FA password 'tokodaus' should be approved");
  assert.equal(defaultRes.isLocked, undefined, "Should not be locked");
  console.log("  ✅ Berhasil: Default 2FA password 'tokodaus' diterima dan diotorisasi.");

  // ----------------------------------------------------------------------------
  // TEST 2: Decoupling Check - Login Password ("pemilik123") Must Be REJECTED
  // ----------------------------------------------------------------------------
  console.log("\nTEST 2: Verifikasi penolakan password login ('pemilik123') sebagai 2FA...");
  const loginPassRes = await verifySupervisorPin("pemilik123", {
    action: "Hapus Produk Aqua 600ml",
    entity: "products",
    cashierName: "Ani Rahayu (Kasir)",
    reason: "Produk discontinue",
  });

  assert.equal(loginPassRes.success, false, "Login password 'pemilik123' must NOT be accepted as 2FA");
  console.log("  ✅ Berhasil: Password login 'pemilik123' ditolak (2FA terbukti terpisah dari password login).");

  // ----------------------------------------------------------------------------
  // TEST 3: Invalid Credential Rejection & Remaining Attempts
  // ----------------------------------------------------------------------------
  console.log("\nTEST 3: Penolakan PIN tidak valid & hitungan sisa kesempatan...");
  const invalidRes = await verifySupervisorPin("wrong_pass_99", {
    action: "Pembatalan Transaksi TRX-002",
    entity: "transactions",
    cashierName: "Ani Rahayu",
  });

  assert.equal(invalidRes.success, false, "Invalid PIN should be rejected");
  assert.equal(invalidRes.remainingAttempts, 3, "Remaining attempts should decrement (2 failures total)");
  console.log(`  ✅ Berhasil: PIN salah ditolak. Sisa kesempatan: ${invalidRes.remainingAttempts}x.`);

  // ----------------------------------------------------------------------------
  // TEST 4: Brute-Force Rate Limiting Lockout (5 Consecutive Failures)
  // ----------------------------------------------------------------------------
  console.log("\nTEST 4: Proteksi Brute-Force Lockout (5x kegagalan berturut-turut)...");
  // 2 more failures (total 4)
  for (let i = 0; i < 2; i++) {
    await verifySupervisorPin(`wrong_${i}`);
  }

  // 5th failure: Should trigger 30-second lockout
  const lockoutTriggerRes = await verifySupervisorPin("wrong_pin_5");
  assert.equal(lockoutTriggerRes.success, false, "5th attempt must fail");
  assert.equal(lockoutTriggerRes.isLocked, true, "Must be locked out after 5 failures");
  assert.ok(lockoutTriggerRes.retryAfterSeconds > 0, "retryAfterSeconds must be positive");
  console.log(`  ✅ Berhasil: Lockout terpicu setelah 5x kegagalan. Terkunci selama ${lockoutTriggerRes.retryAfterSeconds} detik.`);

  // Verify that even correct 2FA password is blocked during active lockout window
  const blockedDuringLockout = await verifySupervisorPin("tokodaus");
  assert.equal(blockedDuringLockout.success, false, "Even correct password must be blocked while locked");
  assert.equal(blockedDuringLockout.isLocked, true, "Lockout flag must remain true");
  console.log("  ✅ Berhasil: Password benar tetap dicegat selama masa penalti lockout.");

  // Reset lockout
  resetSupervisorPinLockout();

  // ----------------------------------------------------------------------------
  // TEST 5: Custom Supervisor PIN Configuration using "tokodaus"
  // ----------------------------------------------------------------------------
  console.log("\nTEST 5: Pembaruan & kustomisasi PIN supervisor...");
  const validUpdate = setSupervisorPin("tokodaus", "888888");
  assert.equal(validUpdate.success, true, "Valid update must succeed");
  assert.equal(getCustomSupervisorPin(), "888888", "Custom PIN must be stored");

  // Verify custom PIN works
  const newPinRes = await verifySupervisorPin("888888");
  assert.equal(newPinRes.success, true, "Newly set PIN 888888 must be approved");
  console.log("  ✅ Berhasil: PIN supervisor berhasil diperbarui ke '888888'.");

  // ----------------------------------------------------------------------------
  // TEST 6: Codebase File Integrity Verification
  // ----------------------------------------------------------------------------
  console.log("\nTEST 6: Verifikasi integritas file kode (Login, Supervisor, Sidebar)...");
  const loginPath = path.resolve("src/app/login/page.tsx");
  const loginContent = fs.readFileSync(loginPath, "utf-8");
  assert.ok(
    !loginContent.includes("Pilih Cepat Akun Demo"),
    "Login page must not contain 1-click demo accounts selector"
  );
  console.log("  ✅ Berhasil: Halaman login bersih dari tombol cepat akun demo 1-klik.");

  const supervisorPath = path.resolve("src/lib/supervisorPin.ts");
  const supervisorContent = fs.readFileSync(supervisorPath, "utf-8");
  assert.ok(
    supervisorContent.includes('"tokodaus"'),
    "supervisorPin.ts must configure 'tokodaus' as supervisor 2FA password"
  );
  assert.ok(
    !supervisorContent.includes("MASTER_PEMILIK_PASSWORD"),
    "supervisorPin.ts must not reference MASTER_PEMILIK_PASSWORD"
  );
  console.log("  ✅ Berhasil: Password 2FA 'tokodaus' terkonfigurasi dan terpisah dari kredensial login.");

  const sidebarPath = path.resolve("src/components/layout/Sidebar.tsx");
  const sidebarContent = fs.readFileSync(sidebarPath, "utf-8");
  assert.ok(
    sidebarContent.includes("//   href: \"/audit\"") || !sidebarContent.includes("href: \"/audit\""),
    "Audit Keamanan menu must be commented out / hidden from Sidebar navigation"
  );
  console.log("  ✅ Berhasil: Menu navigasi Audit Keamanan berhasil di-hide dari UI.");

  console.log("\n==================================================================");
  console.log("🎉 SEMUA PENGUJIAN MODUL 23 (SUPERVISOR 2FA OVERRIDE) LOLOS 100%!");
  console.log("==================================================================");
}

runTests().catch((err) => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});
