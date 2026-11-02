"use client";

import { create } from "zustand";
import {
  ScannerPairingSession,
  VerificationResult,
  generateScannerSession,
  getSavedScannerSession,
  saveScannerSession,
  clearScannerSession,
  verifyScannerToken,
} from "@/lib/scannerSecurity";

interface ScannerState {
  session: ScannerPairingSession | null;
  initSession: () => ScannerPairingSession;
  refreshSession: () => ScannerPairingSession;
  verifyIncomingToken: (token: string | null | undefined) => VerificationResult;
  getTimeRemainingMs: () => number;
  revokeSession: () => void;
}

export const useScannerStore = create<ScannerState>((set, get) => ({
  session: null,

  initSession: () => {
    const existing = getSavedScannerSession();
    if (existing) {
      set({ session: existing });
      return existing;
    }

    const newSession = generateScannerSession();
    saveScannerSession(newSession);
    set({ session: newSession });
    return newSession;
  },

  refreshSession: () => {
    const newSession = generateScannerSession();
    saveScannerSession(newSession);
    set({ session: newSession });
    return newSession;
  },

  verifyIncomingToken: (token: string | null | undefined) => {
    const { session } = get();
    return verifyScannerToken(token, session);
  },

  getTimeRemainingMs: () => {
    return Number.MAX_SAFE_INTEGER;
  },

  revokeSession: () => {
    clearScannerSession();
    set({ session: null });
  },
}));
