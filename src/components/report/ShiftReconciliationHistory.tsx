"use client";

import * as React from "react";
import { Coins, CheckCircle2, AlertTriangle, XCircle, RefreshCw, FileText } from "lucide-react";
import { formatRupiah } from "@/lib/utils";
import { PosShift } from "@/types/database";
import { shiftService } from "@/services/shiftService";

export function ShiftReconciliationHistory() {
  const [shifts, setShifts] = React.useState<PosShift[]>([]);
  const [loading, setLoading] = React.useState(true);

  const fetchHistory = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await shiftService.getShiftHistory(10);
      setShifts(data);
    } catch {
      // Non-blocking
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const formatTime = (iso?: string | null) => {
    if (!iso) return "-";
    return new Date(iso).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="bg-white border border-[#E5E5E0] rounded-xl p-5 shadow-2xs space-y-4 print:break-inside-avoid">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#FAFBF9] border border-[#E5E5E0] flex items-center justify-center text-[#6FA084]">
            <Coins className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-[#1A1A1A]">
              Riwayat Rekonsiliasi Shift & Uang Laci Kasir (Blind Balancing)
            </h3>
            <p className="text-[11px] text-[#6B7280]">
              Pengawasan integritas fisik kasir, selisih uang laci, dan audit serah terima shift
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={fetchHistory}
          className="p-1.5 text-xs text-[#6B7280] hover:text-[#1A1A1A] hover:bg-[#F4F4F0] rounded-lg transition-colors cursor-pointer"
          title="Perbarui Riwayat Shift"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[#6FA084]" : ""}`} />
        </button>
      </div>

      {loading ? (
        <div className="h-32 flex items-center justify-center text-xs text-[#6B7280]">
          <RefreshCw className="w-5 h-5 animate-spin text-[#6FA084]" />
        </div>
      ) : shifts.length === 0 ? (
        <div className="py-8 text-center text-xs text-[#6B7280] border border-dashed border-[#E5E5E0] rounded-xl">
          Belum ada riwayat shift yang tersimpan. Shift kasir akan tercatat saat kasir membuka terminal POS.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-[#E5E5E0] text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">
                <th className="py-2.5 px-3">Petugas Kasir</th>
                <th className="py-2.5 px-3">Waktu Buka / Tutup</th>
                <th className="py-2.5 px-3 text-right">Modal Awal</th>
                <th className="py-2.5 px-3 text-right">Penjualan Tunai</th>
                <th className="py-2.5 px-3 text-right">Fisik Kasir (Blind)</th>
                <th className="py-2.5 px-3 text-right">Selisih Kas</th>
                <th className="py-2.5 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E5E0]">
              {shifts.map((shift) => {
                const disc = shift.discrepancy || 0;
                const isClosed = shift.status === "closed";

                return (
                  <tr key={shift.id} className="hover:bg-[#FAFBF9] transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-[#1A1A1A]">
                      {shift.cashier_name}
                      {shift.notes && (
                        <span className="block text-[10px] text-[#6B7280] font-normal italic truncate max-w-[140px]">
                          "{shift.notes}"
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-[11px] text-[#4B5563]">
                      <div>{formatTime(shift.start_time)}</div>
                      <div className="text-[10px] text-[#6B7280]">
                        {isClosed ? `s/d ${formatTime(shift.end_time)}` : "Sedang Berjalan..."}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right font-medium text-[#1A1A1A]">
                      {formatRupiah(shift.starting_cash)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-medium text-[#6FA084]">
                      {formatRupiah(shift.total_cash_sales)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-[#1A1A1A]">
                      {isClosed ? formatRupiah(shift.actual_cash || 0) : "-"}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold">
                      {!isClosed ? (
                        <span className="text-[#6B7280] font-normal">-</span>
                      ) : disc === 0 ? (
                        <span className="text-[#6FA084]">Rp 0</span>
                      ) : disc > 0 ? (
                        <span className="text-[#3B82F6]">+{formatRupiah(disc)}</span>
                      ) : (
                        <span className="text-[#D64545]">{formatRupiah(disc)}</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {!isClosed ? (
                        <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FFF8ED] text-[#D97706] border border-[#FDE68A]">
                          AKTIF
                        </span>
                      ) : disc === 0 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#EBF3EE] text-[#6FA084] border border-[#CDE3D5]">
                          <CheckCircle2 className="w-3 h-3" />
                          PAS
                        </span>
                      ) : disc > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#EBF2F7] text-[#3B82F6] border border-[#BFDBFE]">
                          <AlertTriangle className="w-3 h-3" />
                          LEBIH
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FDEAEA] text-[#D64545] border border-[#F5C2C2]">
                          <XCircle className="w-3 h-3" />
                          KURANG
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
