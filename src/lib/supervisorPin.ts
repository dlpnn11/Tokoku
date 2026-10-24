/**
 * ==============================================================================
 * TOKOKU SUPERVISOR SECURITY OVERRIDE PIN SERVICE (MODUL 23)
 * ==============================================================================
 * Provides cryptographic timing-safe PIN verification, brute-force rate-limiting,
 * and immutable audit trail logging for high-risk mutations (void transaction,
 * product catalog deletion, significant negative stock adjustments).
 *
 * Default Retail POS Supervisor PIN: "123456" (also accepts owner master password "pemilik123")
 */

import { timingSafeEqual } from "./security";
import { auditService } from "@/services/auditService";
import { supabase } from "@/lib/supabase";

const SUPERVISOR_PIN_STORAGE_KEY = "tokoku_supervisor_pin_hash";
const DEFAULT_SUPERVISOR_PIN = "123456";
const MASTER_PEMILIK_PASSWORD = "pemilik123";

const MAX_PIN_ATTEMPTS = 5;
const PIN_LOCKOUT_DURATION_MS = 30 * 1000; // 30 seconds lockout after 5 consecutive failures

// In-memory brute-force tracking
let pinFailedAttempts = 0;
let pinLockoutUntil = 0;

export interface SupervisorPinVerifyResult {
  success: boolean;
  message?: string;
  remainingAttempts?: number;
  isLocked?: boolean;
  retryAfterSeconds?: number;
}

export interface SupervisorOverrideContext {
  action: string;
  entity: "transactions" | "products" | "auth" | "system" | string;
  entityId?: string | null;
  cashierId?: string | null;
  cashierName?: string | null;
  reason?: string | null;
  metadata?: Record<string, any>;
}

/**
 * Check if supervisor PIN verification is temporarily locked out due to repeated failures.
 */
export function checkSupervisorPinLockout(): { isLocked: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  if (now < pinLockoutUntil) {
    const remainingSeconds = Math.ceil((pinLockoutUntil - now) / 1000);
    return { isLocked: true, retryAfterSeconds: remainingSeconds };
  }
  // Lockout expired, reset if needed
  if (pinLockoutUntil > 0 && now >= pinLockoutUntil) {
    pinFailedAttempts = 0;
    pinLockoutUntil = 0;
  }
  return { isLocked: false, retryAfterSeconds: 0 };
}

/**
 * Resets the in-memory PIN lockout state (used primarily for automated test teardown).
 */
export function resetSupervisorPinLockout(): void {
  pinFailedAttempts = 0;
  pinLockoutUntil = 0;
}

/**
 * Retrieves the currently active supervisor PIN or null if default should be used.
 */
export function getCustomSupervisorPin(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(SUPERVISOR_PIN_STORAGE_KEY);
  } catch {
    return null;
  }
}

/**
 * Updates the supervisor PIN (requires current PIN or owner password for verification).
 */
export function setSupervisorPin(
  currentAuth: string,
  newPin: string
): { success: boolean; message?: string } {
  const cleanNew = newPin.trim();
  if (!/^\d{4,8}$/.test(cleanNew)) {
    return {
      success: false,
      message: "PIN baru harus berupa angka 4 sampai 8 digit.",
    };
  }

  const customPin = getCustomSupervisorPin() || DEFAULT_SUPERVISOR_PIN;
  const isAuthorized =
    timingSafeEqual(currentAuth.trim(), customPin) ||
    timingSafeEqual(currentAuth.trim(), MASTER_PEMILIK_PASSWORD);

  if (!isAuthorized) {
    return {
      success: false,
      message: "PIN atau kata sandi lama yang Anda masukkan salah.",
    };
  }

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(SUPERVISOR_PIN_STORAGE_KEY, cleanNew);
    } catch {
      return { success: false, message: "Gagal menyimpan PIN ke penyimpanan lokal." };
    }
  }

  auditService.recordAuditEvent({
    action: "SUPERVISOR_OVERRIDE_APPROVED",
    entity: "auth",
    newValues: {
      actionName: "PERUBAHAN_PIN_SUPERVISOR",
      timestamp: new Date().toISOString(),
    },
  });

  return { success: true, message: "PIN Supervisor berhasil diperbarui." };
}

/**
 * Timing-safe Supervisor PIN and Master Credential Verification.
 * Automatically handles brute-force lockout and immutable audit logging.
 */
