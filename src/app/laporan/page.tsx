"use client";

import * as React from "react";
import { AppShell } from "@/components/layout/AppShell";
import {
  TrendingUp,
  Wallet,
  Receipt,
  Package,
  FileSpreadsheet,
  FileDown,
  Printer,
  Calendar,
  RefreshCw,
  Trophy,
  Layers,
  ArrowUpRight,
  ShieldAlert,
  ChevronDown,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatRupiah, cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";
import {
  reportService,
  FinancialReportSummary,
} from "@/services/reportService";
import { DailyRevenueChart } from "@/components/report/DailyRevenueChart";
import { BestSellersList } from "@/components/report/BestSellersList";
import { CategoryBreakdown } from "@/components/report/CategoryBreakdown";
import { MonthlyTrendChart } from "@/components/report/MonthlyTrendChart";

type PeriodFilter = "today" | "week" | "month" | "custom";

export default function LaporanPage() {
  const { currentUser } = useAuthStore();
  const isOwner = currentUser.role === "pemilik";

  const [period, setPeriod] = React.useState<PeriodFilter>("month");
  const [customStartDate, setCustomStartDate] = React.useState("");
  const [customEndDate, setCustomEndDate] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [exportingExcel, setExportingExcel] = React.useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = React.useState(false);
  const exportMenuRef = React.useRef<HTMLDivElement>(null);
  const [report, setReport] = React.useState<FinancialReportSummary | null>(null);
  const [monthlyHistory, setMonthlyHistory] = React.useState<any[]>([]);

  // Close export menu on outside click or escape
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setIsExportMenuOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsExportMenuOpen(false);
    };

    if (isExportMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isExportMenuOpen]);

  // Compute dates based on period
  const getDateRange = React.useCallback((): { start?: string; end?: string; label: string } => {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);

    if (period === "today") {
      return { start: todayStr, end: todayStr, label: "Hari Ini" };
    }

    if (period === "week") {
      const pastWeek = new Date();
      pastWeek.setDate(pastWeek.getDate() - 6);
      return {
        start: pastWeek.toISOString().slice(0, 10),
        end: todayStr,
        label: "7 Hari Terakhir",
      };
    }

    if (period === "month") {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      return {
        start: startOfMonth.toISOString().slice(0, 10),
        end: todayStr,
        label: now.toLocaleDateString("id-ID", { month: "long", year: "numeric" }),
      };
    }

    // Custom
    return {
      start: customStartDate || undefined,
      end: customEndDate || undefined,
      label:
        customStartDate && customEndDate
          ? `${customStartDate} s/d ${customEndDate}`
          : "Periode Kustom",
    };
  }, [period, customStartDate, customEndDate]);

  const loadReport = React.useCallback(async () => {
    setLoading(true);
    try {
      const { start, end } = getDateRange();
      const [res, historyRes] = await Promise.all([
        reportService.getFinancialReport(start, end),
        reportService.getMonthlyHistoricalTrend(),
      ]);
      setReport(res);
      setMonthlyHistory(historyRes);
    } catch (err) {
      console.error("Gagal memuat laporan:", err);
    } finally {
      setLoading(false);
    }
  }, [getDateRange]);

  React.useEffect(() => {
    loadReport();
  }, [loadReport]);

  const handleExportCsv = () => {
    if (!report) return;
    const { label } = getDateRange();
    reportService.exportToCsv(report, label);
  };

  const handleExportExcel = async () => {
    if (!report) return;
    try {
      setExportingExcel(true);
      const { label } = getDateRange();
      await reportService.exportToExcel(report, label);
    } catch (err) {
      console.error("Gagal mengekspor file Excel:", err);
      alert("Terjadi kesalahan saat memproses file Excel.");
    } finally {
      setExportingExcel(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Profit margin percentage
  const profitMarginPercent =
    report && report.totalRevenue > 0
      ? Math.round((report.netProfit / report.totalRevenue) * 100)
      : 0;

  if (!isOwner) {
    return (
      <AppShell title="AKSES DIBATASI">
        <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6 space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-[#FFF0F0] border border-[#F8BEBE] flex items-center justify-center text-[#D64545]">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-[#1A1A1A]">Halaman Khusus Pemilik Toko</h2>
            <p className="text-xs text-[#6B7280] max-w-md">
              Laporan keuangan, omzet, dan margin laba bersih hanya dapat diakses oleh akun dengan peran <strong>Pemilik</strong>.
            </p>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="LAPORAN KEUANGAN">
      <div className="space-y-6 print:space-y-4">
        {/* OFFICIAL PRINT HEADER (Only visible when printing to paper/PDF) */}
        <div className="hidden print:block border-b-2 border-[#2C2C2C] pb-4 mb-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-xs bg-[#6FA084] inline-block" />
                <h1 className="text-xl font-black text-[#1A1A1A] tracking-wider uppercase">
                  TOKOKU — LAPORAN KEUANGAN & ANALITIK
                </h1>
              </div>
              <p className="text-xs text-[#6B7280] font-medium mt-1">
                Toko Grosir Sumber Rejeki • Pasar Induk Kramat Jati Blok A5
              </p>
            </div>
            <div className="text-right text-xs space-y-0.5">
              <div className="font-bold text-[#1A1A1A] bg-[#F4F8F5] px-2.5 py-1 rounded border border-[#D5E5DC] inline-block">
                Periode: {getDateRange().label}
              </div>
              <p className="text-[#6B7280] pt-1">
                Dicetak: {new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              </p>
              <p className="text-[#6B7280]">
                Oleh: <strong className="text-[#1A1A1A]">{currentUser.full_name}</strong> ({currentUser.role === "pemilik" ? "Pemilik Toko" : "Kasir"})
              </p>
            </div>
          </div>
        </div>

        {/* Page Header (Screen only) */}
        <div className="print:hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-[#1A1A1A]">
              Laporan Keuangan & Analitik Penjualan
            </h1>
            <p className="text-xs text-[#6B7280]">
              Analisis omzet kasir, estimasi laba bersih, barang terlaris, dan ekspor pembukuan toko.
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={loadReport}
            className="gap-2 self-start sm:self-auto text-xs"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
            Perbarui Laporan
          </Button>
        </div>

        {/* PERIOD FILTER BAR & EXPORT ACTIONS (Screen only) */}
        <div className="print:hidden bg-white border border-[#E5E5E0] rounded-xl p-4 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Period Toggle Pills */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-[#6B7280] mr-1">Periode:</span>

            <button
              onClick={() => setPeriod("today")}
              className={cn(
                "px-3.5 py-1.5 rounded-full text-xs font-bold cursor-pointer transition-all",
                period === "today"
                  ? "bg-[#6FA084] text-white"
                  : "bg-white border border-[#E5E5E0] text-[#6B7280] hover:bg-[#F4F8F5]"
              )}
            >
              Hari Ini
            </button>

            <button
              onClick={() => setPeriod("week")}
              className={cn(
                "px-3.5 py-1.5 rounded-full text-xs font-bold cursor-pointer transition-all",
                period === "week"
                  ? "bg-[#6FA084] text-white"
                  : "bg-white border border-[#E5E5E0] text-[#6B7280] hover:bg-[#F4F8F5]"
              )}
            >
              7 Hari Terakhir
            </button>

            <button
              onClick={() => setPeriod("month")}
              className={cn(
                "px-3.5 py-1.5 rounded-full text-xs font-bold cursor-pointer transition-all",
                period === "month"
                  ? "bg-[#6FA084] text-white"
                  : "bg-white border border-[#E5E5E0] text-[#6B7280] hover:bg-[#F4F8F5]"
              )}
            >
              Bulan Ini
            </button>

            <button
              onClick={() => setPeriod("custom")}
              className={cn(
                "px-3.5 py-1.5 rounded-full text-xs font-bold cursor-pointer transition-all",
                period === "custom"
                  ? "bg-[#6FA084] text-white"
                  : "bg-white border border-[#E5E5E0] text-[#6B7280] hover:bg-[#F4F8F5]"
              )}
            >
              Kustom
            </button>
          </div>

          {/* Custom Date Inputs (if custom is active) */}
          {period === "custom" && (
            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="text-xs h-9 w-36"
                title="Tanggal Mulai"
              />
              <span className="text-xs text-[#6B7280]">s/d</span>
              <Input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="text-xs h-9 w-36"
                title="Tanggal Selesai"
              />
            </div>
          )}

          {/* Export & Print Actions */}
          <div className="flex items-center gap-2">
            {/* Unified Export Dropdown Menu */}
            <div className="relative" ref={exportMenuRef}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsExportMenuOpen((prev) => !prev)}
                disabled={exportingExcel || !report}
                className={cn(
                  "gap-2 text-xs font-bold h-9 border-[#6FA084] text-[#6FA084] hover:bg-[#F4F8F5] cursor-pointer transition-colors shadow-2xs",
                  isExportMenuOpen && "bg-[#F4F8F5]"
                )}
                title="Pilih format untuk mengekspor laporan pembukuan toko"
              >
                {exportingExcel ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-[#6FA084]" />
                ) : (
                  <Download className="w-4 h-4 text-[#6FA084]" />
                )}
                <span>{exportingExcel ? "Menyiapkan File..." : "Ekspor"}</span>
                <ChevronDown
                  className={cn(
                    "w-3.5 h-3.5 text-[#6FA084] transition-transform duration-200",
                    isExportMenuOpen && "rotate-180"
                  )}
                />
              </Button>

              {/* Floating Dropdown Menu */}
              {isExportMenuOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-72 bg-white border border-[#E5E5E0] rounded-xl shadow-lg z-40 p-1.5 space-y-1 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#9E9E9E]">
                    Pilih Format Ekspor
                  </div>

                  {/* Option 1: .xlsx (Format) */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsExportMenuOpen(false);
                      handleExportExcel();
                    }}
                    disabled={exportingExcel}
                    className="w-full text-left p-2.5 rounded-lg hover:bg-[#F4F8F5] transition-colors flex items-start gap-2.5 cursor-pointer group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-[#2F5597] text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                      <FileSpreadsheet className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-[#1A1A1A] group-hover:text-[#2F5597]">
                          .xlsx (Format)
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-[#EBF1F9] text-[#2F5597]">
                          Rapi
                        </span>
                      </div>
                      <p className="text-[11px] text-[#6B7280] leading-tight mt-0.5">
                        Tabel Excel berformat biru, border, formula & rupiah
                      </p>
                    </div>
                  </button>

                  {/* Option 2: .csv (Polos) */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsExportMenuOpen(false);
                      handleExportCsv();
                    }}
                    className="w-full text-left p-2.5 rounded-lg hover:bg-[#F9F9F7] transition-colors flex items-start gap-2.5 cursor-pointer group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-[#E5E5E0] text-[#1A1A1A] flex items-center justify-center shrink-0 mt-0.5">
                      <FileDown className="w-4 h-4 text-[#6B7280]" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-[#1A1A1A] group-hover:text-[#1A1A1A]">
                          .csv (Polos)
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-[#F0F0EB] text-[#6B7280]">
                          Mentah
                        </span>
                      </div>
                      <p className="text-[11px] text-[#6B7280] leading-tight mt-0.5">
                        Data teks murni tanpa format warna / styling tabel
                      </p>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* 3. Cetak Dokumen Resmi */}
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="gap-1.5 text-xs font-bold h-9 border-[#E5E5E0] hover:bg-[#FAFBF9] cursor-pointer"
              title="Cetak atau Simpan sebagai PDF"
            >
              <Printer className="w-4 h-4 text-[#1A1A1A]" />
              Cetak
            </Button>
          </div>
        </div>

        {/* 4 FINANCIAL KPI CARDS ROW */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 print:grid-cols-4 gap-4 print:gap-3">
          {/* Card 1: Total Pendapatan / Omzet */}
          <div className="bg-white border border-[#E5E5E0] rounded-xl p-5 print:p-3.5 shadow-2xs print:shadow-none space-y-2 print:break-inside-avoid">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#6B7280]">
                Total Pendapatan (Omzet)
              </span>
              <div className="w-8 h-8 rounded-lg bg-[#F4F8F5] border border-[#D5E5DC] flex items-center justify-center text-[#6FA084]">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-[#1A1A1A]">
              {formatRupiah(report?.totalRevenue || 0)}
            </p>
            <p className="text-[11px] text-[#6B7280]">
              Berdasarkan {report?.totalTransactions || 0} transaksi selesai
            </p>
          </div>

          {/* Card 2: Laba Bersih (Estimasi Keuntungan) */}
          <div className="bg-white border border-[#E5E5E0] rounded-xl p-5 print:p-3.5 shadow-2xs print:shadow-none space-y-2 print:break-inside-avoid">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#6B7280]">
                Laba Bersih (Untung)
              </span>
              <div className="w-8 h-8 rounded-lg bg-[#FAFBF9] border border-[#E5E5E0] flex items-center justify-center text-[#6FA084]">
                <Wallet className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-[#6FA084]">
              {formatRupiah(report?.netProfit || 0)}
            </p>
            <div className="flex items-center gap-1.5 text-[11px]">
              <span className="px-1.5 py-0.5 rounded-sm bg-[#EAF3EC] text-[#6FA084] font-bold">
                Margin {profitMarginPercent}%
              </span>
              <span className="text-[#6B7280]">setelah HPP modal</span>
            </div>
          </div>

          {/* Card 3: Rata-rata per Transaksi */}
          <div className="bg-white border border-[#E5E5E0] rounded-xl p-5 print:p-3.5 shadow-2xs print:shadow-none space-y-2 print:break-inside-avoid">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#6B7280]">
                Rata-rata per Transaksi
              </span>
              <div className="w-8 h-8 rounded-lg bg-[#FAFBF9] border border-[#E5E5E0] flex items-center justify-center text-[#6FA084]">
                <Receipt className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-[#1A1A1A]">
              {formatRupiah(report?.averageBasketSize || 0)}
            </p>
            <p className="text-[11px] text-[#6B7280]">
              Nilai keranjang belanja rata-rata
            </p>
          </div>

          {/* Card 4: Total Produk Terjual */}
          <div className="bg-white border border-[#E5E5E0] rounded-xl p-5 print:p-3.5 shadow-2xs print:shadow-none space-y-2 print:break-inside-avoid">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#6B7280]">
                Total Produk Terjual
              </span>
              <div className="w-8 h-8 rounded-lg bg-[#FAFBF9] border border-[#E5E5E0] flex items-center justify-center text-[#6FA084]">
                <Package className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-[#1A1A1A]">
              {(report?.totalUnitsSold || 0).toLocaleString("id-ID")}{" "}
              <span className="text-sm font-normal text-[#6B7280]">pcs</span>
            </p>
            <p className="text-[11px] text-[#6B7280]">
              Volume seluruh barang keluar
            </p>
          </div>
        </div>

        {/* TWO-COLUMN ANALYTICS LAYOUT (65% / 35%) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 print:grid-cols-12 gap-5 print:gap-4">
          {/* LEFT COLUMN (65% -> 8 cols on 12-grid) */}
          <div className="lg:col-span-8 print:col-span-8 space-y-5 print:space-y-4">
            {/* Chart Card: Grafik Pendapatan Harian */}
            <div className="bg-white border border-[#E5E5E0] rounded-xl p-5 print:p-4 shadow-2xs print:shadow-none space-y-4 print:break-inside-avoid">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-[#1A1A1A]">
                    Grafik Pendapatan Harian
                  </h3>
                  <p className="text-[11px] text-[#6B7280]">
                    Visualisasi volume perolehan uang kasir harian
                  </p>
                </div>
                <span className="text-xs font-bold text-[#6FA084] bg-[#F4F8F5] px-2.5 py-1 rounded-md">
                  {getDateRange().label}
                </span>
              </div>

              {loading ? (
                <div className="h-64 flex items-center justify-center text-xs text-[#6B7280]">
                  <RefreshCw className="w-5 h-5 animate-spin mr-2 text-[#6FA084]" />
                  Mengkalkulasi grafik pendapatan...
                </div>
              ) : (
                <DailyRevenueChart data={report?.dailyTrend || []} />
              )}
            </div>

            {/* Chart Card 2: Grafik Tren Bulanan Historis (2025 - 2026) */}
            <div className="bg-white border border-[#E5E5E0] rounded-xl p-5 print:p-4 shadow-2xs print:shadow-none space-y-4 print:break-inside-avoid">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-[#1A1A1A]">
                    Grafik Tren Bulanan (Historis 2025 – 2026)
                  </h3>
                  <p className="text-[11px] text-[#6B7280]">
                    Akumulasi omzet per bulan dari akhir 2025 hingga sekarang
                  </p>
                </div>
                <span className="text-xs font-bold text-[#6B7280] bg-[#FAFBF9] border border-[#E5E5E0] px-2.5 py-1 rounded-md">
                  Historis Lengkap
                </span>
              </div>

              {loading ? (
                <div className="h-64 flex items-center justify-center text-xs text-[#6B7280]">
                  <RefreshCw className="w-5 h-5 animate-spin mr-2 text-[#6FA084]" />
                  Memuat data tren bulanan...
                </div>
              ) : (
                <MonthlyTrendChart data={monthlyHistory} />
              )}
            </div>

            {/* Arus Kas & Rincian Margin Toko */}
            <div className="bg-white border border-[#E5E5E0] rounded-xl p-5 print:p-4 shadow-2xs print:shadow-none space-y-3 print:break-inside-avoid">
              <h3 className="font-bold text-sm text-[#1A1A1A]">
                Rincian Arus Pendapatan & Beban Pokok (HPP)
              </h3>
              <div className="divide-y divide-[#E5E5E0] text-xs">
                <div className="flex justify-between py-2.5">
                  <span className="text-[#6B7280]">Total Penjualan Kotor (Gross Sales)</span>
                  <span className="font-bold text-[#1A1A1A]">
                    {formatRupiah(report?.totalRevenue || 0)}
                  </span>
                </div>
                <div className="flex justify-between py-2.5">
                  <span className="text-[#6B7280]">Total Beban Pokok Penjualan (HPP Modal Barang)</span>
                  <span className="font-bold text-[#D64545]">
                    - {formatRupiah(report?.totalCost || 0)}
                  </span>
                </div>
                <div className="flex justify-between py-2.5 bg-[#FAFBF9] px-2 rounded-lg font-black text-sm">
                  <span className="text-[#1A1A1A]">Estimasi Laba Bersih Kotor (Gross Margin)</span>
                  <span className="text-[#6FA084]">
                    {formatRupiah(report?.netProfit || 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN (35% -> 4 cols on 12-grid) */}
          <div className="lg:col-span-4 print:col-span-4 space-y-5 print:space-y-4">
            {/* Best Sellers Card */}
            <div className="bg-white border border-[#E5E5E0] rounded-xl p-5 print:p-4 shadow-2xs print:shadow-none space-y-4 print:break-inside-avoid">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#FAFBF9] border border-[#E5E5E0] flex items-center justify-center text-[#E8A838]">
                  <Trophy className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#1A1A1A]">
                    Produk Terlaris
                  </h3>
                  <p className="text-[10px] text-[#6B7280]">
                    Peringkat produk berdasarkan unit terjual
                  </p>
                </div>
              </div>

              {loading ? (
                <div className="h-48 flex items-center justify-center text-xs text-[#6B7280]">
                  <RefreshCw className="w-5 h-5 animate-spin text-[#6FA084]" />
                </div>
              ) : (
                <BestSellersList products={report?.bestSellers || []} />
              )}
            </div>

            {/* Category Breakdown Card */}
            <div className="bg-white border border-[#E5E5E0] rounded-xl p-5 print:p-4 shadow-2xs print:shadow-none space-y-4 print:break-inside-avoid">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#FAFBF9] border border-[#E5E5E0] flex items-center justify-center text-[#6FA084]">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#1A1A1A]">
                    Pendapatan per Kategori
                  </h3>
                  <p className="text-[10px] text-[#6B7280]">
                    Proporsi perolehan omzet tiap kategori
                  </p>
                </div>
              </div>

              {loading ? (
                <div className="h-40 flex items-center justify-center text-xs text-[#6B7280]">
                  <RefreshCw className="w-5 h-5 animate-spin text-[#6FA084]" />
                </div>
              ) : (
                <CategoryBreakdown categories={report?.categoryBreakdown || []} />
              )}
            </div>
          </div>
        </div>

        {/* OFFICIAL PRINT FOOTER (Paper only) */}
        <div className="hidden print:flex items-center justify-between border-t border-[#E5E5E0] pt-4 mt-6 text-[10px] text-[#6B7280]">
          <div>
            <p className="font-semibold text-[#1A1A1A]">TokoKu Cloud POS & Inventory</p>
            <p>Dokumen rekapan transaksi & analitik laba rugi resmi.</p>
          </div>
          <div className="text-right">
            <p className="italic">Status: Terverifikasi oleh Sistem TokoKu</p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
