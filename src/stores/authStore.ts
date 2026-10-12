"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { User, UserRole } from "@/types/database";
import { supabase } from "@/lib/supabase";

interface AuthState {
  currentUser: User;
  isAuthenticated: boolean;
  login: (
    username: string,
    password_hash: string
  ) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  switchRole: (role: UserRole) => void;
  setUser: (user: User) => void;
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

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      currentUser: DEFAULT_PEMILIK,
      isAuthenticated: true,

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
            set({
              currentUser: data.user as User,
              isAuthenticated: true,
            });
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

        // Local demo fallback
        if (cleanUser === "pemilik" && cleanPass === "pemilik123") {
          set({ currentUser: DEFAULT_PEMILIK, isAuthenticated: true });
          return { success: true };
        }

        if (cleanUser === "kasir" && cleanPass === "kasir123") {
          set({ currentUser: DEFAULT_KASIR, isAuthenticated: true });
          return { success: true };
        }

        return {
          success: false,
          message: "Username atau password yang Anda masukkan salah.",
        };
      },

      logout: () => {
        set({
          isAuthenticated: false,
        });
      },

      switchRole: (role: UserRole) =>
        set({
          currentUser: role === "pemilik" ? DEFAULT_PEMILIK : DEFAULT_KASIR,
          isAuthenticated: true,
        }),

      setUser: (user: User) => set({ currentUser: user, isAuthenticated: true }),
    }),
    {
      name: "tokoku-auth-storage",
    }
  )
);
