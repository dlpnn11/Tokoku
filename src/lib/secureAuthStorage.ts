import { StateStorage } from "zustand/middleware";
import {
  generateCanonicalSessionString,
  signSessionPayload,
  verifyStorageData,
  handleTamperDetected,
} from "./sessionSecurity";

/**
 * Custom StateStorage adapter for Zustand `persist` middleware.
 * Wraps persisted auth state in a cryptographic HMAC-SHA256 signature envelope.
 *
 * Any manual client-side tampering (e.g. editing localStorage in DevTools console)
 * automatically triggers signature mismatch, purges the malicious entry,
 * flags security tamper alert, and terminates the session.
 */
export const secureAuthStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    if (typeof window === "undefined") return null;

    try {
      const raw = localStorage.getItem(name);
      if (!raw) return null;

      const verification = await verifyStorageData(raw);
      if (!verification.isValid) {
        handleTamperDetected(verification.reason || "signature_mismatch");
        return null;
      }

      return verification.cleanJsonString;
    } catch (err) {
      handleTamperDetected("storage_read_error");
      return null;
    }
  },

  setItem: async (name: string, value: string): Promise<void> => {
    if (typeof window === "undefined") return;

    try {
      const parsed = JSON.parse(value);
      const user = parsed?.state?.currentUser;
      const isAuth = parsed?.state?.isAuthenticated;

      // Only generate and persist signed envelope if user is actively authenticated
      if (isAuth && user) {
        const canonical = generateCanonicalSessionString(user, isAuth);
        const signature = await signSessionPayload(canonical);

        const envelope = {
          ...parsed,
          _integrity: {
            signature,
            timestamp: Date.now(),
            algorithm: "HMAC-SHA256",
          },
        };

        localStorage.setItem(name, JSON.stringify(envelope));
      } else {
        // If not authenticated or logged out, ensure storage is purged
        localStorage.removeItem(name);
      }
    } catch (err) {
      console.error("[SECURITY] Failed to write secure session storage:", err);
      localStorage.removeItem(name);
    }
  },

  removeItem: async (name: string): Promise<void> => {
    if (typeof window === "undefined") return;
    try {
      localStorage.removeItem(name);
    } catch (err) {
      console.error("[SECURITY] Failed to remove session storage:", err);
    }
  },
};
