"use client";

import * as React from "react";
import { Coins, LogOut, AlertCircle, Clock, ShieldCheck } from "lucide-react";
import { formatRupiah } from "@/lib/utils";
import { useShiftStore } from "@/stores/shiftStore";
import { useAuthStore } from "@/stores/authStore";

export function ShiftStatusBar() {
  const {
    activeShift,
    initShift,
    setOpenModalOpen,
    setCloseModalOpen,
  } = useShiftStore();
  const { currentUser } = useAuthStore();

  React.useEffect(() => {
    initShift(currentUser?.id);
  }, [initShift, currentUser?.id]);

  const formatStartTime = (iso: string) => {
    try {
      return new Date(iso).toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "-";
    }
  };

  if (activeShift) {
    return (
      <div className="mb-3 px-4 py-2.5 rounded-xl bg-[#F4F8F5] border border-[#D5E5DC] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 select-none animate-in fade-in">
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#6FA084] shrink-0 animate-pulse" />
          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-[#1A1A1A]">
            <span className="font-bold">
              Shift Aktif: <span className="text-[#6FA084]">{activeShift.cashier_name}</span>
            </span>
            <span className="text-[#6B7280] hidden md:inline">•</span>
            <span className="text-[#4B5563]">
              Modal Awal: <strong>{formatRupiah(activeShift.starting_cash)}</strong>
            </span>
            <span className="text-[#6B7280] hidden md:inline">•</span>
            <span className="text-[#6B7280] flex items-center gap-1">
              <Clock className="w-3 h-3 text-[#6FA084]" />
              Mulai: {formatStartTime(activeShift.start_time)} WIB
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setCloseModalOpen(true)}
          className="self-end sm:self-auto px-3 py-1.5 rounded-lg bg-[#2C2C2C] hover:bg-[#1A1A1A] text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95"
          title="Tutup Shift & Rekonsiliasi Uang Kas Laci (Blind Count)"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-[#6FA084]" />
          <span>Tutup Shift (Rekonsiliasi)</span>
        </button>
      </div>
    );
  }

  return (
    <div className="mb-3 px-4 py-2.5 rounded-xl bg-[#FFF8ED] border border-[#FDE68A] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 select-none animate-in fade-in">
      <div className="flex items-center gap-2.5">
        <AlertCircle className="w-4 h-4 text-[#D97706] shrink-0" />
        <div className="text-xs text-[#92400E]">
          <span className="font-bold">Shift kasir belum dibuka.</span> Masukkan modal awal laci kasir untuk pelacakan fisik yang aman.
        </div>
      </div>

      <button
        type="button"
        onClick={() => setOpenModalOpen(true)}
        className="self-end sm:self-auto px-3.5 py-1.5 rounded-lg bg-[#6FA084] hover:bg-[#5D8C72] text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95"
      >
        <Coins className="w-3.5 h-3.5" />
        <span>Buka Shift (Modal Awal)</span>
      </button>
    </div>
  );
}
