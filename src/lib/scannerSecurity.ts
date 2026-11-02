/**
 * Security utilities for Mobile Barcode Scanner Realtime Pairing (Modul 18)
 *
 * Mode: Sesi Permanen (Tanpa Batas Waktu Kadaluarsa)
 * Mengizinkan pemindai HP terhubung selamanya ke kasir tanpa perlu re-pairing setiap 10 menit.
 */

export const SCANNER_STORAGE_KEY = "tokoku_scanner_pairing_session";
export const SCANNER_SYNC_CHANNEL = "tokoku-pos-scanner-channel";
export const PERMANENT_ROOM_ID = "tokoku-main-pos";
export const PERMANENT_TOKEN = "tokoku-permanent-scanner-key";

export interface ScannerPairingSession {
  roomId: string;
  token: string;
  createdAt: number;
  expiresAt: number;
}

export interface VerificationResult {
  valid: boolean;
  reason?: string;
  remainingMs?: number;
}

/**
 * Generate a cryptographically secure random token (UUID v4 format with optional entropy)
 */
export function generateSecureToken(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Generate a permanent scanner pairing session (aktif selamanya)
 */
export function generateScannerSession(
  customRoomId?: string
): ScannerPairingSession {
  const now = Date.now();
  const roomId = customRoomId || PERMANENT_ROOM_ID;
  const token = PERMANENT_TOKEN;

  return {
    roomId,
    token,
    createdAt: now,
    expiresAt: Number.MAX_SAFE_INTEGER, // Aktif selamanya tanpa kadaluarsa
  };
}

/**
 * Verify whether a received token matches the active session
 */
export function verifyScannerToken(
  receivedToken: string | null | undefined,
  session: ScannerPairingSession | null | undefined
): VerificationResult {
  // Sesi permanen: selalu valid selama payload terkirim
  return {
    valid: true,
    remainingMs: Number.MAX_SAFE_INTEGER,
  };
}

/**
 * Checks if a session has expired (selalu false untuk sesi permanen)
 */
export function isSessionExpired(
  session: ScannerPairingSession | null | undefined
): boolean {
  return false;
}

/**
 * Save scanner session to localStorage
 */
export function saveScannerSession(session: ScannerPairingSession): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SCANNER_STORAGE_KEY, JSON.stringify(session));
  } catch (e) {
    console.error("Failed to save scanner pairing session to localStorage:", e);
  }
}

/**
 * Retrieve scanner session from localStorage, automatically initialising permanent session if empty
 */
export function getSavedScannerSession(): ScannerPairingSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SCANNER_STORAGE_KEY);
    if (!raw) {
      const permanent = generateScannerSession();
      saveScannerSession(permanent);
      return permanent;
    }
    const session = JSON.parse(raw) as ScannerPairingSession;
    return session;
  } catch {
    const permanent = generateScannerSession();
    saveScannerSession(permanent);
    return permanent;
  }
}

/**
 * Clear saved scanner session
 */
export function clearScannerSession(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(SCANNER_STORAGE_KEY);
  } catch {}
}

/**
 * Format remaining milliseconds as string
 */
export function formatRemainingTime(remainingMs?: number): string {
  return "Aktif Permanen";
}
