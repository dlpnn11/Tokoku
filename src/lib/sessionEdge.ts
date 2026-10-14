/**
 * Edge-compatible Session Verification & Cryptographic Token Utilities.
 * Uses Web Crypto API (crypto.subtle) to support Next.js Edge Runtime seamlessly.
 */

export const SESSION_COOKIE_NAME = "tokoku_session";
export const SERVER_SESSION_SECRET =
  process.env.SESSION_SECRET ||
  "tokoku_server_private_session_secret_defense_in_depth_2026_strict_hmac";

export const SESSION_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 Hours

export interface EdgeSessionPayload {
  id: string;
  username: string;
  role: "pemilik" | "kasir";
  full_name: string;
  timestamp: number;
}

/**
 * Constant-time string equality check to eliminate timing side-channels in Edge Runtime.
 */
export function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

/**
 * Encodes string to Base64 in Edge/Browser/Node environments.
 */
export function toBase64(str: string): string {
  if (typeof btoa !== "undefined") {
    return btoa(str);
  }
  return Buffer.from(str, "utf-8").toString("base64");
}

/**
 * Decodes Base64 to string in Edge/Browser/Node environments.
 */
export function fromBase64(b64: string): string {
  if (typeof atob !== "undefined") {
    return atob(b64);
  }
  return Buffer.from(b64, "base64").toString("utf-8");
}

/**
 * Computes HMAC-SHA256 hex string using Web Crypto API.
 */
export async function computeHmacHex(data: string, secret = SERVER_SESSION_SECRET): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const sigBuffer = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
  return Array.from(new Uint8Array(sigBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Generates an HMAC-signed session token for cookie storage.
 */
export async function createSessionToken(
  payload: EdgeSessionPayload,
  secret = SERVER_SESSION_SECRET
): Promise<string> {
  const payloadJson = JSON.stringify(payload);
  const payloadBase64 = toBase64(payloadJson);
  const signature = await computeHmacHex(payloadBase64, secret);
  return `${payloadBase64}.${signature}`;
}

/**
 * Cryptographically verifies an HMAC session token and checks expiration.
 */
export async function verifySessionToken(
  token: string,
  secret = SERVER_SESSION_SECRET
): Promise<{ valid: boolean; payload?: EdgeSessionPayload; reason?: string }> {
  try {
    if (!token || typeof token !== "string") {
      return { valid: false, reason: "missing_token" };
    }

    const parts = token.split(".");
    if (parts.length !== 2) {
      return { valid: false, reason: "malformed_format" };
    }

    const [payloadBase64, signature] = parts;
    if (!payloadBase64 || !signature) {
      return { valid: false, reason: "empty_parts" };
    }

    // Verify HMAC-SHA256 signature
    const expectedSignature = await computeHmacHex(payloadBase64, secret);
    if (!constantTimeEqual(signature, expectedSignature)) {
      return { valid: false, reason: "signature_mismatch" };
    }

    // Decode and parse payload
    const payloadJson = fromBase64(payloadBase64);
    const payload = JSON.parse(payloadJson) as EdgeSessionPayload;

    if (!payload || !payload.id || !payload.role || !payload.username) {
      return { valid: false, reason: "invalid_payload_fields" };
    }

    // Check expiration (24 hours)
    if (Date.now() - payload.timestamp > SESSION_MAX_AGE_MS) {
      return { valid: false, reason: "session_expired" };
    }

    return { valid: true, payload };
  } catch (err: any) {
    return { valid: false, reason: err?.message || "verification_exception" };
  }
}
