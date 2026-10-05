"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { User, UserRole } from "@/types/database";

interface AuthState {
  currentUser: User;
  switchRole: (role: UserRole) => void;
  setUser: (user: User) => void;
}

const DEFAULT_PEMILIK: User = {
  id: "11111111-1111-1111-1111-111111111111",
  username: "pemilik",
  full_name: "Firdaus Ubaidillah",
  role: "pemilik",
  created_at: new Date().toISOString(),
};

const DEFAULT_KASIR: User = {
  id: "22222222-2222-2222-2222-222222222222",
  username: "kasir",
  full_name: "Ani Rahayu",
  role: "kasir",
  created_at: new Date().toISOString(),
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      currentUser: DEFAULT_PEMILIK,
      switchRole: (role: UserRole) =>
        set({
          currentUser: role === "pemilik" ? DEFAULT_PEMILIK : DEFAULT_KASIR,
        }),
      setUser: (user: User) => set({ currentUser: user }),
    }),
    {
      name: "tokoku-auth-storage",
    }
  )
);
