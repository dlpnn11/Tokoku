"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Store,
  User,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldAlert,
  Crown,
  ShoppingBag,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/stores/authStore";

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, currentUser } = useAuthStore();

  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [rememberMe, setRememberMe] = React.useState(true);
  const [errorMsg, setErrorMsg] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  // If already authenticated, redirect to appropriate page
  React.useEffect(() => {
    if (isAuthenticated && currentUser) {
      if (currentUser.role === "pemilik") {
        router.push("/dashboard");
      } else {
        router.push("/pos");
      }
    }
  }, [isAuthenticated, currentUser, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setErrorMsg("Harap masukkan username dan password.");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      const res = await login(username, password);
      if (res.success) {
        // Redirect based on logged in role
        const store = useAuthStore.getState();
        if (store.currentUser.role === "pemilik") {
          router.push("/dashboard");
        } else {
          router.push("/pos");
        }
      } else {
        setErrorMsg(res.message || "Username atau password salah.");
      }
    } catch (err: any) {
      setErrorMsg("Terjadi kesalahan saat masuk. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSelect = (role: "pemilik" | "kasir") => {
    if (role === "pemilik") {
      setUsername("pemilik");
      setPassword("pemilik123");
    } else {
      setUsername("kasir");
      setPassword("kasir123");
    }
    setErrorMsg("");
  };

  return (
    <div className="min-h-screen bg-[#F4F4F0] flex flex-col items-center justify-center p-4 sm:p-6 text-[#1A1A1A] select-none">
      <div className="w-full max-w-md bg-white border border-[#E5E5E0] rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
        {/* Branding Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-[#6FA084] flex items-center justify-center text-white mx-auto shadow-2xs">
            <Store className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-[#1A1A1A] tracking-tight">
              TokoKu POS
            </h1>
            <p className="text-xs text-[#6B7280]">
              Sistem Terminal POS & Manajemen Inventaris Ritel
            </p>
          </div>
        </div>

        {/* Error Alert Banner */}
        {errorMsg && (
          <div className="p-3 bg-[#FFF0F0] border border-[#F8BEBE] rounded-xl flex items-center gap-2 text-xs text-[#D64545] font-semibold">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-[#1A1A1A] block">
              Username
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9E9E9E]" />
              <Input
                placeholder="Masukkan username (pemilik / kasir)"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="pl-9 text-xs h-11 border-[#E5E5E0] focus:border-[#6FA084]"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-[#1A1A1A] block">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9E9E9E]" />
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Masukkan password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-9 pr-10 text-xs h-11 border-[#E5E5E0] focus:border-[#6FA084]"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9E9E9E] hover:text-[#1A1A1A] cursor-pointer"
                title={showPassword ? "Sembunyikan password" : "Lihat password"}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Remember Me */}
          <div className="flex items-center justify-between text-xs pt-1">
            <label className="flex items-center gap-2 text-[#6B7280] cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-[#E5E5E0] text-[#6FA084] focus:ring-[#6FA084] cursor-pointer"
              />
              <span>Ingat saya di perangkat ini</span>
            </label>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={loading}
            className="w-full h-11 bg-[#6FA084] hover:bg-[#58836B] text-white font-bold text-xs uppercase tracking-wider rounded-xl gap-2 cursor-pointer shadow-2xs"
          >
            {loading ? "Memverifikasi..." : "Masuk ke Sistem"}
            <ArrowRight className="w-4 h-4" />
          </Button>
        </form>

        {/* 1-Click Demo Accounts Selector */}
        <div className="pt-2 border-t border-[#E5E5E0] space-y-2.5">
          <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider block text-center">
            Pilih Cepat Akun Demo (1-Klik)
          </span>

          <div className="grid grid-cols-2 gap-2">
            {/* Pemilik Demo */}
            <button
              type="button"
              onClick={() => handleQuickSelect("pemilik")}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                username === "pemilik"
                  ? "bg-[#F4F8F5] border-[#6FA084]"
                  : "bg-[#FAFBF9] border-[#E5E5E0] hover:border-[#6FA084]"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <Crown className="w-4 h-4 text-[#6FA084]" />
                {username === "pemilik" && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#6FA084]" />
                )}
              </div>
              <p className="font-bold text-xs text-[#1A1A1A]">Pemilik Toko</p>
              <p className="text-[10px] text-[#6B7280]">Firdaus Ubaidillah</p>
              <span className="text-[9px] text-[#6FA084] font-semibold mt-1 block">
                Akses Penuh Semua Menu
              </span>
            </button>

            {/* Kasir Demo */}
            <button
              type="button"
              onClick={() => handleQuickSelect("kasir")}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                username === "kasir"
                  ? "bg-[#F4F8F5] border-[#6FA084]"
                  : "bg-[#FAFBF9] border-[#E5E5E0] hover:border-[#6FA084]"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <ShoppingBag className="w-4 h-4 text-[#6FA084]" />
                {username === "kasir" && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#6FA084]" />
                )}
              </div>
              <p className="font-bold text-xs text-[#1A1A1A]">Kasir Toko</p>
              <p className="text-[10px] text-[#6B7280]">Ani Rahayu</p>
              <span className="text-[9px] text-[#6B7280] font-semibold mt-1 block">
                Akses Kasir & Riwayat
              </span>
            </button>
          </div>
        </div>

        {/* Security / No-Registration Notice */}
        <div className="text-center pt-2">
          <p className="text-[11px] text-[#9E9E9E]">
            Pendaftaran akun kasir baru dikelola langsung oleh Pemilik Toko untuk menjaga keamanan data.
          </p>
        </div>
      </div>
    </div>
  );
}
