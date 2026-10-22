"use client";

import * as React from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AuditLog } from "@/types/database";
import { formatRupiah, cn } from "@/lib/utils";
import {
  ShieldCheck,
  ShieldAlert,
  Copy,
  Check,
  User,
  Clock,
  Layers,
  Globe,
  Monitor,
  ArrowRight,
  FileCode,
} from "lucide-react";

interface AuditDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  log: AuditLog | null;
}

export function AuditDetailModal({
  isOpen,
  onClose,
  log,
}: AuditDetailModalProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopyId = () => {
    if (!log?.id) return;
    navigator.clipboard.writeText(log.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!log) return null;

  // Determine Badge Styling based on action severity
  const getActionBadge = (action: string) => {
    switch (action) {
      case "TAMPERING_DETECTED":
      case "LOGIN_GAGAL":
      case "RATE_LIMIT_EXCEEDED":
      case "PRODUK_DIHAPUS":
        return <Badge variant="danger" className="text-xs">{action}</Badge>;
      case "HARGA_DIUBAH":
      case "TRANSAKSI_DIBATALKAN":
        return <Badge variant="warning" className="text-xs">{action}</Badge>;
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
        return <Badge variant="success" className="text-xs">{action}</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">{action}</Badge>;
    }
  };

  const formattedDate = new Date(log.created_at).toLocaleString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }) + " WIB";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Detail Rekam Jejak Audit Keamanan"
      description="Verifikasi forensik aktivitas mutasi data dan anomali keamanan sistem TokoKu."
      maxWidth="2xl"
    >
      <div className="space-y-5 text-sm">
        {/* Top Header Card */}
        <div className="bg-[#F4F4F0] p-4 rounded-lg border border-[#E0E0DC] space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase text-gray-500">
                Aksi:
              </span>
              {getActionBadge(log.action)}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <Clock className="w-3.5 h-3.5" />
              <span>{formattedDate}</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-[#E0E0DC] text-xs">
            <div className="flex items-center gap-2 text-gray-600 font-mono">
              <span className="text-gray-400">Log ID:</span>
              <span>{log.id}</span>
            </div>
            <button
              onClick={handleCopyId}
              type="button"
              className="flex items-center gap-1 text-[#6FA084] hover:text-[#5B8870] font-medium"
              title="Salin ID Log"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Tersalin</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Salin ID</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Metadata Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Operator / User Info */}
          <div className="p-3 bg-white rounded-lg border border-[#E0E0DC] space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase">
              <User className="w-3.5 h-3.5 text-[#6FA084]" />
              <span>Pelaksana / Operator</span>
            </div>
            <div className="text-sm font-medium text-[#2C2C2C]">
              {log.user?.full_name || log.user?.username || "Sistem / Otomatis"}
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>Peran:</span>
              <span className="capitalize font-semibold text-[#2C2C2C]">
                {log.user?.role || "System Service"}
              </span>
              {log.user_id && (
                <span className="font-mono text-[10px] text-gray-400">
                  ({log.user_id.slice(0, 8)}...)
                </span>
              )}
            </div>
          </div>

          {/* Entity Info */}
          <div className="p-3 bg-white rounded-lg border border-[#E0E0DC] space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase">
              <Layers className="w-3.5 h-3.5 text-[#6FA084]" />
              <span>Target Entitas</span>
            </div>
            <div className="text-sm font-medium text-[#2C2C2C] capitalize">
              {log.entity}
            </div>
            <div className="text-xs text-gray-500 font-mono truncate">
              ID Entitas: {log.entity_id || "-"}
            </div>
          </div>

          {/* Network IP */}
          <div className="p-3 bg-white rounded-lg border border-[#E0E0DC] space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase">
              <Globe className="w-3.5 h-3.5 text-[#6FA084]" />
              <span>Alamat IP Klien</span>
            </div>
            <div className="text-sm font-mono text-[#2C2C2C]">
              {log.ip_address || "127.0.0.1 (Local / Terminal)"}
            </div>
          </div>

          {/* User Agent / Device */}
          <div className="p-3 bg-white rounded-lg border border-[#E0E0DC] space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase">
              <Monitor className="w-3.5 h-3.5 text-[#6FA084]" />
              <span>Perangkat / Klien</span>
            </div>
            <div className="text-xs text-gray-600 line-clamp-2" title={log.user_agent || "-"}>
              {log.user_agent || "TokoKu Internal POS Client"}
            </div>
          </div>
        </div>

        {/* Diff Viewer (Old vs New Values) */}
        {(log.old_values || log.new_values) && (
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 uppercase">
              <FileCode className="w-4 h-4 text-[#6FA084]" />
              <span>Perbandingan Perubahan Nilai (Value Diff)</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Old Values */}
              <div className="bg-[#FAF8F8] p-3 rounded-lg border border-[#F0D5D5]">
                <div className="text-xs font-semibold text-[#D64545] mb-2 flex items-center justify-between">
                  <span>Sebelum Perubahan (Old)</span>
                  <span className="text-[10px] bg-[#FDEAEA] px-1.5 py-0.5 rounded">
                    LAMA
                  </span>
                </div>
                {log.old_values ? (
                  <pre className="text-xs font-mono text-gray-800 overflow-x-auto whitespace-pre-wrap max-h-48 bg-white p-2.5 rounded border border-[#E5E0E0]">
                    {JSON.stringify(log.old_values, null, 2)}
                  </pre>
                ) : (
                  <div className="text-xs text-gray-400 italic py-4 text-center">
                    (Tidak ada nilai sebelumnya / Rekam baru)
                  </div>
                )}
              </div>

              {/* New Values */}
              <div className="bg-[#F6FAF8] p-3 rounded-lg border border-[#D5EBE0]">
                <div className="text-xs font-semibold text-[#2E7D56] mb-2 flex items-center justify-between">
                  <span>Sesudah Perubahan (New)</span>
                  <span className="text-[10px] bg-[#E8F5EE] px-1.5 py-0.5 rounded">
                    BARU
                  </span>
                </div>
                {log.new_values ? (
                  <pre className="text-xs font-mono text-gray-800 overflow-x-auto whitespace-pre-wrap max-h-48 bg-white p-2.5 rounded border border-[#DDECE4]">
                    {JSON.stringify(log.new_values, null, 2)}
                  </pre>
                ) : (
                  <div className="text-xs text-gray-400 italic py-4 text-center">
                    (Data dihapus / Tidak ada nilai baru)
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Immutability & Non-Repudiation Guarantee Banner */}
        <div className="flex items-start gap-3 p-3.5 bg-[#FAF9F5] rounded-lg border border-[#E6E4DC] text-xs text-gray-600">
          <ShieldCheck className="w-5 h-5 text-[#6FA084] shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-semibold text-[#2C2C2C]">
              Jaminan Integritas & Kepatuhan Non-Repudiation
            </span>
            <p className="text-[11px] text-gray-500 leading-relaxed">
              Catatan ini tersimpan pada tabel PostgreSQL <code>audit_logs</code> yang bersifat <em>append-only</em>.
              Dilindungi oleh trigger basis data <code>trg_audit_logs_immutable</code> sehingga tidak dapat diubah (UPDATE)
              atau dihapus (DELETE) oleh kasir maupun akun siapa pun demi kepatuhan forensik.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex justify-end pt-2">
          <Button
            type="button"
            onClick={onClose}
            className="bg-[#2C2C2C] hover:bg-[#1A1A1A] text-white px-5"
          >
            Tutup
          </Button>
        </div>
      </div>
    </Modal>
  );
}
