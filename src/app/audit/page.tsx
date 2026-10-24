"use client";

import * as React from "react";
import { AppShell } from "@/components/layout/AppShell";
import {
  ShieldCheck,
  ShieldAlert,
  Search,
  RefreshCw,
  Download,
  Calendar,
  Filter,
  Eye,
  Layers,
  ArrowUpDown,
  Tag,
  Package,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Clock,
  UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatRupiah, cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";
import {
  auditService,
  AuditStats,
  AuditLogFilterOptions,
} from "@/services/auditService";
import { AuditLog } from "@/types/database";
import { AuditDetailModal } from "@/components/audit/AuditDetailModal";

const ACTION_OPTIONS = [
  { value: "Semua", label: "Semua Aksi Audit" },
  { value: "HARGA_DIUBAH", label: "Harga Diubah (Price Changes)" },
  { value: "STOK_DISESUAIKAN", label: "Stok Disesuaikan (Stock Delta)" },
  { value: "PRODUK_DIBUAT", label: "Produk Dibuat" },
  { value: "PRODUK_DIUBAH", label: "Produk Diubah" },
  { value: "PRODUK_DIHAPUS", label: "Produk Dihapus" },
  { value: "TRANSAKSI_DIBUAT", label: "Transaksi Kasir Selesai" },
  { value: "TRANSAKSI_DIBATALKAN", label: "Transaksi Dibatalkan (Void)" },
  { value: "LOGIN_SUKSES", label: "Login Berhasil" },
  { value: "LOGIN_GAGAL", label: "Login Gagal (Brute-Force Alert)" },
  { value: "LOGOUT", label: "Logout" },
  { value: "TAMPERING_DETECTED", label: "Tampering / Manipulasi Sesi" },
  { value: "TERMINAL_DIKUNCI", label: "Terminal Kasir Terkunci" },
  { value: "TERMINAL_DIBUKA", label: "Terminal Kasir Dibuka" },
  { value: "SUPERVISOR_OVERRIDE_APPROVED", label: "Otorisasi Supervisor Disetujui" },
  { value: "SUPERVISOR_OVERRIDE_REJECTED", label: "Otorisasi Supervisor Ditolak" },
];

const ENTITY_OPTIONS = [
  { value: "Semua", label: "Semua Entitas" },
  { value: "products", label: "Produk / Inventaris" },
  { value: "transactions", label: "Transaksi POS" },
  { value: "auth", label: "Autentikasi & Sesi" },
  { value: "system", label: "Sistem / Trigger" },
];

export default function AuditPage() {
  const { currentUser } = useAuthStore();
  const [loading, setLoading] = React.useState(true);
  const [logs, setLogs] = React.useState<AuditLog[]>([]);
  const [totalCount, setTotalCount] = React.useState(0);
  const [stats, setStats] = React.useState<AuditStats>({
    totalLogs: 0,
    priceChangesCount: 0,
    stockAdjustmentsCount: 0,
    cancelledTransactionsCount: 0,
    securityAlertsCount: 0,
  });

  // Filter States
  const [search, setSearch] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  const [selectedAction, setSelectedAction] = React.useState("Semua");
  const [selectedEntity, setSelectedEntity] = React.useState("Semua");
  const [startDate, setStartDate] = React.useState("");
  const [endDate, setEndDate] = React.useState("");
  const [page, setPage] = React.useState(1);
  const limit = 20;

  // Selected Log for Inspector Modal
  const [selectedLog, setSelectedLog] = React.useState<AuditLog | null>(null);
  const [isDetailOpen, setIsDetailOpen] = React.useState(false);
  const [exporting, setExporting] = React.useState(false);

  // Debounce search input for performance & PostgREST query efficiency
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  // Load audit statistics
  const loadStats = React.useCallback(async () => {
    try {
      const result = await auditService.getAuditStats();
      setStats(result);
    } catch (err) {
      console.warn("Failed to load audit stats:", err);
    }
  }, []);

  // Load audit logs based on active filters
  const loadLogs = React.useCallback(async () => {
    setLoading(true);
    try {
      const options: AuditLogFilterOptions = {
        action: selectedAction,
        entity: selectedEntity,
        search: debouncedSearch,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        limit,
        offset: (page - 1) * limit,
      };

      const { logs: fetchedLogs, totalCount: count } =
        await auditService.getAuditLogs(options);
      setLogs(fetchedLogs);
      setTotalCount(count);
    } catch (err) {
      console.error("Error loading audit logs:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedAction, selectedEntity, debouncedSearch, startDate, endDate, page]);

  // Initial and reactive fetch
  React.useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  React.useEffect(() => {
    loadStats();
  }, [loadStats]);

  // Reset filters
  const handleResetFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setSelectedAction("Semua");
    setSelectedEntity("Semua");
    setStartDate("");
    setEndDate("");
    setPage(1);
  };

  // Export all current logs to CSV
  const handleExportCsv = async () => {
    setExporting(true);
    try {
      // Fetch up to 1000 matching logs for complete export
      const { logs: exportData } = await auditService.getAuditLogs({
        action: selectedAction,
        entity: selectedEntity,
        search: debouncedSearch,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        limit: 1000,
        offset: 0,
      });

      const csvString = auditService.exportLogsToCsv(exportData);
      const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      link.setAttribute("href", url);
      link.setAttribute("download", `audit-trail-tokoku-${timestamp}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Failed to export audit logs:", err);
    } finally {
      setExporting(false);
    }
  };

  const openLogDetail = (log: AuditLog) => {
    setSelectedLog(log);
    setIsDetailOpen(true);
  };

  // Badge helper
  const renderActionBadge = (action: string) => {
    switch (action) {
      case "TAMPERING_DETECTED":
      case "LOGIN_GAGAL":
      case "RATE_LIMIT_EXCEEDED":
      case "PRODUK_DIHAPUS":
      case "SUPERVISOR_OVERRIDE_REJECTED":
        return <Badge variant="danger">{action}</Badge>;
      case "HARGA_DIUBAH":
      case "TRANSAKSI_DIBATALKAN":
        return <Badge variant="warning">{action}</Badge>;
      case "SUPERVISOR_OVERRIDE_APPROVED":
        return (
          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-[#E8F5E9] text-[#2E7D32] border border-[#C8E6C9]">
            OVERRIDE DISETUJUI
          </span>
        );
      case "STOK_DISESUAIKAN":
      case "PRODUK_DIUBAH":
        return (
          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-[#EBF5FB] text-[#2980B9] border border-[#AED6F1]">
            {action}
          </span>
        );
      case "LOGIN_SUKSES":
      case "TRANSAKSI_DIBUAT":
      case "PRODUK_DIBUAT":
      case "TERMINAL_DIBUKA":
        return <Badge variant="success">{action}</Badge>;
      default:
        return <Badge variant="outline">{action}</Badge>;
    }
  };

  // Inline diff preview generator
  const renderInlineDiff = (log: AuditLog) => {
    if (log.action === "SUPERVISOR_OVERRIDE_APPROVED") {
      return (
        <span className="text-xs text-[#2E7D32] font-semibold">
          {log.new_values?.actionName || "Aksi diotorisasi"}: {log.new_values?.reason || "Disetujui"}
        </span>
      );
    }

    if (log.action === "SUPERVISOR_OVERRIDE_REJECTED") {
      return (
        <span className="text-xs text-[#C62828] font-semibold">
          {log.new_values?.actionName || "Aksi ditolak"}: {log.new_values?.reason || "PIN Salah"}
        </span>
      );
    }

    if (log.action === "HARGA_DIUBAH" && log.old_values && log.new_values) {
      const oldPrice = log.old_values.sell_price;
      const newPrice = log.new_values.sell_price;
      return (
        <span className="text-xs">
          Harga Jual: <span className="line-through text-gray-400">{formatRupiah(oldPrice)}</span>{" "}
          <span className="font-semibold text-[#2C2C2C]">➔ {formatRupiah(newPrice)}</span>
        </span>
      );
    }

    if (log.action === "STOK_DISESUAIKAN" && log.old_values && log.new_values) {
      const oldStock = log.old_values.current_stock ?? log.old_values.stock;
      const newStock = log.new_values.current_stock ?? log.new_values.stock;
      return (
        <span className="text-xs">
          Stok: <span className="line-through text-gray-400">{oldStock}</span>{" "}
          <span className="font-semibold text-[#2C2C2C]">➔ {newStock}</span>
        </span>
      );
    }

    if (log.action === "TRANSAKSI_DIBATALKAN") {
      return (
        <span className="text-xs text-[#D64545] font-medium">
          Pembatalan transaksi oleh staf
        </span>
      );
    }

    if (log.action === "LOGIN_SUKSES") {
      return (
        <span className="text-xs text-gray-500">
          Sesi aktif: {log.user?.username || log.new_values?.username || "pengguna"}
        </span>
      );
    }

    if (log.action === "TAMPERING_DETECTED") {
      return (
        <span className="text-xs text-[#D64545] font-semibold">
          Integritas sesi lokal gagal diverifikasi!
        </span>
      );
    }

    if (log.new_values?.name) {
      return <span className="text-xs text-gray-600 truncate">{log.new_values.name}</span>;
    }

    return <span className="text-xs text-gray-400 italic">Lihat detail perubahan</span>;
  };

  const totalPages = Math.ceil(totalCount / limit) || 1;

  return (
    <AppShell title="Audit Keamanan & Forensik">
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Top Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-[#E0E0DC]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl font-bold text-[#2C2C2C]">
                Security Audit Trail & Anomaly Inspector
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#E8F5EE] text-[#2E7D56] border border-[#CDE8D8]">
                <CheckCircle2 className="w-3 h-3 text-[#2E7D56]" />
                Append-Only Verified
              </span>
            </div>
            <p className="text-xs text-gray-500">
              Rekam jejak forensik seluruh mutasi data, otorisasi staf kasir, dan deteksi anomali sistem yang immutable.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCsv}
              disabled={exporting || logs.length === 0}
              className="flex items-center gap-1.5 border-[#E0E0DC] text-[#2C2C2C] hover:bg-[#F4F4F0]"
            >
              <Download className="w-4 h-4 text-[#6FA084]" />
              <span>{exporting ? "Mengekspor..." : "Ekspor CSV"}</span>
            </Button>

            <Button
              size="sm"
              onClick={() => {
                loadLogs();
                loadStats();
              }}
              disabled={loading}
              className="flex items-center gap-1.5 bg-[#6FA084] hover:bg-[#5B8870] text-white"
            >
              <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
              <span>Segarkan</span>
            </Button>
          </div>
        </div>

        {/* 5 KPI Security Overview Cards (Solid Colors, Zero Gradients) */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
          {/* Total Logs */}
          <div className="bg-white p-4 rounded-xl border border-[#E0E0DC] space-y-2">
            <div className="flex items-center justify-between text-gray-500">
              <span className="text-xs font-medium">Total Rekam Audit</span>
              <ShieldCheck className="w-4 h-4 text-[#6FA084]" />
            </div>
            <div className="text-2xl font-bold text-[#2C2C2C]">
              {stats.totalLogs.toLocaleString("id-ID")}
            </div>
            <div className="text-[11px] text-gray-400">Tersimpan di PostgreSQL</div>
          </div>

          {/* Price Changes */}
          <div className="bg-white p-4 rounded-xl border border-[#F5D8A5] space-y-2">
            <div className="flex items-center justify-between text-[#C47D15]">
              <span className="text-xs font-medium">Perubahan Harga</span>
              <Tag className="w-4 h-4 text-[#C47D15]" />
            </div>
            <div className="text-2xl font-bold text-[#C47D15]">
              {stats.priceChangesCount}
            </div>
            <div className="text-[11px] text-[#C47D15]/80">Audit fluktuasi harga</div>
          </div>

          {/* Stock Adjustments */}
          <div className="bg-white p-4 rounded-xl border border-[#AED6F1] space-y-2">
            <div className="flex items-center justify-between text-[#2980B9]">
              <span className="text-xs font-medium">Penyesuaian Stok</span>
              <Package className="w-4 h-4 text-[#2980B9]" />
            </div>
            <div className="text-2xl font-bold text-[#2980B9]">
              {stats.stockAdjustmentsCount}
            </div>
            <div className="text-[11px] text-[#2980B9]/80">Koreksi delta stok</div>
          </div>

          {/* Cancelled Transactions */}
          <div className="bg-white p-4 rounded-xl border border-[#F8BEBE] space-y-2">
            <div className="flex items-center justify-between text-[#D64545]">
              <span className="text-xs font-medium">Transaksi Batal (Void)</span>
              <AlertTriangle className="w-4 h-4 text-[#D64545]" />
            </div>
            <div className="text-2xl font-bold text-[#D64545]">
              {stats.cancelledTransactionsCount}
            </div>
            <div className="text-[11px] text-[#D64545]/80">Pembatalan struk kasir</div>
          </div>

          {/* Security Alerts */}
          <div
            className={cn(
              "p-4 rounded-xl border space-y-2 col-span-2 sm:col-span-1",
              stats.securityAlertsCount > 0
                ? "bg-[#FFF5F5] border-[#F8BEBE]"
                : "bg-white border-[#E0E0DC]"
            )}
          >
            <div className="flex items-center justify-between text-[#D64545]">
              <span className="text-xs font-semibold">Alarm Keamanan</span>
              <ShieldAlert className="w-4 h-4 text-[#D64545]" />
            </div>
            <div className="text-2xl font-bold text-[#D64545]">
              {stats.securityAlertsCount}
            </div>
            <div className="text-[11px] text-gray-500">
              {stats.securityAlertsCount === 0
                ? "Kondisi sistem normal"
                : "Percobaan brute-force / tamper"}
            </div>
          </div>
        </div>

        {/* Filter and Query Controls Bar */}
        <div className="bg-white p-4 rounded-xl border border-[#E0E0DC] space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Search Input */}
            <div className="relative lg:col-span-2">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Cari aksi, entitas, ID log..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-[#E0E0DC] rounded-lg focus:outline-none focus:border-[#6FA084]"
              />
            </div>

            {/* Filter Action */}
            <div>
              <select
                value={selectedAction}
                onChange={(e) => {
                  setSelectedAction(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 text-sm bg-white border border-[#E0E0DC] rounded-lg focus:outline-none focus:border-[#6FA084] text-[#2C2C2C]"
              >
                {ACTION_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter Entity */}
            <div>
              <select
                value={selectedEntity}
                onChange={(e) => {
                  setSelectedEntity(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 text-sm bg-white border border-[#E0E0DC] rounded-lg focus:outline-none focus:border-[#6FA084] text-[#2C2C2C]"
              >
                {ENTITY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Reset Filter Button */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetFilters}
                className="w-full text-xs text-gray-600 border-[#E0E0DC] hover:bg-[#F4F4F0] flex items-center justify-center gap-1.5 h-9"
              >
                <RotateCcw className="w-3.5 h-3.5 text-gray-400" />
                <span>Reset Filter</span>
              </Button>
            </div>
          </div>

          {/* Secondary Date Range Filter */}
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-[#F0F0EC] text-xs text-gray-500">
            <span className="font-medium text-[#2C2C2C] flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-[#6FA084]" />
              Rentang Tanggal:
            </span>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPage(1);
                }}
                className="px-2.5 py-1 text-xs border border-[#E0E0DC] rounded bg-white focus:outline-none focus:border-[#6FA084]"
              />
              <span>s/d</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPage(1);
                }}
                className="px-2.5 py-1 text-xs border border-[#E0E0DC] rounded bg-white focus:outline-none focus:border-[#6FA084]"
              />
            </div>
            {(startDate || endDate) && (
              <button
                onClick={() => {
                  setStartDate("");
                  setEndDate("");
                }}
                className="text-xs text-[#D64545] hover:underline"
              >
                Hapus tanggal
              </button>
            )}
          </div>
        </div>

        {/* Audit Log Table Section */}
        <div className="bg-white rounded-xl border border-[#E0E0DC] overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-gray-400 space-y-3">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#6FA084]" />
              <div className="text-sm">Memuat rekam jejak audit keamanan...</div>
            </div>
          ) : logs.length === 0 ? (
            <div className="p-12 text-center text-gray-400 space-y-2">
              <ShieldCheck className="w-10 h-10 mx-auto text-gray-300" />
              <div className="text-base font-semibold text-gray-600">
                Tidak ada rekam jejak audit yang cocok
              </div>
              <p className="text-xs text-gray-400">
                Coba sesuaikan kata kunci pencarian atau reset filter di atas.
              </p>
            </div>
          ) : (
            <>
              {/* Desktop View Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-[#FAF9F5] border-b border-[#E0E0DC] text-xs font-semibold text-gray-600">
                      <th className="py-3 px-4">Waktu (WIB)</th>
                      <th className="py-3 px-4">Aksi Audit</th>
                      <th className="py-3 px-4">Entitas</th>
                      <th className="py-3 px-4">Operator</th>
                      <th className="py-3 px-4">Ringkasan Perubahan</th>
                      <th className="py-3 px-4 text-center">Tindakan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0F0EC]">
                    {logs.map((log) => {
                      const timeStr = new Date(log.created_at).toLocaleString(
                        "id-ID",
                        {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        }
                      );

                      return (
                        <tr
                          key={log.id}
                          className="hover:bg-[#FDFDFB] transition-colors"
                        >
                          {/* Timestamp */}
                          <td className="py-3 px-4 text-xs font-mono text-gray-600 whitespace-nowrap">
                            {timeStr}
                          </td>

                          {/* Action Badge */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            {renderActionBadge(log.action)}
                          </td>

                          {/* Entity */}
                          <td className="py-3 px-4 text-xs font-medium text-[#2C2C2C] capitalize whitespace-nowrap">
                            <span className="bg-[#F4F4F0] px-2 py-0.5 rounded text-gray-700">
                              {log.entity}
                            </span>
                          </td>

                          {/* Operator / User */}
                          <td className="py-3 px-4 text-xs text-gray-700 whitespace-nowrap">
                            <div className="font-medium text-[#2C2C2C]">
                              {log.user?.full_name ||
                                log.user?.username ||
                                "Sistem / Otomatis"}
                            </div>
                            <div className="text-[10px] text-gray-400 uppercase">
                              {log.user?.role || "Service"}
                            </div>
                          </td>

                          {/* Diff Preview */}
                          <td className="py-3 px-4 max-w-xs truncate">
                            {renderInlineDiff(log)}
                          </td>

                          {/* Action Button */}
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openLogDetail(log)}
                              className="h-7 text-xs border-[#E0E0DC] text-[#2C2C2C] hover:bg-[#F4F4F0] flex items-center gap-1 mx-auto"
                            >
                              <Eye className="w-3.5 h-3.5 text-[#6FA084]" />
                              <span>Detail</span>
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-t border-[#E0E0DC] gap-3 text-xs text-gray-500">
                <div>
                  Menampilkan <span className="font-semibold text-[#2C2C2C]">{logs.length}</span> dari{" "}
                  <span className="font-semibold text-[#2C2C2C]">{totalCount}</span> total catatan audit
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="h-8 text-xs border-[#E0E0DC]"
                  >
                    Sebelumnya
                  </Button>
                  <span className="px-2 text-xs font-medium text-[#2C2C2C]">
                    Halaman {page} dari {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="h-8 text-xs border-[#E0E0DC]"
                  >
                    Selanjutnya
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Forensic Modal Inspector */}
        <AuditDetailModal
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          log={selectedLog}
        />
      </div>
    </AppShell>
  );
}
