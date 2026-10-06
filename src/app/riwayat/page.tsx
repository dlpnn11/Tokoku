"use client";

import * as React from "react";
import { AppShell } from "@/components/layout/AppShell";
import {
  History,
  Calendar,
  Search,
  Eye,
  Printer,
  RotateCcw,
  Receipt,
  CheckCircle2,
  XCircle,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CustomSelect } from "@/components/ui/select";
import { formatRupiah, cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";
import {
  transactionService,
  TransactionWithDetails,
} from "@/services/transactionService";
import { TransactionDetailModal } from "@/components/history/TransactionDetailModal";

const ITEMS_PER_PAGE = 10;

export default function RiwayatPage() {
  const { currentUser } = useAuthStore();
  const isOwner = currentUser.role === "pemilik";

  // Data states
  const [transactions, setTransactions] = React.useState<TransactionWithDetails[]>([]);
  const [totalCount, setTotalCount] = React.useState(0);
  const [loading, setLoading] = React.useState(true);

  // Summary Metrics
  const [metrics, setMetrics] = React.useState({
    totalCompleted: 0,
    totalRevenue: 0,
    totalCancelled: 0,
    todayCount: 0,
  });

  // Filter & Search states
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("Semua");
  const [methodFilter, setMethodFilter] = React.useState("Semua");
  const [startDate, setStartDate] = React.useState("");
  const [endDate, setEndDate] = React.useState("");
  const [currentPage, setCurrentPage] = React.useState(1);

  // Modal states
  const [selectedTransaction, setSelectedTransaction] =
    React.useState<TransactionWithDetails | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = React.useState(false);

  // Load transactions
  const loadTransactions = React.useCallback(async () => {
    setLoading(true);
    try {
      const offset = (currentPage - 1) * ITEMS_PER_PAGE;
      const res = await transactionService.getTransactions({
        search,
        status: statusFilter,
        paymentMethod: methodFilter,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        limit: ITEMS_PER_PAGE,
        offset,
      });

      setTransactions(res.transactions);
      setTotalCount(res.totalCount);

      // Compute general summary metrics across all records
      const allTxRes = await transactionService.getTransactions({ limit: 500 });
      const allTx = allTxRes.transactions;
      const todayStr = new Date().toISOString().slice(0, 10);

      let rev = 0;
      let comp = 0;
      let canc = 0;
      let today = 0;

      allTx.forEach((tx) => {
        if (tx.status === "Selesai") {
          comp += 1;
          rev += Number(tx.total_amount);
        } else if (tx.status === "Dibatalkan") {
          canc += 1;
        }

        if (tx.created_at.startsWith(todayStr)) {
          today += 1;
        }
      });

      setMetrics({
        totalCompleted: comp,
        totalRevenue: rev,
        totalCancelled: canc,
        todayCount: today,
      });
    } catch (err) {
      console.error("Gagal memuat riwayat transaksi:", err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, search, statusFilter, methodFilter, startDate, endDate]);

  React.useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const handleResetFilter = () => {
    setSearch("");
    setStatusFilter("Semua");
    setMethodFilter("Semua");
    setStartDate("");
    setEndDate("");
    setCurrentPage(1);
  };

  const handleViewDetail = (tx: TransactionWithDetails) => {
    setSelectedTransaction(tx);
    setIsDetailModalOpen(true);
  };

  const handleCancelTransaction = async (id: string) => {
    await transactionService.cancelTransaction(id);
    await loadTransactions();
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE) || 1;

  return (
    <AppShell title="RIWAYAT TRANSAKSI">
      <div className="space-y-5">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-[#1A1A1A]">
              Riwayat Transaksi
            </h1>
            <p className="text-xs text-[#6B7280]">
              Daftar faktur nota penjualan kasir, cetak ulang struk, dan pembatalan transaksi.
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={loadTransactions}
            className="gap-2 self-start sm:self-auto text-xs"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
            Perbarui Data
          </Button>
        </div>

        {/* SUMMARY CHIPS / STAT CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-white border border-[#E5E5E0] rounded-xl p-4 flex items-center justify-between shadow-2xs">
            <div className="space-y-0.5">
              <span className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider block">
                Transaksi Hari Ini
              </span>
              <p className="text-xl font-black text-[#1A1A1A]">
                {metrics.todayCount}{" "}
                <span className="text-xs font-normal text-[#6B7280]">nota</span>
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#FAFBF9] border border-[#E5E5E0] flex items-center justify-center text-[#6FA084]">
              <Receipt className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white border border-[#E5E5E0] rounded-xl p-4 flex items-center justify-between shadow-2xs">
            <div className="space-y-0.5">
              <span className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider block">
                Total Omzet Penjualan
              </span>
              <p className="text-xl font-black text-[#6FA084]">
                {formatRupiah(metrics.totalRevenue)}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#F4F8F5] border border-[#D5E5DC] flex items-center justify-center text-[#6FA084]">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white border border-[#E5E5E0] rounded-xl p-4 flex items-center justify-between shadow-2xs">
            <div className="space-y-0.5">
              <span className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider block">
                Transaksi Dibatalkan
              </span>
              <p className="text-xl font-black text-[#D64545]">
                {metrics.totalCancelled}{" "}
                <span className="text-xs font-normal text-[#6B7280]">nota</span>
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#FFF0F0] border border-[#F8BEBE] flex items-center justify-center text-[#D64545]">
              <XCircle className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* FILTER & SEARCH CARD */}
        <div className="bg-white border border-[#E5E5E0] rounded-xl p-4 shadow-2xs space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-[#1A1A1A]">
            <Filter className="w-4 h-4 text-[#6FA084]" />
            <span>Filter & Pencarian Nota</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9E9E9E]" />
              <Input
                placeholder="Cari No. Faktur / HP..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-9 text-xs h-10"
              />
            </div>

            {/* Date Start */}
            <div>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="text-xs h-10"
                title="Dari Tanggal"
              />
            </div>

            {/* Date End */}
            <div>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="text-xs h-10"
                title="Sampai Tanggal"
              />
            </div>

            {/* Status Dropdown */}
            <div>
              <CustomSelect
                value={statusFilter}
                onChange={(val) => {
                  setStatusFilter(val);
                  setCurrentPage(1);
                }}
                placeholder="Semua Status"
                options={[
                  { value: "Semua", label: "Semua Status" },
                  { value: "Selesai", label: "Selesai" },
                  { value: "Dibatalkan", label: "Dibatalkan" },
                ]}
              />
            </div>

            {/* Payment Method Dropdown */}
            <div>
              <CustomSelect
                value={methodFilter}
                onChange={(val) => {
                  setMethodFilter(val);
                  setCurrentPage(1);
                }}
                placeholder="Semua Metode"
                options={[
                  { value: "Semua", label: "Semua Metode" },
                  { value: "Tunai", label: "Tunai" },
                  { value: "QRIS", label: "QRIS" },
                ]}
              />
            </div>
          </div>

          {(search || statusFilter !== "Semua" || methodFilter !== "Semua" || startDate || endDate) && (
            <div className="flex justify-end pt-1">
              <button
                onClick={handleResetFilter}
                className="text-xs text-[#D64545] hover:underline font-bold"
              >
                Reset Semua Filter
              </button>
            </div>
          )}
        </div>

        {/* TRANSACTION TABLE CARD */}
        <div className="bg-white border border-[#E5E5E0] rounded-xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#FAFBF9] border-b border-[#E5E5E0] text-[11px] font-bold text-[#6B7280] uppercase tracking-wider h-11">
                  <th className="py-3 px-4">No. Faktur</th>
                  <th className="py-3 px-4">Tanggal & Waktu</th>
                  <th className="py-3 px-4">Kasir</th>
                  <th className="py-3 px-4 text-center">Jml Item</th>
                  <th className="py-3 px-4 text-right">Total</th>
                  <th className="py-3 px-4 text-center">Metode</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E5E0]">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-[#6B7280]">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#6FA084]" />
                      Memuat daftar riwayat faktur...
                    </td>
                  </tr>
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-16 text-center text-[#6B7280]">
                      <History className="w-10 h-10 text-[#D0D0CB] mx-auto mb-2" />
                      <p className="font-bold text-sm text-[#1A1A1A]">
                        Tidak ada transaksi ditemukan
                      </p>
                      <p className="text-xs text-[#9E9E9E] mt-1">
                        Coba sesuaikan kata kunci pencarian atau ubah rentang filter tanggal.
                      </p>
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx) => {
                    const totalItems = (tx.details || []).reduce(
                      (acc, d) => acc + d.quantity,
                      0
                    );
                    const formattedDate = new Date(tx.created_at).toLocaleString("id-ID", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    });

                    return (
                      <tr
                        key={tx.id}
                        className="hover:bg-[#F9F9F7] transition-colors h-14"
                      >
                        <td className="py-3 px-4 font-mono font-bold text-[#1A1A1A]">
                          {tx.invoice_number}
                        </td>
                        <td className="py-3 px-4 text-[#6B7280] whitespace-nowrap">
                          {formattedDate}
                        </td>
                        <td className="py-3 px-4 font-medium text-[#1A1A1A]">
                          {tx.user?.full_name || "Kasir Toko"}
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-[#1A1A1A]">
                          {totalItems}
                        </td>
                        <td className="py-3 px-4 text-right font-black text-[#1A1A1A] whitespace-nowrap">
                          {formatRupiah(Number(tx.total_amount))}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={cn(
                              "px-2.5 py-1 rounded-full text-[10px] font-black inline-block",
                              tx.payment_method === "Tunai"
                                ? "bg-[#EAF3EC] text-[#6FA084]"
                                : "bg-[#E8F0FF] text-[#3B82F6]"
                            )}
                          >
                            {tx.payment_method}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={cn(
                              "px-2.5 py-1 rounded-full text-[10px] font-black inline-block",
                              tx.status === "Selesai"
                                ? "bg-[#EAF3EC] text-[#6FA084]"
                                : "bg-[#FFF0F0] text-[#D64545]"
                            )}
                          >
                            {tx.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleViewDetail(tx)}
                              className="p-1.5 rounded-lg border border-[#E5E5E0] bg-[#FAFBF9] hover:bg-[#F4F8F5] hover:border-[#6FA084] text-[#1A1A1A] transition-colors"
                              title="Lihat Detail Nota"
                            >
                              <Eye className="w-3.5 h-3.5 text-[#6B7280]" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedTransaction(tx);
                                setIsDetailModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg border border-[#E5E5E0] bg-[#FAFBF9] hover:bg-[#F4F8F5] hover:border-[#6FA084] text-[#6FA084] transition-colors"
                              title="Cetak Struk Thermal"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* TABLE PAGINATION */}
          <div className="p-4 border-t border-[#E5E5E0] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#6B7280]">
            <div>
              Menampilkan{" "}
              <strong className="text-[#1A1A1A]">
                {transactions.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1}
              </strong>{" "}
              –{" "}
              <strong className="text-[#1A1A1A]">
                {Math.min(currentPage * ITEMS_PER_PAGE, totalCount)}
              </strong>{" "}
              dari <strong className="text-[#1A1A1A]">{totalCount}</strong> transaksi
            </div>

            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage <= 1 || loading}
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                className="h-8 px-2.5 text-xs"
              >
                <ChevronLeft className="w-3.5 h-3.5 mr-1" />
                Sebelumnya
              </Button>

              <div className="px-3 py-1 bg-[#6FA084] text-white font-bold rounded-lg text-xs">
                {currentPage} / {totalPages}
              </div>

              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages || loading}
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                className="h-8 px-2.5 text-xs"
              >
                Selanjutnya
                <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* TRANSACTION DETAIL & RECEIPT MODAL */}
      <TransactionDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        transaction={selectedTransaction}
        isOwner={isOwner}
        onCancelTransaction={handleCancelTransaction}
      />
    </AppShell>
  );
}
