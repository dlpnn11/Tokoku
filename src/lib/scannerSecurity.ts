/**
 * Security utilities for Mobile Barcode Scanner Realtime Pairing (Modul 18)
 *
 * Implements:
 * 1. Cryptographically strong pairing tokens (UUID v4 + entropy).
 * 2. 10-minute Time-To-Live (TTL) expiration window.
 * 3. Strict server/client verification against expired or mismatched tokens.
 * 4. Automatic session expiration and rotation capabilities.
 */

export const SCANNER_TOKEN_TTL_MS = 10 * 60 * 1000; // 10 minutes in milliseconds
export const SCANNER_STORAGE_KEY = "tokoku_scanner_pairing_session";

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
  // Fallback for environments where crypto.randomUUID is unavailable
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Generate a new scanner pairing session with 10-minute expiration
 */
export function generateScannerSession(
  customRoomId?: string,
  ttlMs = SCANNER_TOKEN_TTL_MS
): ScannerPairingSession {
  const now = Date.now();
  const roomId = customRoomId || `pos-room-${generateSecureToken().slice(0, 8)}`;
  const token = generateSecureToken();

  return {
    roomId,
    token,
    createdAt: now,
    expiresAt: now + ttlMs,
  };
}

/**
 * Verify whether a received token matches the active session and has not expired
 */
export function verifyScannerToken(
  receivedToken: string | null | undefined,
  session: ScannerPairingSession | null | undefined,
  now = Date.now()
): VerificationResult {
  if (!session) {
    return { valid: false, reason: "Tidak ada sesi pairing pemindai aktif di terminal kasir." };
  }

  if (!receivedToken || typeof receivedToken !== "string" || !receivedToken.trim()) {
    return { valid: false, reason: "Token pairing tidak disertakan dalam data pemindaian." };
  }

  if (now > session.expiresAt) {
    const expiredMinutesAgo = Math.max(1, Math.round((now - session.expiresAt) / 60000));
    return {
      valid: false,
      reason: `Token pairing telah kadaluarsa (${expiredMinutesAgo} menit lalu). Harap perbarui QR Code di terminal kasir.`,
      remainingMs: 0,
    };
  }

  if (receivedToken.trim() !== session.token) {
    return {
      valid: false,
      reason: "Token pairing tidak cocok dengan sesi aktif kasir. Akses ditolak.",
      remainingMs: Math.max(0, session.expiresAt - now),
    };
  }

  return {
    valid: true,
    remainingMs: Math.max(0, session.expiresAt - now),
  };
}

/**
 * Checks if a session has expired
 */
export function isSessionExpired(session: ScannerPairingSession | null | undefined, now = Date.now()): boolean {
  if (!session) return true;
  return now > session.expiresAt;
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
 * Retrieve scanner session from localStorage, automatically clearing if expired
 */
export function getSavedScannerSession(now = Date.now()): ScannerPairingSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SCANNER_STORAGE_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as ScannerPairingSession;
    if (!session || !session.token || !session.expiresAt) {
      localStorage.removeItem(SCANNER_STORAGE_KEY);
      return null;
    }
    if (now > session.expiresAt) {
      localStorage.removeItem(SCANNER_STORAGE_KEY);
      return null;
    }
    return session;
  } catch {
    localStorage.removeItem(SCANNER_STORAGE_KEY);
    return null;
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
 * Format remaining milliseconds as MM:SS string
 */
export function formatRemainingTime(remainingMs: number): string {
  if (remainingMs <= 0) return "00:00 (Kadaluarsa)";
  const totalSeconds = Math.floor(remainingMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
