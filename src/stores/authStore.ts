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

import {
  checkRateLimit,
  recordFailedAttempt,
  recordSuccessfulLogin,
  applyProgressiveDelay,
  formatCountdown,
  MAX_FAILED_ATTEMPTS,
} from "@/lib/rateLimiter";
import { auditService } from "@/services/auditService";

interface AuthState {
  currentUser: User | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
  isTerminalLocked: boolean;
  setHydrated: (val: boolean) => void;
  lockTerminal: () => void;
  unlockTerminal: (password: string) => Promise<{ success: boolean; message?: string }>;
  login: (
    username: string,
    password_input: string
  ) => Promise<{
    success: boolean;
    message?: string;
    isLocked?: boolean;
    retryAfterSeconds?: number;
    remainingAttempts?: number;
  }>;
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
      isTerminalLocked:
        typeof window !== "undefined"
          ? sessionStorage.getItem("tokoku_terminal_locked") === "true"
          : false,

      setHydrated: (val: boolean) => set({ isHydrated: val }),

      lockTerminal: () => {
        const { currentUser } = get();
        set({ isTerminalLocked: true });
        if (typeof window !== "undefined") {
          try {
            sessionStorage.setItem("tokoku_terminal_locked", "true");
          } catch {
            // Ignore in restricted environments
          }
        }
        auditService.recordAuditEvent({
          userId: currentUser?.id,
          action: "TERMINAL_DIKUNCI",
          entity: "auth",
          newValues: { username: currentUser?.username, role: currentUser?.role },
        });
      },

      unlockTerminal: async (password: string) => {
        const { currentUser } = get();
        if (!currentUser) {
          return { success: false, message: "Tidak ada sesi pengguna aktif." };
        }

        const cleanPass = password.trim();

        // 1. Attempt PostgreSQL RPC verification
        try {
          const { data, error } = await supabase.rpc("authenticate_user", {
            p_username: currentUser.username,
            p_password: cleanPass,
          });

          if (!error && data?.success) {
            set({ isTerminalLocked: false });
            if (typeof window !== "undefined") {
              try {
                sessionStorage.removeItem("tokoku_terminal_locked");
              } catch {}
            }
            auditService.recordAuditEvent({
              userId: currentUser.id,
              action: "TERMINAL_DIBUKA",
              entity: "auth",
              newValues: { username: currentUser.username },
            });
            return { success: true };
          }

          if (data && data.success === false) {
            return {
              success: false,
              message: "Kata sandi yang Anda masukkan salah.",
            };
          }
        } catch (e) {
          console.warn("Offline unlock fallback");
        }

        // 2. Timing-safe fallback verification for local demo accounts
        const isMatch =
          (currentUser.role === "pemilik" && timingSafeEqual(cleanPass, "pemilik123")) ||
          (currentUser.role === "kasir" && timingSafeEqual(cleanPass, "kasir123"));

        if (isMatch) {
          set({ isTerminalLocked: false });
          if (typeof window !== "undefined") {
            try {
              sessionStorage.removeItem("tokoku_terminal_locked");
            } catch {}
          }
          auditService.recordAuditEvent({
            userId: currentUser.id,
            action: "TERMINAL_DIBUKA",
            entity: "auth",
            newValues: { username: currentUser.username },
          });
          return { success: true };
        }

        return {
          success: false,
          message: "Kata sandi salah. Silakan coba lagi.",
        };
      },

