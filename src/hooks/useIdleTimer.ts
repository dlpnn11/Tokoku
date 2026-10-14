"use client";

import * as React from "react";

export interface UseIdleTimerOptions {
  /**
   * Timeout in milliseconds before triggering idle callback.
   * Default: 15 minutes (900,000 ms).
   */
  timeoutMs?: number;
  /**
   * Callback invoked when user has been idle for >= timeoutMs.
   */
  onIdle: () => void;
  /**
   * Whether the idle timer is actively monitoring.
   * Typically true only when user is authenticated and terminal is unlocked.
   */
  enabled?: boolean;
}

export const DEFAULT_IDLE_TIMEOUT_MS = 15 * 60 * 1000; // 15 Minutes

/**
 * Custom hook to monitor DOM user interactions and detect terminal inactivity.
 *
 * Supported interactions: mousemove, mousedown, keydown, touchstart, scroll, wheel.
 * Uses interval-based time delta check to reliably catch sleep/wake cycles.
 */
export function useIdleTimer({
  timeoutMs = DEFAULT_IDLE_TIMEOUT_MS,
  onIdle,
  enabled = true,
}: UseIdleTimerOptions) {
  const lastActivityRef = React.useRef<number>(Date.now());
  const onIdleRef = React.useRef(onIdle);

  // Keep latest onIdle reference
  React.useEffect(() => {
    onIdleRef.current = onIdle;
  }, [onIdle]);

  // Reset activity timestamp
  const resetTimer = React.useCallback(() => {
    lastActivityRef.current = Date.now();
  }, []);

  React.useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    // Reset timestamp when enabled becomes true
    lastActivityRef.current = Date.now();

    // Throttled activity handler (updates at most once every 1000ms to keep CPU minimal)
    const handleActivity = () => {
      const now = Date.now();
      if (now - lastActivityRef.current >= 1000) {
        lastActivityRef.current = now;
      }
    };

    // Keyboard shortcut handler for immediate lock (Alt + L or Ctrl + Alt + L)
    const handleKeyDown = (e: KeyboardEvent) => {
      handleActivity();
      if ((e.altKey && (e.key === "l" || e.key === "L")) || (e.ctrlKey && e.altKey && (e.key === "l" || e.key === "L"))) {
        e.preventDefault();
        onIdleRef.current();
      }
    };

    const events: (keyof WindowEventMap)[] = [
      "mousemove",
      "mousedown",
      "touchstart",
      "touchmove",
      "scroll",
      "wheel",
    ];

    events.forEach((evt) => {
      window.addEventListener(evt, handleActivity, { passive: true });
    });
    window.addEventListener("keydown", handleKeyDown);

    // Periodic check interval (checks every 2 seconds)
    const interval = setInterval(() => {
      const elapsed = Date.now() - lastActivityRef.current;
      if (elapsed >= timeoutMs) {
        onIdleRef.current();
      }
    }, 2000);

    return () => {
      events.forEach((evt) => {
        window.removeEventListener(evt, handleActivity);
      });
      window.removeEventListener("keydown", handleKeyDown);
      clearInterval(interval);
    };
  }, [enabled, timeoutMs]);

  return { resetTimer };
}
