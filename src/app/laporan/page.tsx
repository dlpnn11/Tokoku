"use client";

import * as React from "react";
import { AppShell } from "@/components/layout/AppShell";
import {
  TrendingUp,
  Wallet,
  Receipt,
  Package,
  FileSpreadsheet,
  Printer,
  Calendar,
  RefreshCw,
  Trophy,
  Layers,
  ArrowUpRight,
  ShieldAlert,
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
  const [report, setReport] = React.useState<FinancialReportSummary | null>(null);
  const [monthlyHistory, setMonthlyHistory] = React.useState<any[]>([]);

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
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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

        {/* PERIOD FILTER BAR & EXPORT ACTIONS */}
        <div className="bg-white border border-[#E5E5E0] rounded-xl p-4 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
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

          {/* Export Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCsv}
              className="gap-1.5 text-xs border-[#6FA084] text-[#6FA084] hover:bg-[#F4F8F5] font-bold h-9"
              title="Unduh format spreadsheet untuk Microsoft Excel"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Ekspor Excel (.csv)
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="gap-1.5 text-xs font-bold h-9 border-[#E5E5E0]"
            >
              <Printer className="w-4 h-4" />
              Cetak
            </Button>
          </div>
        </div>

        {/* 4 FINANCIAL KPI CARDS ROW */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Pendapatan / Omzet */}
          <div className="bg-white border border-[#E5E5E0] rounded-xl p-5 shadow-2xs space-y-2">
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
          <div className="bg-white border border-[#E5E5E0] rounded-xl p-5 shadow-2xs space-y-2">
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
          <div className="bg-white border border-[#E5E5E0] rounded-xl p-5 shadow-2xs space-y-2">
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
          <div className="bg-white border border-[#E5E5E0] rounded-xl p-5 shadow-2xs space-y-2">
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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* LEFT COLUMN (65% -> 8 cols on 12-grid) */}
          <div className="lg:col-span-8 space-y-5">
            {/* Chart Card: Grafik Pendapatan Harian */}
            <div className="bg-white border border-[#E5E5E0] rounded-xl p-5 shadow-2xs space-y-4">
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
            <div className="bg-white border border-[#E5E5E0] rounded-xl p-5 shadow-2xs space-y-4">
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
            <div className="bg-white border border-[#E5E5E0] rounded-xl p-5 shadow-2xs space-y-3">
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
          <div className="lg:col-span-4 space-y-5">
            {/* Best Sellers Card */}
            <div className="bg-white border border-[#E5E5E0] rounded-xl p-5 shadow-2xs space-y-4">
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
            <div className="bg-white border border-[#E5E5E0] rounded-xl p-5 shadow-2xs space-y-4">
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
      </div>
    </AppShell>
  );
}
