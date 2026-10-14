/**
 * Sliding Window Rate Limiter & Brute Force Protection Engine for TokoKu POS.
 *
 * Implements:
 * 1. Sliding window request tracking (15-minute window).
 * 2. Progressive delay penalty (2000ms delay after 3 failed attempts).
 * 3. Temporary account & client lockout (5 minutes after 5 failed attempts).
 * 4. Dual-layer storage: in-memory + localStorage persistence to survive reloads.
 */

export const MAX_FAILED_ATTEMPTS = 5;
export const LOCKOUT_DURATION_MS = 5 * 60 * 1000; // 5 Minutes (300,000 ms)
export const PROGRESSIVE_DELAY_THRESHOLD = 3; // Trigger penalty delay after 3 failures
export const PROGRESSIVE_DELAY_MS = 2000; // 2 seconds penalty delay
export const WINDOW_MS = 15 * 60 * 1000; // 15 Minutes sliding window

export interface RateLimitStatus {
  isLocked: boolean;
  remainingAttempts: number;
  retryAfterSeconds: number;
  shouldDelay: boolean;
  failedAttemptsCount: number;
}

interface StoredRateLimitRecord {
  attempts: number[]; // Timestamps of failed attempts
  lockedUntil: number | null; // Timestamp when lockout expires
}

// In-memory fallback map (for Node/SSR or when localStorage is unavailable)
const memoryStore = new Map<string, StoredRateLimitRecord>();

function getStorageKey(identifier: string): string {
  const clean = identifier.trim().toLowerCase() || "anonymous";
  return `tokoku_ratelimit_${clean}`;
}

function loadRecord(key: string): StoredRateLimitRecord {
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(getStorageKey(key));
      if (raw) {
        return JSON.parse(raw) as StoredRateLimitRecord;
      }
    } catch {
      // Fallback to in-memory if storage access is restricted
    }
  }

  return memoryStore.get(key) || { attempts: [], lockedUntil: null };
}

function saveRecord(key: string, record: StoredRateLimitRecord): void {
  memoryStore.set(key, record);

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(getStorageKey(key), JSON.stringify(record));
    } catch {
      // Ignore in restricted environments
    }
  }
}

function removeRecord(key: string): void {
  memoryStore.delete(key);

  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem(getStorageKey(key));
    } catch {
      // Ignore in restricted environments
    }
  }
}

/**
 * Checks the current rate limit and lockout status for a username/client.
 */
export function checkRateLimit(identifier: string): RateLimitStatus {
  const cleanKey = identifier.trim().toLowerCase() || "anonymous";
  const record = loadRecord(cleanKey);
  const now = Date.now();

  // 1. Check if user is currently locked out
  if (record.lockedUntil) {
    if (now < record.lockedUntil) {
      const retryAfterSeconds = Math.ceil((record.lockedUntil - now) / 1000);
      return {
        isLocked: true,
        remainingAttempts: 0,
        retryAfterSeconds,
        shouldDelay: true,
        failedAttemptsCount: MAX_FAILED_ATTEMPTS,
      };
    } else {
      // Lockout duration has expired, reset record
      removeRecord(cleanKey);
      return {
        isLocked: false,
        remainingAttempts: MAX_FAILED_ATTEMPTS,
        retryAfterSeconds: 0,
        shouldDelay: false,
        failedAttemptsCount: 0,
      };
    }
  }

  // 2. Prune attempts outside the sliding window
  const activeAttempts = (record.attempts || []).filter(
    (timestamp) => now - timestamp < WINDOW_MS
  );

  if (activeAttempts.length !== record.attempts.length) {
    record.attempts = activeAttempts;
    saveRecord(cleanKey, record);
  }

  const failedCount = activeAttempts.length;
  const remaining = Math.max(0, MAX_FAILED_ATTEMPTS - failedCount);
  const shouldDelay = failedCount >= PROGRESSIVE_DELAY_THRESHOLD;

  return {
    isLocked: false,
    remainingAttempts: remaining,
    retryAfterSeconds: 0,
    shouldDelay,
    failedAttemptsCount: failedCount,
  };
}

/**
 * Records a failed authentication attempt, potentially triggering progressive delay or lockout.
 */
export function recordFailedAttempt(identifier: string): RateLimitStatus {
  const cleanKey = identifier.trim().toLowerCase() || "anonymous";
  const record = loadRecord(cleanKey);
  const now = Date.now();

  // Prune old attempts
  const activeAttempts = (record.attempts || []).filter(
    (timestamp) => now - timestamp < WINDOW_MS
  );
  activeAttempts.push(now);
  record.attempts = activeAttempts;

  // Check if threshold reached to lock account
  if (activeAttempts.length >= MAX_FAILED_ATTEMPTS) {
    record.lockedUntil = now + LOCKOUT_DURATION_MS;
    saveRecord(cleanKey, record);

    return {
      isLocked: true,
      remainingAttempts: 0,
      retryAfterSeconds: Math.ceil(LOCKOUT_DURATION_MS / 1000),
      shouldDelay: true,
      failedAttemptsCount: MAX_FAILED_ATTEMPTS,
    };
  }

  saveRecord(cleanKey, record);

  const remaining = Math.max(0, MAX_FAILED_ATTEMPTS - activeAttempts.length);
  const shouldDelay = activeAttempts.length >= PROGRESSIVE_DELAY_THRESHOLD;

  return {
    isLocked: false,
    remainingAttempts: remaining,
    retryAfterSeconds: 0,
    shouldDelay,
    failedAttemptsCount: activeAttempts.length,
  };
}

/**
 * Clears failed attempts upon successful authentication.
 */
export function recordSuccessfulLogin(identifier: string): void {
  const cleanKey = identifier.trim().toLowerCase() || "anonymous";
  removeRecord(cleanKey);
}

/**
 * Applies progressive delay penalty by awaiting a promise.
 */
export async function applyProgressiveDelay(delayMs = PROGRESSIVE_DELAY_MS): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, delayMs));
}

/**
 * Formats seconds into human-readable MM:SS countdown format (e.g. 299 -> "04:59").
 */
export function formatCountdown(seconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(safeSeconds / 60);
  const secs = safeSeconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}
