"use client";

import * as React from "react";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Printer,
  X,
  LogOut,
  Clock,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { formatRupiah } from "@/lib/utils";
import { useShiftStore } from "@/stores/shiftStore";
import { useAuthStore } from "@/stores/authStore";
import { useRouter } from "next/navigation";

export function ShiftSummaryModal() {
  const router = useRouter();
  const { isSummaryModalOpen, setSummaryModalOpen, lastReconciliationResult } =
    useShiftStore();
  const { logout } = useAuthStore();

  if (!isSummaryModalOpen || !lastReconciliationResult) return null;

  const { shift, discrepancy, status, summary } = lastReconciliationResult;

  const formatDateTime = (iso?: string | null) => {
    if (!iso) return "-";
    return new Date(iso).toLocaleString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const calculateDuration = () => {
    if (!shift.start_time || !shift.end_time) return "-";
    const start = new Date(shift.start_time).getTime();
    const end = new Date(shift.end_time).getTime();
    const diffMinutes = Math.max(1, Math.round((end - start) / (1000 * 60)));
    const hours = Math.floor(diffMinutes / 60);
    const mins = diffMinutes % 60;
    if (hours === 0) return `${mins} Menit`;
    return `${hours} Jam ${mins} Menit`;
  };

  const handlePrint = () => {
    window.print();
  };

  const handleFinishAndLogout = async () => {
    setSummaryModalOpen(false);
    await logout();
    window.location.href = "/login?action=logout";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-4 bg-black/60 backdrop-blur-xs select-none animate-in fade-in">
      <div className="bg-white border border-[#E5E5E0] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        {/* Header (Screen only) */}
        <div className="print:hidden px-5 py-4 border-b border-[#E5E5E0] flex items-center justify-between bg-[#F4F4F0] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#6FA084] text-white flex items-center justify-center font-bold">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#1A1A1A]">
                Hasil Rekonsiliasi Kasir (Z-Report)
              </h3>
              <p className="text-[11px] text-[#6B7280]">
                ID Shift: {shift.id.slice(0, 8)}...
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSummaryModalOpen(false)}
            className="p-1 rounded-lg hover:bg-white text-[#6B7280] hover:text-[#1A1A1A] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Printable Struk Thermal Layout */}
        <div
          id="shift-receipt-print"
          className="p-5 md:p-6 overflow-y-auto flex-1 font-mono text-xs text-[#1A1A1A] space-y-4"
        >
          {/* Toko Header */}
          <div className="text-center space-y-1 pb-3 border-b border-dashed border-[#C4C4C4]">
            <h2 className="text-base font-black tracking-wide">TOKOKU POS</h2>
            <p className="text-[11px] text-[#4B5563]">
              Laporan Rekonsiliasi Tutup Shift (Z-Report)
            </p>
            <p className="text-[10px] text-[#6B7280]">
              Toko Grosir Sumber Rejeki • Kramat Jati Blok A5
            </p>
          </div>

          {/* Shift Details */}
          <div className="space-y-1 text-[11px]">
            <div className="flex justify-between">
              <span className="text-[#6B7280]">Petugas Kasir:</span>
              <span className="font-bold">{shift.cashier_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6B7280]">Waktu Buka Shift:</span>
              <span>{formatDateTime(shift.start_time)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6B7280]">Waktu Tutup Shift:</span>
              <span>{formatDateTime(shift.end_time)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6B7280]">Durasi Shift:</span>
              <span className="font-bold">{calculateDuration()}</span>
            </div>
          </div>

          {/* Sales Breakdown */}
          <div className="pt-2 border-t border-dashed border-[#C4C4C4] space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span>Modal Awal Laci:</span>
              <span className="font-bold">{formatRupiah(summary.startingCash)}</span>
            </div>
            <div className="flex justify-between">
              <span>Penjualan Tunai ({shift.transactions_count} tx):</span>
              <span className="font-bold text-[#6FA084]">
                +{formatRupiah(summary.totalCashSales)}
              </span>
            </div>
            <div className="flex justify-between text-[#6B7280]">
              <span>Penjualan QRIS:</span>
              <span>+{formatRupiah(summary.totalQrisSales)}</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-[#E5E5E0] font-bold">
              <span>Total Omzet Shift:</span>
              <span>{formatRupiah(summary.totalSales)}</span>
            </div>
          </div>

          {/* Cash Drawer Reconciliation Result */}
          <div className="pt-2 border-t-2 border-solid border-[#1A1A1A] space-y-2">
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-[#4B5563]">
                Total Kas Teoretis Sistem (Expected):
              </span>
              <span className="font-black text-[#1A1A1A]">
                {formatRupiah(summary.expectedCash)}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-[#4B5563]">
                Total Fisik Dihitung Kasir (Actual):
              </span>
              <span className="font-black text-[#1A1A1A]">
                {formatRupiah(shift.actual_cash || 0)}
              </span>
            </div>

            {/* Reconciliation Status Badge */}
            <div className="pt-2">
              {status === "BALANCED" && (
                <div className="p-3 rounded-xl bg-[#EBF3EE] border border-[#6FA084] text-[#2C6246] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-[#6FA084] shrink-0" />
                    <div>
                      <div className="font-black text-xs">KAS PAS / SEIMBANG</div>
                      <div className="text-[10px]">Uang fisik tepat sesuai kalkulasi</div>
                    </div>
                  </div>
                  <span className="font-black text-sm">Rp 0</span>
                </div>
              )}

              {status === "OVER" && (
                <div className="p-3 rounded-xl bg-[#EBF2F7] border border-[#3B82F6] text-[#1E3A8A] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-[#3B82F6] shrink-0" />
                    <div>
                      <div className="font-black text-xs">KAS LEBIH (OVERAGE)</div>
                      <div className="text-[10px]">Uang fisik melebihi sistem</div>
                    </div>
                  </div>
                  <span className="font-black text-sm text-[#1E3A8A]">
                    +{formatRupiah(discrepancy)}
                  </span>
                </div>
              )}

              {status === "SHORT" && (
                <div className="p-3 rounded-xl bg-[#FDEAEA] border border-[#D64545] text-[#D64545] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <XCircle className="w-5 h-5 text-[#D64545] shrink-0" />
                    <div>
                      <div className="font-black text-xs">KAS KURANG (SHORTAGE)</div>
                      <div className="text-[10px]">Uang fisik kurang dari sistem</div>
                    </div>
                  </div>
                  <span className="font-black text-sm text-[#D64545]">
                    {formatRupiah(discrepancy)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Notes if any */}
          {shift.notes && (
            <div className="pt-2 border-t border-dashed border-[#C4C4C4] text-[11px] text-[#4B5563]">
              <span className="font-semibold block text-[#1A1A1A]">Catatan Shift:</span>
              <p className="italic mt-0.5">"{shift.notes}"</p>
            </div>
          )}

          {/* Signature Signoff Lines for Print */}
          <div className="hidden print:grid grid-cols-2 gap-8 pt-8 text-center text-[10px]">
            <div>
              <p className="text-[#6B7280]">Kasir yang Menyerahkan</p>
              <div className="h-12" />
              <p className="font-bold border-t border-black pt-1">{shift.cashier_name}</p>
            </div>
            <div>
              <p className="text-[#6B7280]">Supervisor / Pemilik Toko</p>
              <div className="h-12" />
              <p className="font-bold border-t border-black pt-1">( ........................... )</p>
            </div>
          </div>
        </div>

        {/* Footer Actions (Screen only) */}
        <div className="print:hidden px-5 py-3 border-t border-[#E5E5E0] bg-[#F4F4F0] flex flex-wrap gap-2 shrink-0">
          <button
            type="button"
            onClick={handlePrint}
            className="flex-1 py-2.5 px-4 rounded-xl border border-[#2C2C2C] text-[#2C2C2C] hover:bg-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Struk Rekap</span>
          </button>

          <button
            type="button"
            onClick={handleFinishAndLogout}
            className="flex-1 py-2.5 px-4 rounded-xl border border-[#D64545] text-[#D64545] hover:bg-[#FDEAEA] text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Ganti Shift / Logout</span>
          </button>

          <button
            type="button"
            onClick={() => setSummaryModalOpen(false)}
            className="w-full sm:w-auto py-2.5 px-5 rounded-xl bg-[#6FA084] hover:bg-[#5D8C72] text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
          >
            <span>Selesai</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
