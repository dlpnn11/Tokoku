/**
 * Session Security & Cryptographic Integrity Protection for TokoKu POS.
 *
 * Implements HMAC-SHA256 anti-tampering verification for client-side storage,
 * timing-safe comparisons, canonical payload signing, and automatic tamper containment.
 */

export const SESSION_STORAGE_KEY = "tokoku-auth-storage";
export const TAMPER_ALERT_KEY = "tokoku_tamper_detected";
export const TAMPER_REASON_KEY = "tokoku_tamper_reason";

// Dynamic session salt combined with build-time/environment secret
const SESSION_HMAC_SECRET =
  (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_AUTH_SECRET) ||
  "tokoku_pos_client_session_hmac_secret_production_2026_salt_f7bc83";

/**
 * Constant-time string comparison to prevent side-channel timing attacks.
 * Iterates through maxLen to eliminate early returns on both length and character differences.
 */
export function constantTimeCompare(a: string, b: string): boolean {
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

export const timingSafeEqual = constantTimeCompare;

/**
 * Creates a deterministic, canonical representation of session-critical user state.
 * Prevents JSON serialization key-ordering discrepancies from invalidating signatures.
 */
export function generateCanonicalSessionString(
  user: { id?: string; username?: string; role?: string } | null | undefined,
  isAuthenticated: boolean
): string {
  const userId = user?.id || "";
  const username = user?.username || "";
  const role = user?.role || "";
  const isAuth = Boolean(isAuthenticated);

  return `CANONICAL_V1:id=${userId}|user=${username}|role=${role}|auth=${isAuth}`;
}

/**
 * Computes HMAC-SHA256 signature using standard Web Cryptography API (`crypto.subtle`).
 * Returns a 64-character lowercase hex string.
 */
export async function signSessionPayload(
  canonicalPayload: string,
  secretKey: string = SESSION_HMAC_SECRET
): Promise<string> {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) {
    throw new Error("Web Cryptography API (crypto.subtle) is not available in this environment.");
  }

  const enc = new TextEncoder();
  const key = await subtle.importKey(
    "raw",
    enc.encode(secretKey),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signatureBuffer = await subtle.sign(
    "HMAC",
    key,
    enc.encode(canonicalPayload)
  );

  return Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Verifies that a given signature matches the HMAC-SHA256 of the payload.
 * Uses constant-time comparison to protect against timing attacks.
 */
export async function verifySessionPayload(
  canonicalPayload: string,
  providedSignature: string,
  secretKey: string = SESSION_HMAC_SECRET
): Promise<boolean> {
  if (!providedSignature || typeof providedSignature !== "string") {
    return false;
  }

  try {
    const expectedSignature = await signSessionPayload(canonicalPayload, secretKey);
    return constantTimeCompare(expectedSignature, providedSignature);
  } catch (err) {
    console.error("[SECURITY] Error during signature verification:", err);
    return false;
  }
}

export interface VerificationResult {
  isValid: boolean;
  cleanJsonString: string | null;
  reason?: "empty" | "missing_envelope" | "missing_signature" | "signature_mismatch" | "corrupt_json";
  role?: string;
}

/**
 * Inspects a raw string retrieved from storage, verifies its cryptographic integrity,
 * and extracts the valid JSON payload if untampered.
 */
export async function verifyStorageData(
  rawString: string | null
): Promise<VerificationResult> {
  if (!rawString || rawString.trim() === "") {
    return { isValid: false, cleanJsonString: null, reason: "empty" };
  }

  let parsed: any;
  try {
    parsed = JSON.parse(rawString);
  } catch {
    return { isValid: false, cleanJsonString: null, reason: "corrupt_json" };
  }

  // 1. Missing integrity envelope check (e.g. Attacker injected raw { state: { currentUser: { role: 'pemilik' } } })
  if (!parsed || typeof parsed !== "object") {
    return { isValid: false, cleanJsonString: null, reason: "missing_envelope" };
  }

  if (!parsed._integrity || typeof parsed._integrity !== "object") {
    return { isValid: false, cleanJsonString: null, reason: "missing_envelope" };
  }

  const signature = parsed._integrity.signature;
  if (!signature || typeof signature !== "string") {
    return { isValid: false, cleanJsonString: null, reason: "missing_signature" };
  }

  // 2. Recompute canonical string and verify cryptographic signature
  const user = parsed.state?.currentUser;
  const isAuth = parsed.state?.isAuthenticated;
  const canonical = generateCanonicalSessionString(user, isAuth);

  const isSigValid = await verifySessionPayload(canonical, signature);
  if (!isSigValid) {
    return {
      isValid: false,
      cleanJsonString: null,
      reason: "signature_mismatch",
      role: user?.role,
    };
  }

  // 3. Signature is valid - return the sanitized JSON representation for Zustand
  return {
    isValid: true,
    cleanJsonString: JSON.stringify({ state: parsed.state, version: parsed.version }),
    role: user?.role,
  };
}

/**
 * Handles security alert when client-side tampering is detected:
 * - Immediately purges the tampered storage
 * - Sets security alert flags in sessionStorage
 * - Dispatches a window event for reactive UI response
 */
export function handleTamperDetected(reason: string): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    sessionStorage.setItem(TAMPER_ALERT_KEY, "true");
    sessionStorage.setItem(TAMPER_REASON_KEY, reason);

    console.error(
      `[SECURITY AUDIT] 🚨 Client-side session tampering detected (${reason})! Session storage purged immediately.`
    );

    window.dispatchEvent(
      new CustomEvent("tokoku:tamper-detected", {
        detail: { reason, timestamp: Date.now() },
      })
    );
  } catch (err) {
    console.error("[SECURITY] Failed to process tamper containment:", err);
  }
}

/**
 * Checks if a tamper alert flag is currently active in the session.
 */
export function hasTamperAlert(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return sessionStorage.getItem(TAMPER_ALERT_KEY) === "true";
  } catch {
    return false;
  }
}

/**
 * Clears active tamper alert flags.
 */
export function clearTamperAlert(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(TAMPER_ALERT_KEY);
    sessionStorage.removeItem(TAMPER_REASON_KEY);
  } catch {
    // Ignore in non-browser context
  }
}
