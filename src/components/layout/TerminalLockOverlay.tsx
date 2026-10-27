"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Lock, Eye, EyeOff, ShieldAlert, ArrowRight, LogOut, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/stores/authStore";
import { cn } from "@/lib/utils";

export function TerminalLockOverlay() {
  const router = useRouter();
  const { currentUser, isTerminalLocked, unlockTerminal, logout } = useAuthStore();

  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Auto-focus password input when locked
  React.useEffect(() => {
    if (isTerminalLocked) {
      setPassword("");
      setErrorMsg("");
      setShowPassword(false);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isTerminalLocked]);

  if (!isTerminalLocked || !currentUser) {
    return null;
  }

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setErrorMsg("Harap masukkan kata sandi atau PIN.");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      const res = await unlockTerminal(password);
      if (res.success) {
        setPassword("");
        setErrorMsg("");
      } else {
        setErrorMsg(res.message || "Kata sandi yang Anda masukkan salah.");
        setTimeout(() => {
          inputRef.current?.select();
        }, 50);
      }
    } catch {
      setErrorMsg("Terjadi kesalahan saat memverifikasi. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchAccount = async () => {
    if (
      confirm(
        "Apakah Anda ingin keluar ke halaman login? Data keranjang aktif di terminal ini akan direset."
      )
    ) {
      await logout();
      window.location.href = "/login?action=logout";
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return "TK";
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  return (
    <div
      className="fixed inset-0 z-[9999] bg-[#1A1A1A]/85 backdrop-blur-sm flex items-center justify-center p-4 select-none animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="lock-title"
    >
      <div className="w-full max-w-sm bg-white border border-[#E5E5E0] rounded-2xl p-6 sm:p-8 shadow-2xl text-center space-y-6 animate-in zoom-in-95 duration-200">
        {/* Lock Header Icon */}
        <div className="space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-[#6FA084] text-white flex items-center justify-center mx-auto shadow-2xs">
            <Lock className="w-7 h-7" />
          </div>
          <div>
            <h2 id="lock-title" className="text-xl font-black text-[#1A1A1A] tracking-tight">
              Terminal Kasir Terkunci
            </h2>
            <p className="text-xs text-[#6B7280] mt-1">
              Sistem terkunci otomatis untuk menjaga keamanan data saat terminal ditinggalkan.
            </p>
          </div>
        </div>

        {/* Active Cashier Identity Card */}
        <div className="p-3 bg-[#F4F4F0] border border-[#E5E5E0] rounded-xl flex items-center justify-between text-left">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-[#3D4D43] text-[#6FA084] font-bold text-xs flex items-center justify-center shrink-0 border border-[#6FA084]/40">
              {getInitials(currentUser.full_name)}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-[#1A1A1A] truncate">
                {currentUser.full_name}
              </p>
              <p className="text-[10px] text-[#6B7280] truncate">
                @{currentUser.username}
              </p>
            </div>
          </div>
          <span
            className={cn(
              "text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0",
              currentUser.role === "pemilik"
                ? "bg-[#EBF3EE] text-[#6FA084]"
                : "bg-[#E5E5E0] text-[#4B5563]"
            )}
          >
            {currentUser.role === "pemilik" ? "Pemilik" : "Kasir"}
          </span>
        </div>

        {/* Error Alert Message */}
        {errorMsg && (
          <div className="p-3 bg-[#FFF0F0] border border-[#F8BEBE] rounded-xl flex items-center gap-2 text-xs text-[#D64545] font-semibold text-left animate-in shake">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Unlock Form */}
        <form onSubmit={handleUnlock} className="space-y-4 text-left">
          <div className="space-y-1">
            <label className="text-xs font-bold text-[#1A1A1A] block">
              Kata Sandi Pengguna
            </label>
            <div className="relative">
              <Input
                ref={inputRef}
                type={showPassword ? "text" : "password"}
                placeholder="Masukkan kata sandi untuk membuka"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pr-10 text-xs h-11 border-[#E5E5E0] focus:border-[#6FA084]"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9E9E9E] hover:text-[#1A1A1A] cursor-pointer"
                title={showPassword ? "Sembunyikan kata sandi" : "Lihat kata sandi"}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-11 bg-[#6FA084] hover:bg-[#58836B] text-white font-bold text-xs uppercase tracking-wider rounded-xl gap-2 cursor-pointer shadow-2xs"
          >
            {loading ? "Memverifikasi..." : "Buka Kunci Terminal"}
            <ArrowRight className="w-4 h-4" />
          </Button>
        </form>

        {/* Switch Account Action */}
        <div className="pt-2 border-t border-[#E5E5E0] flex items-center justify-between text-xs">
          <span className="text-[11px] text-[#6B7280]">Bukan akun Anda?</span>
          <button
            type="button"
            onClick={handleSwitchAccount}
            className="text-[11px] font-semibold text-[#D64545] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Ganti Pengguna</span>
          </button>
        </div>
      </div>
    </div>
  );
}
