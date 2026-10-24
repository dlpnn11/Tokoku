"use client";

import * as React from "react";
import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  Clock,
  AlertTriangle,
  Delete,
  X,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { useAuthStore } from "@/stores/authStore";
import {
  verifySupervisorPin,
  checkSupervisorPinLockout,
} from "@/lib/supervisorPin";
import { cn } from "@/lib/utils";

export interface SupervisorOverrideModalProps {
  isOpen: boolean;
  onClose: () => void;
  actionTitle: string;
  actionDescription?: string;
  entity: "transactions" | "products" | "auth" | "system" | string;
  entityId?: string | null;
  metadata?: Record<string, any>;
  onApproved: () => Promise<void> | void;
}

const COMMON_REASONS = [
  "Salah ketik / salah input kasir",
  "Pelanggan membatalkan pesanan",
  "Barang cacat / retur",
  "Stok opname selisih fisik",
];

export function SupervisorOverrideModal({
  isOpen,
  onClose,
  actionTitle,
  actionDescription,
  entity,
  entityId,
  metadata,
  onApproved,
}: SupervisorOverrideModalProps) {
  const { currentUser } = useAuthStore();
  const [pin, setPin] = React.useState("");
  const [reason, setReason] = React.useState(COMMON_REASONS[0]);
  const [customReason, setCustomReason] = React.useState("");
  const [showPin, setShowPin] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState("");
  const [success, setSuccess] = React.useState(false);
  const [lockoutSeconds, setLockoutSeconds] = React.useState(0);
  const [remainingAttempts, setRemainingAttempts] = React.useState<number | null>(null);

  const inputRef = React.useRef<HTMLInputElement>(null);

  // Check lockout on open
  React.useEffect(() => {
    if (isOpen) {
      setPin("");
      setErrorMsg("");
      setSuccess(false);
      setCustomReason("");
      setReason(COMMON_REASONS[0]);
      setRemainingAttempts(null);

      const lockout = checkSupervisorPinLockout();
      if (lockout.isLocked) {
        setLockoutSeconds(lockout.retryAfterSeconds);
      } else {
        setLockoutSeconds(0);
        setTimeout(() => {
          inputRef.current?.focus();
        }, 150);
      }
    }
  }, [isOpen]);

  // Countdown timer when locked out
  React.useEffect(() => {
    if (lockoutSeconds <= 0) return;
    const timer = setInterval(() => {
      setLockoutSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setErrorMsg("");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [lockoutSeconds]);

  const handleKeypadPress = (val: string) => {
    if (lockoutSeconds > 0 || loading || success) return;
    if (pin.length < 8) {
      setPin((prev) => prev + val);
      setErrorMsg("");
    }
  };

  const handleBackspace = () => {
    if (lockoutSeconds > 0 || loading || success) return;
    setPin((prev) => prev.slice(0, -1));
    setErrorMsg("");
  };

  const handleClear = () => {
    if (lockoutSeconds > 0 || loading || success) return;
    setPin("");
    setErrorMsg("");
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (lockoutSeconds > 0 || loading || success) return;

    if (!pin.trim()) {
      setErrorMsg("Harap masukkan PIN Otorisasi Supervisor.");
      inputRef.current?.focus();
      return;
    }

    setLoading(true);
    setErrorMsg("");

    const effectiveReason = customReason.trim() ? customReason.trim() : reason;

    try {
      const res = await verifySupervisorPin(pin, {
        action: actionTitle,
        entity,
        entityId,
        cashierId: currentUser?.id,
        cashierName: currentUser?.full_name || currentUser?.username || "Kasir",
        reason: effectiveReason,
        metadata,
      });

      if (res.success) {
        setSuccess(true);
        setTimeout(async () => {
          try {
            await onApproved();
            onClose();
          } catch (err: any) {
            setErrorMsg(err?.message || "Gagal mengeksekusi aksi setelah otorisasi.");
            setSuccess(false);
          } finally {
            setLoading(false);
          }
        }, 600);
      } else {
        setErrorMsg(res.message || "PIN yang dimasukkan salah.");
        if (res.isLocked && res.retryAfterSeconds) {
          setLockoutSeconds(res.retryAfterSeconds);
        } else if (typeof res.remainingAttempts === "number") {
          setRemainingAttempts(res.remainingAttempts);
        }
        setPin("");
        setTimeout(() => {
          inputRef.current?.focus();
        }, 50);
        setLoading(false);
      }
    } catch {
      setErrorMsg("Terjadi kegagalan verifikasi. Silakan coba kembali.");
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      maxWidth="md"
    >
      <div className="space-y-5 -mt-3">
        {/* Header Banner */}
        <div className="flex items-start gap-3.5 p-3.5 bg-[#FFF9E6] border border-[#F3E5AB] rounded-xl text-[#856404]">
          <div className="w-10 h-10 rounded-lg bg-[#F59E0B] text-white flex items-center justify-center shrink-0">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black uppercase tracking-wider bg-[#F59E0B] text-white px-2 py-0.5 rounded">
                High-Risk Mutation
              </span>
              <span className="text-xs font-semibold text-[#856404]">Anti-Fraud POS</span>
            </div>
            <h3 className="text-sm font-bold text-[#1A1A1A] leading-tight">
              Otorisasi Supervisor Diperlukan
            </h3>
            <p className="text-xs text-[#6B7280]">
              Tindakan ini memerlukan PIN izin dari Pemilik / Supervisor toko.
            </p>
          </div>
        </div>

        {/* Action Description Card */}
        <div className="bg-[#F4F4F0] p-3.5 rounded-xl border border-[#E5E5E0] space-y-1.5">
          <div className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wide">
            Aksi yang Diminta Kasir:
          </div>
          <div className="text-sm font-bold text-[#1A1A1A] flex items-center gap-1.5">
            <KeyRound className="w-4 h-4 text-[#6FA084]" />
            <span>{actionTitle}</span>
          </div>
          {actionDescription && (
            <p className="text-xs text-[#4B5563] pt-0.5 border-t border-[#E5E5E0]">
              {actionDescription}
            </p>
          )}
          <div className="text-[11px] text-[#6B7280] pt-1">
            Kasir Pemohon:{" "}
            <span className="font-semibold text-[#1A1A1A]">
              {currentUser?.full_name || currentUser?.username || "Kasir"}
            </span>
          </div>
        </div>

        {/* Reason Selector */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-[#2C2C2C]">
            Alasan Otorisasi (Dicatat ke Audit Trail):
          </label>
          <div className="flex flex-wrap gap-1.5">
            {COMMON_REASONS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => {
                  setReason(r);
                  setCustomReason("");
                }}
                className={cn(
                  "px-2.5 py-1 text-xs rounded-lg border transition-colors text-left",
                  reason === r && !customReason
                    ? "bg-[#6FA084] text-white border-[#6FA084] font-medium"
                    : "bg-white text-[#4B5563] border-[#E5E5E0] hover:bg-[#F4F4F0]"
                )}
              >
                {r}
              </button>
            ))}
          </div>
          <Input
            placeholder="Atau ketik alasan spesifik lainnya..."
            value={customReason}
            onChange={(e) => setCustomReason(e.target.value)}
            className="text-xs h-8 bg-white border-[#E5E5E0] mt-1"
          />
        </div>

        {/* PIN Input & Keypad Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="supervisor-pin"
                className="text-xs font-bold text-[#2C2C2C] flex items-center gap-1"
              >
                <Lock className="w-3.5 h-3.5 text-[#6FA084]" />
                PIN Supervisor (4-8 Digit):
              </label>
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="text-[11px] text-[#6FA084] hover:underline flex items-center gap-1 cursor-pointer"
              >
                {showPin ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                <span>{showPin ? "Sembunyikan" : "Tampilkan"}</span>
              </button>
            </div>

            <div className="relative">
              <input
                id="supervisor-pin"
                ref={inputRef}
                type={showPin ? "text" : "password"}
                maxLength={8}
                value={pin}
                disabled={lockoutSeconds > 0 || loading || success}
                onChange={(e) => {
                  setPin(e.target.value);
                  setErrorMsg("");
                }}
                placeholder="Ketik PIN atau gunakan tombol di bawah"
                className={cn(
                  "w-full h-11 px-3 text-center text-lg font-mono tracking-widest bg-white border rounded-xl focus:outline-none transition-all",
                  errorMsg
                    ? "border-[#D64545] focus:ring-1 focus:ring-[#D64545]"
                    : "border-[#E5E5E0] focus:border-[#6FA084] focus:ring-1 focus:ring-[#6FA084]"
                )}
              />
            </div>
          </div>

          {/* Error / Lockout Messages */}
          {lockoutSeconds > 0 ? (
            <div className="p-2.5 bg-[#FDEAEA] border border-[#F5C2C2] rounded-xl flex items-center gap-2 text-xs text-[#D64545] font-medium">
              <Clock className="w-4 h-4 shrink-0 animate-spin" />
              <span>
                PIN terkunci sementara. Coba lagi dalam{" "}
                <strong>{lockoutSeconds} detik</strong>.
              </span>
            </div>
          ) : errorMsg ? (
            <div className="p-2.5 bg-[#FDEAEA] border border-[#F5C2C2] rounded-xl flex items-center gap-2 text-xs text-[#D64545]">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          ) : success ? (
            <div className="p-2.5 bg-[#E8F5E9] border border-[#C8E6C9] rounded-xl flex items-center gap-2 text-xs text-[#2E7D32] font-semibold">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-[#2E7D32]" />
              <span>Otorisasi Supervisor Berhasil! Memproses aksi...</span>
            </div>
          ) : (
            <div className="text-[11px] text-[#6B7280] text-center">
              Default Supervisor PIN: <code className="bg-[#E5E5E0] px-1.5 py-0.5 rounded font-mono text-[#2C2C2C]">123456</code> atau kata sandi pemilik.
            </div>
          )}

          {/* Quick Touch Keypad for POS Terminal */}
          <div className="grid grid-cols-3 gap-1.5 pt-1">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
              <button
                key={digit}
                type="button"
                disabled={lockoutSeconds > 0 || loading || success}
                onClick={() => handleKeypadPress(digit.toString())}
                className="h-10 text-base font-bold bg-[#F4F4F0] hover:bg-[#E5E5E0] active:bg-[#D5D5D0] text-[#1A1A1A] rounded-xl border border-[#E5E5E0] transition-colors cursor-pointer disabled:opacity-50"
              >
                {digit}
              </button>
            ))}
            <button
              type="button"
              disabled={lockoutSeconds > 0 || loading || success}
              onClick={handleClear}
              className="h-10 text-xs font-semibold bg-[#FDEAEA] hover:bg-[#FCD7D7] text-[#D64545] rounded-xl border border-[#F5C2C2] transition-colors cursor-pointer disabled:opacity-50"
            >
              Hapus
            </button>
            <button
              type="button"
              disabled={lockoutSeconds > 0 || loading || success}
              onClick={() => handleKeypadPress("0")}
              className="h-10 text-base font-bold bg-[#F4F4F0] hover:bg-[#E5E5E0] active:bg-[#D5D5D0] text-[#1A1A1A] rounded-xl border border-[#E5E5E0] transition-colors cursor-pointer disabled:opacity-50"
            >
              0
            </button>
            <button
              type="button"
              disabled={lockoutSeconds > 0 || loading || success}
              onClick={handleBackspace}
              className="h-10 text-xs font-semibold bg-[#F4F4F0] hover:bg-[#E5E5E0] text-[#6B7280] rounded-xl border border-[#E5E5E0] transition-colors cursor-pointer flex items-center justify-center disabled:opacity-50"
            >
              <Delete className="w-4 h-4" />
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="w-1/2 h-10 border-[#E5E5E0] text-[#6B7280]"
            >
              <X className="w-4 h-4 mr-1.5" />
              Batal
            </Button>
            <Button
              type="submit"
              disabled={lockoutSeconds > 0 || loading || pin.length < 4 || success}
              className="w-1/2 h-10 bg-[#6FA084] hover:bg-[#5B8870] text-white font-bold transition-colors"
            >
              {loading ? (
                <span>Memverifikasi...</span>
              ) : success ? (
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Disetujui
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4" /> Otorisasi
                </span>
              )}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