      login: async (username: string, password_input: string) => {
        const cleanUser = username.trim().toLowerCase();
        const cleanPass = password_input.trim();

        // 1. Sliding Window Rate Limiting & Lockout Check
        const initialStatus = checkRateLimit(cleanUser);
        if (initialStatus.isLocked) {
          return {
            success: false,
            isLocked: true,
            retryAfterSeconds: initialStatus.retryAfterSeconds,
            remainingAttempts: 0,
            message: `Akun/klien dikunci sementara karena ${MAX_FAILED_ATTEMPTS}x kegagalan berturut-turut. Tunggu ${formatCountdown(initialStatus.retryAfterSeconds)} sebelum mencoba kembali.`,
          };
        }

        // 2. Progressive delay penalty (2000ms delay after 3 failed attempts)
        if (initialStatus.shouldDelay) {
          await applyProgressiveDelay();
        }

        // Helper to record failed attempt and format informative response
        const handleFailure = (customMsg?: string) => {
          const failStatus = recordFailedAttempt(cleanUser);
          auditService.recordAuditEvent({
            action: "LOGIN_GAGAL",
            entity: "auth",
            newValues: { username: cleanUser, reason: customMsg || "Kredensial tidak valid" },
          });

          if (failStatus.isLocked) {
            auditService.recordAuditEvent({
              action: "RATE_LIMIT_EXCEEDED",
              entity: "auth",
              newValues: { username: cleanUser, retryAfterSeconds: failStatus.retryAfterSeconds },
            });
            return {
              success: false,
              isLocked: true,
              retryAfterSeconds: failStatus.retryAfterSeconds,
              remainingAttempts: 0,
              message: `Batas percobaan (${MAX_FAILED_ATTEMPTS}x) tercapai. Akun dikunci sementara selama 5 menit demi keamanan sistem.`,
            };
          }

          return {
            success: false,
            isLocked: false,
            remainingAttempts: failStatus.remainingAttempts,
            retryAfterSeconds: 0,
            message:
              customMsg ||
              `Username atau password salah. Sisa percobaan: ${failStatus.remainingAttempts}x sebelum akun dikunci.`,
          };
        };

        // 3. Server-side verification via PostgreSQL RPC authenticate_user
        try {
          const { data, error } = await supabase.rpc("authenticate_user", {
            p_username: cleanUser,
            p_password: cleanPass,
          });

          if (!error && data?.success && data?.user) {
            recordSuccessfulLogin(cleanUser);
            const authedUser = data.user as User;
            set({
              currentUser: authedUser,
              isAuthenticated: true,
            });
            await syncServerCookie(authedUser);
            auditService.recordAuditEvent({
              userId: authedUser.id,
              action: "LOGIN_SUKSES",
              entity: "auth",
              newValues: { username: cleanUser, role: authedUser.role },
            });
            return { success: true };
          }

          if (data && data.success === false) {
            return handleFailure(data.message);
          }
        } catch (e) {
          console.warn("Offline auth fallback");
        }

        // 4. Local demo fallback with constant-time equality checks
        const isPemilik =
          timingSafeEqual(cleanUser, "pemilik") &&
          timingSafeEqual(cleanPass, "pemilik123");

        if (isPemilik) {
          recordSuccessfulLogin(cleanUser);
          set({ currentUser: DEFAULT_PEMILIK, isAuthenticated: true });
          await syncServerCookie(DEFAULT_PEMILIK);
          auditService.recordAuditEvent({
            userId: DEFAULT_PEMILIK.id,
            action: "LOGIN_SUKSES",
            entity: "auth",
            newValues: { username: cleanUser, role: "pemilik", method: "local_fallback" },
          });
          return { success: true };
        }

        const isKasir =
          timingSafeEqual(cleanUser, "kasir") &&
          timingSafeEqual(cleanPass, "kasir123");

        if (isKasir) {
          recordSuccessfulLogin(cleanUser);
          set({ currentUser: DEFAULT_KASIR, isAuthenticated: true });
          await syncServerCookie(DEFAULT_KASIR);
          auditService.recordAuditEvent({
            userId: DEFAULT_KASIR.id,
            action: "LOGIN_SUKSES",
            entity: "auth",
            newValues: { username: cleanUser, role: "kasir", method: "local_fallback" },
          });
          return { success: true };
        }

        // 5. Failed credential match
        return handleFailure("Username atau password yang Anda masukkan salah.");
      },

      logout: () => {
        const { currentUser } = get();
        if (currentUser) {
          auditService.recordAuditEvent({
            userId: currentUser.id,
            action: "LOGOUT",
            entity: "auth",
            newValues: { username: currentUser.username, role: currentUser.role },
          });
        }
        set({
          currentUser: null,
          isAuthenticated: false,
          isTerminalLocked: false,
        });
        if (typeof window !== "undefined") {
          try {
            localStorage.removeItem(SESSION_STORAGE_KEY);
            sessionStorage.removeItem("tokoku_terminal_locked");
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
