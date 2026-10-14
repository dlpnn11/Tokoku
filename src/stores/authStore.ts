"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { User, UserRole } from "@/types/database";
import { supabase } from "@/lib/supabase";
import { secureAuthStorage } from "@/lib/secureAuthStorage";
import {
  SESSION_STORAGE_KEY,
  handleTamperDetected,
  verifyStorageData,
} from "@/lib/sessionSecurity";
import { timingSafeEqual } from "@/lib/security";

interface AuthState {
  currentUser: User | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
  setHydrated: (val: boolean) => void;
  login: (
    username: string,
    password_input: string
  ) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  switchRole: (role: UserRole) => void;
  setUser: (user: User) => void;
  validateSessionIntegrity: () => Promise<boolean>;
}

export const DEFAULT_PEMILIK: User = {
  id: "11111111-1111-1111-1111-111111111111",
  username: "pemilik",
  full_name: "Firdaus Ubaidillah",
  role: "pemilik",
  created_at: new Date().toISOString(),
};

export const DEFAULT_KASIR: User = {
  id: "22222222-2222-2222-2222-222222222222",
  username: "kasir",
  full_name: "Ani Rahayu",
  role: "kasir",
  created_at: new Date().toISOString(),
};

/**
 * Synchronizes session with server httpOnly cookie for defense-in-depth protection.
 */
async function syncServerCookie(user: User | null) {
  if (typeof window === "undefined") return;
  try {
    if (user) {
      await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user }),
      });
    } else {
      await fetch("/api/auth/session", { method: "DELETE" });
    }
  } catch {
    // Non-blocking in offline POS environment
  }
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      isAuthenticated: false,
      isHydrated: false,

      setHydrated: (val: boolean) => set({ isHydrated: val }),

      login: async (username: string, password_input: string) => {
        const cleanUser = username.trim().toLowerCase();
        const cleanPass = password_input.trim();

        // 1. Server-side verification via PostgreSQL RPC authenticate_user
        try {
          const { data, error } = await supabase.rpc("authenticate_user", {
            p_username: cleanUser,
            p_password: cleanPass,
          });

          if (!error && data?.success && data?.user) {
            const authedUser = data.user as User;
            set({
              currentUser: authedUser,
              isAuthenticated: true,
            });
            syncServerCookie(authedUser);
            return { success: true };
          }

          if (data && data.success === false) {
            return {
              success: false,
              message: data.message || "Username atau password yang Anda masukkan salah.",
            };
          }
        } catch (e) {
          console.warn("Offline auth fallback");
        }

        // Local demo fallback with constant-time equality checks
        const isPemilik =
          timingSafeEqual(cleanUser, "pemilik") &&
          timingSafeEqual(cleanPass, "pemilik123");

        if (isPemilik) {
          set({ currentUser: DEFAULT_PEMILIK, isAuthenticated: true });
          syncServerCookie(DEFAULT_PEMILIK);
          return { success: true };
        }

        const isKasir =
          timingSafeEqual(cleanUser, "kasir") &&
          timingSafeEqual(cleanPass, "kasir123");

        if (isKasir) {
          set({ currentUser: DEFAULT_KASIR, isAuthenticated: true });
          syncServerCookie(DEFAULT_KASIR);
          return { success: true };
        }

        return {
          success: false,
          message: "Username atau password yang Anda masukkan salah.",
        };
      },

      logout: () => {
        set({
          currentUser: null,
          isAuthenticated: false,
        });
        if (typeof window !== "undefined") {
          try {
            localStorage.removeItem(SESSION_STORAGE_KEY);
            syncServerCookie(null);
          } catch {
            // Ignore in restricted environments
          }
        }
      },

      switchRole: (role: UserRole) => {
        const targetUser = role === "pemilik" ? DEFAULT_PEMILIK : DEFAULT_KASIR;
        set({
          currentUser: targetUser,
          isAuthenticated: true,
        });
        syncServerCookie(targetUser);
      },

      setUser: (user: User) => {
        set({ currentUser: user, isAuthenticated: true });
        syncServerCookie(user);
      },

      /**
       * Validates that the active session matches cryptographic signature in localStorage
       * and authoritative server httpOnly cookie.
       */
      validateSessionIntegrity: async (): Promise<boolean> => {
        const { currentUser, isAuthenticated } = get();
        if (!isAuthenticated || !currentUser) {
          return true; // No session active
        }

        if (typeof window === "undefined") return true;

        // 1. Verify localStorage integrity signature directly
        const raw = localStorage.getItem(SESSION_STORAGE_KEY);
        if (!raw) {
          handleTamperDetected("missing_storage_during_validation");
          get().logout();
          return false;
        }

        const verification = await verifyStorageData(raw);
        if (!verification.isValid) {
          handleTamperDetected(verification.reason || "signature_mismatch");
          get().logout();
          return false;
        }

        // 2. Ensure in-memory role has not been illegally escalated compared to signed storage
        if (verification.role && verification.role !== currentUser.role) {
          handleTamperDetected("role_escalation_mismatch");
          get().logout();
          return false;
        }

        // 3. Cross-validate with authoritative server httpOnly cookie if online
        try {
          const res = await fetch("/api/auth/session", { cache: "no-store" });
          if (res.ok) {
            const data = await res.json();
            if (data.authenticated && data.user) {
              if (data.user.role !== currentUser.role) {
                handleTamperDetected("server_httponly_role_mismatch");
                get().logout();
                return false;
              }
            }
          }
        } catch {
          // If offline POS, client HMAC verification already passed safely
        }

        return true;
      },
    }),
    {
      name: SESSION_STORAGE_KEY,
      storage: createJSONStorage(() => secureAuthStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setHydrated(true);
        }
      },
    }
  )
);