export async function verifySupervisorPin(
  pinInput: string,
  context?: SupervisorOverrideContext
): Promise<SupervisorPinVerifyResult> {
  const cleanPin = (pinInput || "").trim();

  // 1. Check brute-force lockout status
  const lockoutStatus = checkSupervisorPinLockout();
  if (lockoutStatus.isLocked) {
    return {
      success: false,
      isLocked: true,
      retryAfterSeconds: lockoutStatus.retryAfterSeconds,
      remainingAttempts: 0,
      message: `PIN terkunci sementara karena ${MAX_PIN_ATTEMPTS}x kesalahan beruntun. Tunggu ${lockoutStatus.retryAfterSeconds} detik.`,
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

  // 2. Local timing-safe check against Custom PIN or Default (123456)
  const customPin = getCustomSupervisorPin() || DEFAULT_SUPERVISOR_PIN;
  if (timingSafeEqual(cleanPin, customPin)) {
    isMatch = true;
  }

  // 3. Timing-safe check against Master Pemilik Password (pemilik123)
  if (!isMatch && timingSafeEqual(cleanPin, MASTER_PEMILIK_PASSWORD)) {
    isMatch = true;
  }

  // 4. Online Supabase RPC verification fallback for 'pemilik' user
  if (!isMatch && typeof window !== "undefined") {
    try {
      const { data, error } = await supabase.rpc("authenticate_user", {
        p_username: "pemilik",
        p_password: cleanPin,
      });
      if (!error && data?.success) {
        isMatch = true;
      }
    } catch {
      // Offline fallback: keep isMatch false
    }
  }

  // 5. Handle Successful Authorization
  if (isMatch) {
    pinFailedAttempts = 0;
    pinLockoutUntil = 0;

    // Log Immutable Audit Event
    auditService.recordAuditEvent({
      userId: context?.cashierId || null,
      action: "SUPERVISOR_OVERRIDE_APPROVED",
      entity: context?.entity || "system",
      entityId: context?.entityId || null,
      newValues: {
        actionName: context?.action || "SUPERVISOR_OVERRIDE",
        reason: context?.reason || "Otorisasi Disetujui di Tempat",
        cashierUsername: context?.cashierName || "Kasir",
        cashierId: context?.cashierId || null,
        authorizedRole: "pemilik",
        authorizedAt: new Date().toISOString(),
        metadata: context?.metadata || {},
      },
    });

    return {
      success: true,
      message: "Otorisasi Supervisor Berhasil.",
    };
  }

  // 6. Handle Failed Authorization (Increment Failure Count & Lockout if Threshold Met)
  pinFailedAttempts++;
  const remaining = Math.max(0, MAX_PIN_ATTEMPTS - pinFailedAttempts);

  if (pinFailedAttempts >= MAX_PIN_ATTEMPTS) {
    pinLockoutUntil = Date.now() + PIN_LOCKOUT_DURATION_MS;
    const retrySeconds = Math.ceil(PIN_LOCKOUT_DURATION_MS / 1000);

    // Record Security Alert to Audit Trail
    auditService.recordAuditEvent({
      userId: context?.cashierId || null,
      action: "SUPERVISOR_OVERRIDE_REJECTED",
      entity: context?.entity || "system",
      entityId: context?.entityId || null,
      newValues: {
        actionName: context?.action || "SUPERVISOR_OVERRIDE",
        reason: `Percobaan PIN salah mencapai batas maksimal (${MAX_PIN_ATTEMPTS}x). Terkunci ${retrySeconds}s.`,
        cashierUsername: context?.cashierName || "Kasir",
        cashierId: context?.cashierId || null,
        consecutiveFailures: pinFailedAttempts,
        lockedUntil: new Date(pinLockoutUntil).toISOString(),
      },
    });

    return {
      success: false,
      isLocked: true,
      retryAfterSeconds: retrySeconds,
      remainingAttempts: 0,
      message: `PIN salah ${MAX_PIN_ATTEMPTS}x berturut-turut. Verifikasi supervisor terkunci selama ${retrySeconds} detik.`,
    };
  }

  // Normal failure (below lockout threshold)
  auditService.recordAuditEvent({
    userId: context?.cashierId || null,
    action: "SUPERVISOR_OVERRIDE_REJECTED",
    entity: context?.entity || "system",
    entityId: context?.entityId || null,
    newValues: {
      actionName: context?.action || "SUPERVISOR_OVERRIDE",
      reason: "PIN Supervisor salah",
      cashierUsername: context?.cashierName || "Kasir",
      consecutiveFailures: pinFailedAttempts,
      remainingAttempts: remaining,
      attemptedAt: new Date().toISOString(),
    },
  });

  return {
    success: false,
    remainingAttempts: remaining,
    message: `PIN Supervisor salah. Sisa kesempatan: ${remaining}x.`,
  };
}
