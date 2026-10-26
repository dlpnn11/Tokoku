"use client";

import * as React from "react";
import { Coins, X, Check, AlertCircle } from "lucide-react";
import { formatRupiah } from "@/lib/utils";
import { useShiftStore } from "@/stores/shiftStore";
import { useAuthStore } from "@/stores/authStore";

const QUICK_PRESETS = [50000, 100000, 200000, 500000];

export function OpenShiftModal() {
  const { isOpenModalOpen, setOpenModalOpen, openShift, isLoading } = useShiftStore();
  const { currentUser } = useAuthStore();

  const [startingCash, setStartingCash] = React.useState<number>(100000);
  const [displayValue, setDisplayValue] = React.useState<string>("100.000");
  const [notes, setNotes] = React.useState<string>("");
  const [error, setError] = React.useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "");
    const val = Number(raw) || 0;
    setStartingCash(val);
    setDisplayValue(val > 0 ? val.toLocaleString("id-ID") : "");
    setError(null);
  };

  const handleSelectPreset = (amount: number) => {
    setStartingCash(amount);
    setDisplayValue(amount.toLocaleString("id-ID"));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (startingCash < 0) {
      setError("Modal awal tidak boleh negatif.");
      return;
    }

    try {
      await openShift({
        userId: currentUser?.id || "22222222-2222-2222-2222-222222222222",
        cashierName: currentUser?.full_name || "Kasir",
        startingCash,
        notes: notes.trim() || undefined,
      });
      setOpenModalOpen(false);
    } catch (err: any) {
      setError(err?.message || "Gagal membuka shift kasir.");
    }
  };

  if (!isOpenModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none animate-in fade-in">
      <div className="bg-white border border-[#E5E5E0] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#E5E5E0] flex items-center justify-between bg-[#F4F4F0]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#6FA084] text-white flex items-center justify-center font-bold">
              <Coins className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#1A1A1A]">Buka Shift Kasir Baru</h3>
              <p className="text-[11px] text-[#6B7280]">
                Petugas: <strong>{currentUser?.full_name || "Kasir"}</strong>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setOpenModalOpen(false)}
            className="p-1 rounded-lg hover:bg-white text-[#6B7280] hover:text-[#1A1A1A] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="bg-[#FAFBF9] border border-[#E5E5E0] rounded-xl p-3 text-xs text-[#4B5563] space-y-1">
            <p className="font-semibold text-[#1A1A1A]">Apa itu Modal Awal?</p>
            <p className="text-[11px] text-[#6B7280] leading-relaxed">
              Modal awal adalah uang kembalian fisik (kertas & koin) yang Anda siapkan di laci kasir saat memulai jam kerja kasir.
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-[#FDEAEA] border border-[#F5C2C2] text-[#D64545] rounded-xl text-xs font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-[#1A1A1A] mb-1.5">
              Modal Awal Laci Kasir (Rp) <span className="text-[#D64545]">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-[#6B7280]">
                Rp
              </span>
              <input
                type="text"
                value={displayValue}
                onChange={handleInputChange}
                autoFocus
                placeholder="0"
                className="w-full pl-11 pr-4 py-2.5 bg-white border border-[#E5E5E0] focus:border-[#6FA084] rounded-xl text-lg font-bold text-[#1A1A1A] focus:outline-hidden"
              />
            </div>
          </div>

          {/* Quick Presets */}
          <div>
            <label className="block text-[11px] font-semibold text-[#6B7280] mb-1.5">
              Pilihan Cepat Nominal Modal:
            </label>
            <div className="grid grid-cols-4 gap-2">
              {QUICK_PRESETS.map((amount) => (
                <button
                  type="button"
                  key={amount}
                  onClick={() => handleSelectPreset(amount)}
                  className={`px-2 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                    startingCash === amount
                      ? "bg-[#6FA084] text-white border-[#6FA084]"
                      : "bg-[#F4F4F0] text-[#1A1A1A] border-[#E5E5E0] hover:bg-white"
                  }`}
                >
                  {formatRupiah(amount).replace("Rp", "").trim()}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">
              Catatan Pembukaan (Opsional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Shift pagi, uang pecahan 5rb & 2rb siap"
              className="w-full px-3.5 py-2 bg-white border border-[#E5E5E0] focus:border-[#6FA084] rounded-xl text-xs text-[#1A1A1A] focus:outline-hidden"
            />
          </div>

          {/* Actions */}
          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={() => setOpenModalOpen(false)}
              className="flex-1 py-2.5 px-4 rounded-xl border border-[#E5E5E0] text-xs font-bold text-[#4B5563] hover:bg-[#F4F4F0] transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 py-2.5 px-4 rounded-xl bg-[#6FA084] hover:bg-[#5D8C72] text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{isLoading ? "Membuka..." : "Buka Shift Kasir"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
