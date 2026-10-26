"use client";

import * as React from "react";
import {
  ShieldCheck,
  X,
  Calculator,
  DollarSign,
  AlertCircle,
  EyeOff,
  ArrowRight,
  Info,
} from "lucide-react";
import { formatRupiah } from "@/lib/utils";
import { useShiftStore } from "@/stores/shiftStore";
import { useAuthStore } from "@/stores/authStore";
import {
  CASH_DENOMINATIONS,
  calculateDenominationTotal,
} from "@/services/shiftService";

type CountMode = "calculator" | "direct";

export function CloseShiftModal() {
  const {
    activeShift,
    isCloseModalOpen,
    setCloseModalOpen,
    closeShift,
    isLoading,
  } = useShiftStore();
  const { currentUser } = useAuthStore();

  const [mode, setMode] = React.useState<CountMode>("calculator");
  const [denominations, setDenominations] = React.useState<Record<number, number>>({
    100000: 0,
    50000: 0,
    20000: 0,
    10000: 0,
    5000: 0,
    2000: 0,
    1000: 0,
    500: 0,
    200: 0,
    100: 0,
  });

  const [directAmount, setDirectAmount] = React.useState<number>(0);
  const [displayDirectValue, setDisplayDirectValue] = React.useState<string>("");
  const [notes, setNotes] = React.useState<string>("");
  const [error, setError] = React.useState<string | null>(null);

  // Compute total from denomination calculator
  const calculatedTotal = React.useMemo(() => {
    return calculateDenominationTotal(denominations);
  }, [denominations]);

  const activeTotal = mode === "calculator" ? calculatedTotal : directAmount;

  const handleDenominationChange = (value: number, count: number) => {
    const safeCount = Math.max(0, count || 0);
    setDenominations((prev) => ({
      ...prev,
      [value]: safeCount,
    }));
    setError(null);
  };

  const handleDirectInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "");
    const val = Number(raw) || 0;
    setDirectAmount(val);
    setDisplayDirectValue(val > 0 ? val.toLocaleString("id-ID") : "");
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeShift) {
      setError("Tidak ada data shift yang aktif.");
      return;
    }

    if (activeTotal < 0) {
      setError("Jumlah uang fisik tidak boleh negatif.");
      return;
    }

    try {
      await closeShift({
        shiftId: activeShift.id,
        actualCash: activeTotal,
        notes: notes.trim() || undefined,
        denominationCounts: mode === "calculator" ? denominations : undefined,
      });
    } catch (err: any) {
      setError(err?.message || "Gagal melakukan rekonsiliasi kas.");
    }
  };

  if (!isCloseModalOpen || !activeShift) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-4 bg-black/60 backdrop-blur-xs select-none animate-in fade-in">
      <div className="bg-white border border-[#E5E5E0] rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#E5E5E0] flex items-center justify-between bg-[#F4F4F0] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#2C2C2C] text-white flex items-center justify-center font-bold">
              <ShieldCheck className="w-4 h-4 text-[#6FA084]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#1A1A1A]">
                Tutup Shift & Rekonsiliasi Kas (Blind Count)
              </h3>
              <p className="text-[11px] text-[#6B7280]">
                Kasir: <strong>{activeShift.cashier_name}</strong> • Mulai:{" "}
                {new Date(activeShift.start_time).toLocaleTimeString("id-ID", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}{" "}
                WIB
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setCloseModalOpen(false)}
            className="p-1 rounded-lg hover:bg-white text-[#6B7280] hover:text-[#1A1A1A] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Blind Balancing Security Notice */}
        <div className="bg-[#FAFBF9] border-b border-[#E5E5E0] px-5 py-2.5 flex items-start gap-2.5 shrink-0">
          <EyeOff className="w-4 h-4 text-[#6FA084] shrink-0 mt-0.5" />
          <div className="text-[11px] text-[#4B5563] leading-relaxed">
            <span className="font-bold text-[#1A1A1A]">Prinsip Blind Balancing: </span>
            Untuk menjaga integritas keuangan dan mencegah kecurangan uang laci, nominal penjualan teoretis sistem sengaja disembunyikan. Hitunglah seluruh uang fisik riil di laci kasir saat ini.
          </div>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto flex-1 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-[#FDEAEA] border border-[#F5C2C2] text-[#D64545] rounded-xl text-xs font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Mode Switcher */}
          <div className="flex items-center gap-2 bg-[#F4F4F0] p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setMode("calculator")}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                mode === "calculator"
                  ? "bg-white text-[#1A1A1A] shadow-xs"
                  : "text-[#6B7280] hover:text-[#1A1A1A]"
              }`}
            >
              <Calculator className="w-3.5 h-3.5 text-[#6FA084]" />
              <span>Kalkulator Pecahan Lembar & Koin</span>
            </button>
            <button
              type="button"
              onClick={() => setMode("direct")}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                mode === "direct"
                  ? "bg-white text-[#1A1A1A] shadow-xs"
                  : "text-[#6B7280] hover:text-[#1A1A1A]"
              }`}
            >
              <DollarSign className="w-3.5 h-3.5 text-[#6FA084]" />
              <span>Input Total Langsung</span>
            </button>
          </div>

          {/* TAB 1: Denomination Breakdown */}
          {mode === "calculator" ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold text-[#6B7280]">
                <span>Pecahan Nominal</span>
                <span>Jumlah (Lembar / Koin)</span>
                <span>Subtotal</span>
              </div>

              <div className="grid grid-cols-1 gap-2 max-h-56 overflow-y-auto pr-1">
                {[
                  { value: 100000, label: "Rp 100.000", tag: "Lembar" },
                  { value: 50000, label: "Rp 50.000", tag: "Lembar" },
                  { value: 20000, label: "Rp 20.000", tag: "Lembar" },
                  { value: 10000, label: "Rp 10.000", tag: "Lembar" },
                  { value: 5000, label: "Rp 5.000", tag: "Lembar" },
                  { value: 2000, label: "Rp 2.000", tag: "Lembar" },
                  { value: 1000, label: "Rp 1.000", tag: "Lembar / Koin" },
                  { value: 500, label: "Rp 500", tag: "Koin" },
                  { value: 200, label: "Rp 200", tag: "Koin" },
                  { value: 100, label: "Rp 100", tag: "Koin" },
                ].map((item) => {
                  const qty = denominations[item.value] || 0;
                  const subtotal = item.value * qty;
                  return (
                    <div
                      key={item.value}
                      className="flex items-center justify-between bg-[#F4F4F0] p-2 rounded-xl text-xs gap-2"
                    >
                      <div className="w-28 flex flex-col">
                        <span className="font-bold text-[#1A1A1A]">{item.label}</span>
                        <span className="text-[10px] text-[#6B7280]">{item.tag}</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min="0"
                          value={qty === 0 ? "" : qty}
                          onChange={(e) =>
                            handleDenominationChange(
                              item.value,
                              parseInt(e.target.value, 10) || 0
                            )
                          }
                          placeholder="0"
                          className="w-16 px-2 py-1 bg-white border border-[#E5E5E0] focus:border-[#6FA084] rounded-lg text-center font-bold text-xs focus:outline-hidden"
                        />
                        <span className="text-[11px] text-[#6B7280]">x</span>
                      </div>

                      <div className="w-24 text-right font-bold text-[#1A1A1A]">
                        {formatRupiah(subtotal)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* TAB 2: Direct Nominal Input */
            <div className="py-4 space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#1A1A1A] mb-1.5">
                  Total Uang Tunai Fisik di Laci (Rp) <span className="text-[#D64545]">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-[#6B7280]">
                    Rp
                  </span>
                  <input
                    type="text"
                    value={displayDirectValue}
                    onChange={handleDirectInputChange}
                    autoFocus
                    placeholder="0"
                    className="w-full pl-11 pr-4 py-3 bg-white border border-[#E5E5E0] focus:border-[#6FA084] rounded-xl text-xl font-bold text-[#1A1A1A] focus:outline-hidden"
                  />
                </div>
              </div>
              <p className="text-[11px] text-[#6B7280]">
                Pastikan sudah menghitung seluruh lembaran uang kertas dan koin di laci kasir secara teliti.
              </p>
            </div>
          )}

          {/* Actual Cash Count Summary Box */}
          <div className="bg-[#2C2C2C] text-white p-4 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-[#9E9E9E] block">
                Total Hitungan Fisik Kasir (Blind Count)
              </span>
              <span className="text-xl font-black text-[#6FA084]">
                {formatRupiah(activeTotal)}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-[#C4C4C4] block">
                Modal Awal Shift
              </span>
              <span className="text-xs font-bold text-white">
                {formatRupiah(activeShift.starting_cash)}
              </span>
            </div>
          </div>

          {/* Notes Input */}
          <div>
            <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">
              Catatan Rekonsiliasi / Serah Terima (Opsional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Diserahkan uang fisik ke kasir shift sore / brankas toko"
              className="w-full px-3 py-2 bg-white border border-[#E5E5E0] focus:border-[#6FA084] rounded-xl text-xs text-[#1A1A1A] focus:outline-hidden resize-none"
            />
          </div>
        </form>

        {/* Footer Actions */}
        <div className="px-5 py-3 border-t border-[#E5E5E0] bg-[#F4F4F0] flex gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setCloseModalOpen(false)}
            className="flex-1 py-2.5 px-4 rounded-xl border border-[#E5E5E0] text-xs font-bold text-[#4B5563] hover:bg-white transition-colors cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading}
            className="flex-2 py-2.5 px-4 rounded-xl bg-[#6FA084] hover:bg-[#5D8C72] text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
          >
            <span>{isLoading ? "Memproses Rekonsiliasi..." : "Kirim Hitungan & Rekonsiliasi"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
