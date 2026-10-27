"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  User,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldAlert,
  Clock,
  AlertTriangle,
  ShieldCheck,
  KeyRound,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/stores/authStore";
import { hasTamperAlert, clearTamperAlert } from "@/lib/sessionSecurity";
import { checkRateLimit, formatCountdown } from "@/lib/rateLimiter";
import { TokoKuLogo } from "@/components/ui/TokoKuLogo";
import { User as UserType } from "@/types/database";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, verify2FALogin, isAuthenticated, currentUser } = useAuthStore();

  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [rememberMe, setRememberMe] = React.useState(true);
  const [errorMsg, setErrorMsg] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [tamperDetected, setTamperDetected] = React.useState(false);

  // 2FA Verification Modal States (for Pemilik / Admin)
  const [is2FAModalOpen, setIs2FAModalOpen] = React.useState(false);
  const [pending2FAUser, setPending2FAUser] = React.useState<UserType | null>(null);
  const [twoFAPassword, setTwoFAPassword] = React.useState("");
  const [show2FAPassword, setShow2FAPassword] = React.useState(false);
  const [twoFAError, setTwoFAError] = React.useState("");
  const [twoFALoading, setTwoFALoading] = React.useState(false);

  // Rate Limiting & Lockout States
  const [isLockedOut, setIsLockedOut] = React.useState(false);
  const [lockCountdown, setLockCountdown] = React.useState(0);
  const [remainingAttempts, setRemainingAttempts] = React.useState<number | null>(null);

  // Check for tamper security alert
  React.useEffect(() => {
    const isParamTamper = searchParams.get("security_alert") === "tampering_detected";
    const isStorageTamper = hasTamperAlert();
    if (isParamTamper || isStorageTamper) {
      setTamperDetected(true);
      clearTamperAlert();
    }
  }, [searchParams]);

  // Synchronize rate limit status when username changes
  React.useEffect(() => {
    if (!username.trim()) {
      setIsLockedOut(false);
      setLockCountdown(0);
      setRemainingAttempts(null);
      return;
    }

    const status = checkRateLimit(username);
    if (status.isLocked) {
      setIsLockedOut(true);
      setLockCountdown(status.retryAfterSeconds);
      setRemainingAttempts(0);
    } else {
      setIsLockedOut(false);
      setLockCountdown(0);
      if (status.failedAttemptsCount > 0) {
        setRemainingAttempts(status.remainingAttempts);
      } else {
        setRemainingAttempts(null);
      }
    }
  }, [username]);

  // Active countdown timer effect for lockout duration
  React.useEffect(() => {
    if (!isLockedOut || lockCountdown <= 0) return;

    const timer = setInterval(() => {
      setLockCountdown((prev) => {
        if (prev <= 1) {
          setIsLockedOut(false);
          clearInterval(timer);
          const status = checkRateLimit(username);
          if (!status.isLocked) {
            setErrorMsg("");
            setRemainingAttempts(status.remainingAttempts);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isLockedOut, lockCountdown, username]);

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
    if (isLockedOut) return;

    if (!username.trim() || !password.trim()) {
      setErrorMsg("Harap masukkan username dan password.");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    setTamperDetected(false);

    try {
      const res = await login(username, password);
      if (res.success) {
        // If account is Pemilik / Admin, require 2FA popup challenge before gaining dashboard access
        if (res.requires2FA && res.tempUser) {
          setPending2FAUser(res.tempUser);
          setIs2FAModalOpen(true);
          setTwoFAPassword("");
          setTwoFAError("");
          return;
        }

        // Cashier role proceeds directly
        const store = useAuthStore.getState();
        if (store.currentUser?.role === "pemilik") {
          router.push("/dashboard");
        } else {
          router.push("/pos");
        }
      } else {
        if (res.isLocked) {
          setIsLockedOut(true);
          setLockCountdown(res.retryAfterSeconds || 300);
          setRemainingAttempts(0);
          setErrorMsg(res.message || "Akun dikunci sementara karena terlalu banyak percobaan gagal.");
        } else {
          if (res.remainingAttempts !== undefined) {
            setRemainingAttempts(res.remainingAttempts);
          }
          setErrorMsg(res.message || "Username atau password salah.");
        }
      }
    } catch {
      setErrorMsg("Terjadi kesalahan saat masuk. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const handle2FASubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!twoFAPassword.trim()) {
      setTwoFAError("Harap masukkan password 2FA.");
      return;
    }

    if (!pending2FAUser) {
      setTwoFAError("Sesi otorisasi tidak valid. Silakan masuk kembali.");
      return;
    }

    setTwoFALoading(true);
    setTwoFAError("");

    try {
      const res = await verify2FALogin(pending2FAUser, twoFAPassword);
      if (res.success) {
        setIs2FAModalOpen(false);
        router.push("/dashboard");
      } else {
        setTwoFAError(res.message || "Password 2FA yang Anda masukkan salah.");
      }
    } catch {
      setTwoFAError("Terjadi kendala saat memverifikasi password 2FA.");
    } finally {
      setTwoFALoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-[#F4F4F0] flex flex-col items-center justify-center p-4 sm:p-6 text-[#1A1A1A] select-none">
      <div className="w-full max-w-md bg-white border border-[#E5E5E0] rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
        {/* Branding Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <TokoKuLogo size={56} />
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

        {/* Security Tamper Warning Banner */}
        {tamperDetected && (
          <div className="p-4 bg-[#FFF0F0] border-2 border-[#D64545] rounded-xl flex items-start gap-3 text-xs text-[#1A1A1A] animate-in fade-in zoom-in-95">
            <ShieldAlert className="w-5 h-5 text-[#D64545] shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold text-[#D64545] block text-xs">
                🚨 Pelanggaran Integritas Sesi Terdeteksi
              </span>
              <p className="text-[#4B5563] leading-relaxed text-[11px]">
                Sistem mendeteksi adanya manipulasi penyimpanan sesi lokal (<em>client-side tampering attempt</em>). Sesi Anda telah dihentikan secara otomatis demi integritas sistem. Silakan masuk kembali dengan kredensial yang sah.
              </p>
            </div>
          </div>
        )}

        {/* Brute Force Lockout Banner with Live Countdown */}
        {isLockedOut && (
          <div className="p-4 bg-[#FFF0F0] border-2 border-[#D64545] rounded-xl flex items-start gap-3 text-xs text-[#1A1A1A] animate-in fade-in zoom-in-95">
            <ShieldAlert className="w-5 h-5 text-[#D64545] shrink-0 mt-0.5" />
            <div className="space-y-2 flex-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#D64545] block text-xs">
                  🔒 Akun Dikunci Sementara (Brute Force Protection)
                </span>
                <span className="px-2 py-0.5 bg-[#D64545] text-white font-mono text-[11px] font-bold rounded-md">
                  {formatCountdown(lockCountdown)}
                </span>
              </div>
              <p className="text-[#4B5563] leading-relaxed text-[11px]">
                Terlalu banyak percobaan masuk yang salah (5x berturut-turut). Demi keamanan sistem, akses ke akun ini ditangguhkan sementara selama 5 menit.
              </p>
              <div className="flex items-center gap-1.5 text-[10px] text-[#D64545] font-semibold pt-0.5">
                <Clock className="w-3.5 h-3.5" />
                <span>Silakan tunggu hingga hitungan mundur selesai untuk mencoba lagi.</span>
              </div>
            </div>
          </div>
        )}

        {/* Remaining Attempts Warning */}
        {!isLockedOut && remainingAttempts !== null && remainingAttempts < 5 && (
          <div className="px-3 py-2 bg-[#FFFBEB] border border-[#FDE68A] rounded-xl flex items-center justify-between text-xs text-[#92400E]">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-[#D97706] shrink-0" />
              <span className="text-[11px] font-medium">Percobaan login salah terdeteksi</span>
            </div>
            <span className="text-[11px] font-bold bg-[#FEF3C7] px-2 py-0.5 rounded text-[#92400E]">
              Sisa: {remainingAttempts} / 5
            </span>
          </div>
        )}

        {/* Error Alert Banner */}
        {!isLockedOut && errorMsg && (
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
                disabled={loading || isLockedOut}
                onChange={(e) => setUsername(e.target.value)}
                className="pl-9 text-xs h-11 border-[#E5E5E0] focus:border-[#6FA084] disabled:bg-[#F4F4F0] disabled:text-[#9E9E9E] disabled:cursor-not-allowed"
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
                disabled={loading || isLockedOut}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-9 pr-10 text-xs h-11 border-[#E5E5E0] focus:border-[#6FA084] disabled:bg-[#F4F4F0] disabled:text-[#9E9E9E] disabled:cursor-not-allowed"
                required
              />
              <button
                type="button"
                disabled={isLockedOut}
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9E9E9E] hover:text-[#1A1A1A] cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
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
                disabled={isLockedOut}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-[#E5E5E0] text-[#6FA084] focus:ring-[#6FA084] cursor-pointer disabled:cursor-not-allowed"
              />
              <span>Ingat saya di perangkat ini</span>
            </label>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={loading || isLockedOut}
            className={`w-full h-11 text-white font-bold text-xs uppercase tracking-wider rounded-xl gap-2 shadow-2xs transition-all ${
              isLockedOut
                ? "bg-[#D64545] cursor-not-allowed opacity-90"
                : "bg-[#6FA084] hover:bg-[#58836B] cursor-pointer"
            }`}
          >
            {isLockedOut ? (
              <>
                <Clock className="w-4 h-4 animate-spin text-white" />
                <span>Terkunci ({formatCountdown(lockCountdown)})</span>
              </>
            ) : loading ? (
              "Memverifikasi..."
            ) : (
              <>
                <span>Masuk ke Sistem</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </form>



        {/* Security / No-Registration Notice */}
        <div className="text-center pt-2">
          <p className="text-[11px] text-[#9E9E9E]">
            Pendaftaran akun kasir baru dikelola langsung oleh Pemilik Toko untuk menjaga keamanan data.
          </p>
        </div>
      </div>

      {/* 2FA Verification Modal for Pemilik / Admin */}
      {is2FAModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 select-none animate-in fade-in duration-200">
          <div className="bg-white border border-[#E5E5E0] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-5 py-4 bg-[#F4F4F0] border-b border-[#E5E5E0] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#6FA084] text-white flex items-center justify-center font-bold">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#1A1A1A]">
                    Verifikasi 2-Faktor (2FA)
                  </h3>
                  <p className="text-[11px] text-[#6B7280]">
                    Otorisasi Akses Khusus Pemilik Toko
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIs2FAModalOpen(false);
                  setTwoFAPassword("");
                  setTwoFAError("");
                }}
                className="p-1 rounded-lg hover:bg-white text-[#6B7280] hover:text-[#1A1A1A] transition-colors cursor-pointer"
                aria-label="Tutup Modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handle2FASubmit} className="p-5 sm:p-6 space-y-4">
              {/* Profile Card */}
              <div className="p-3 bg-[#FAFBF9] border border-[#E5E5E0] rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-[#6FA084] text-white font-bold text-xs flex items-center justify-center">
                    FU
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#1A1A1A]">
                      {pending2FAUser?.full_name || "Firdaus Ubaidillah"}
                    </p>
                    <p className="text-[10px] text-[#6B7280]">
                      Username: <span className="font-mono text-[#1A1A1A] font-medium">{pending2FAUser?.username || "pemilik"}</span>
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EBF3EE] text-[#6FA084] uppercase">
                  Pemilik
                </span>
              </div>

              {/* Informational Guideline */}
              <div className="p-3 bg-[#F4F8F5] border border-[#D1E2D7] rounded-xl text-xs space-y-1">
                <p className="font-bold text-[#4D725C] flex items-center gap-1.5 text-xs">
                  <KeyRound className="w-3.5 h-3.5" />
                  Password 2FA Khusus Supervisor
                </p>
                <p className="text-[11px] text-[#4B5563] leading-relaxed">
                  Untuk keamanan laporan dan pembukuan toko, password 2FA <strong>berbeda</strong> dari password login. Masukkan password 2FA pemilik untuk membuka dashboard.
                </p>
              </div>

              {/* Error Message */}
              {twoFAError && (
                <div className="p-3 bg-[#FFF0F0] border border-[#FCA5A5] rounded-xl flex items-start gap-2 text-xs text-[#D64545] animate-in fade-in">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <p className="text-[11px] leading-snug">{twoFAError}</p>
                </div>
              )}

              {/* 2FA Input Field */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#1A1A1A]">
                  Password 2FA Supervisor:
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#9E9E9E]">
                    <Lock className="w-4 h-4" />
                  </div>
                  <Input
                    type={show2FAPassword ? "text" : "password"}
                    value={twoFAPassword}
                    onChange={(e) => {
                      setTwoFAPassword(e.target.value);
                      if (twoFAError) setTwoFAError("");
                    }}
                    placeholder="Masukkan password 2FA Pemilik"
                    autoFocus
                    className="pl-9 pr-10 h-11 border-[#E5E5E0] focus-visible:ring-1 focus-visible:ring-[#6FA084] text-xs font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShow2FAPassword(!show2FAPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#9E9E9E] hover:text-[#1A1A1A] cursor-pointer"
                  >
                    {show2FAPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <p className="text-[10px] text-[#6B7280]">
                  Masukkan password rahasia 2FA yang hanya diketahui oleh Pemilik Toko.
                </p>
              </div>

              {/* Buttons */}
              <div className="pt-2 flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIs2FAModalOpen(false);
                    setTwoFAPassword("");
                    setTwoFAError("");
                  }}
                  className="flex-1 h-11 border-[#E5E5E0] text-[#4B5563] hover:bg-[#F4F4F0] font-semibold text-xs rounded-xl cursor-pointer"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={twoFALoading || !twoFAPassword.trim()}
                  className="flex-1 h-11 bg-[#6FA084] hover:bg-[#58836B] text-white font-bold text-xs rounded-xl gap-1.5 cursor-pointer shadow-xs"
                >
                  {twoFALoading ? (
                    "Memverifikasi..."
                  ) : (
                    <>
                      <span>Masuk Dashboard</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <React.Suspense fallback={<div className="min-h-screen bg-[#F4F4F0]" />}>
      <LoginForm />
    </React.Suspense>
  );
}
