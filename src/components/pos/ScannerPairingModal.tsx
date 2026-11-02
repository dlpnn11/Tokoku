"use client";

import * as React from "react";
import QRCode from "qrcode";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import {
  Smartphone,
  ExternalLink,
  Copy,
  Check,
  ShieldCheck,
  Camera,
  CheckCircle2,
} from "lucide-react";
import { useScannerStore } from "@/stores/scannerStore";

interface ScannerPairingModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId?: string;
}

export function ScannerPairingModal({
  isOpen,
  onClose,
}: ScannerPairingModalProps) {
  const { session, initSession } = useScannerStore();
  const [qrDataUrl, setQrDataUrl] = React.useState<string>("");
  const [scanUrl, setScanUrl] = React.useState<string>("");
  const [copied, setCopied] = React.useState(false);

  // Initialize active permanent session on modal open
  React.useEffect(() => {
    if (isOpen) {
      initSession();
    }
  }, [isOpen, initSession]);

  // Generate QR code when session changes
  React.useEffect(() => {
    if (typeof window !== "undefined" && isOpen && session) {
      const url = `${window.location.origin}/scan?room=${session.roomId}&token=${session.token}`;
      setScanUrl(url);

      QRCode.toDataURL(url, {
        width: 260,
        margin: 2,
        color: {
          dark: "#2C2C2C",
          light: "#FFFFFF",
        },
      })
        .then((dataUrl) => setQrDataUrl(dataUrl))
        .catch((err) => console.error("Error generating QR:", err));
    }
  }, [isOpen, session]);

  const handleCopy = () => {
    if (scanUrl) {
      navigator.clipboard.writeText(scanUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleLaunchCameraDirectly = () => {
    if (scanUrl) {
      window.location.href = scanUrl;
    } else {
      window.location.href = "/scan";
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Pemindai Barcode HP"
      description="Gunakan kamera ponsel untuk memindai barcode barang secara nirkabel langsung ke terminal kasir ini."
      maxWidth="md"
    >
      <div className="space-y-4 text-center">
        {/* Direct Camera Button (Sangat praktis saat TokoKu dibuka langsung di HP) */}
        <div className="p-3 bg-[#F4F8F5] border border-[#D5E5DC] rounded-2xl text-left space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-[#1A1A1A]">
            <Camera className="w-4 h-4 text-[#6FA084]" />
            <span>Buka Langsung di Perangkat Ini:</span>
          </div>
          <Button
            type="button"
            onClick={handleLaunchCameraDirectly}
            className="w-full h-11 bg-[#6FA084] hover:bg-[#58836B] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          >
            <Camera className="w-4 h-4" />
            <span>Nyalakan Kamera Pemindai Sekarang</span>
          </Button>
          <p className="text-[10px] text-[#6B7280]">
            Jika Anda sedang membuka kasir dari HP/tablet, klik tombol di atas untuk langsung beralih ke kamera pemindai tanpa perlu scan QR.
          </p>
        </div>

        {/* Divider OR QR Code */}
        <div className="flex items-center gap-3 my-2">
          <div className="h-[1px] bg-[#E5E5E0] flex-1" />
          <span className="text-[10px] font-bold text-[#9E9E9E] uppercase tracking-wider">
            Atau Pindai QR dari HP Lain
          </span>
          <div className="h-[1px] bg-[#E5E5E0] flex-1" />
        </div>

        {/* Status Badge: Aktif Permanen */}
        <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-[#FAFBF9] border border-[#E5E5E0] text-xs">
          <div className="flex items-center gap-1.5 font-semibold text-[#1A1A1A]">
            <ShieldCheck className="w-4 h-4 text-[#6FA084]" />
            <span>Sesi Nirkabel Kasir</span>
          </div>
          <div className="flex items-center gap-1 text-[11px]">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#6FA084]" />
            <span className="font-bold text-[#6FA084]">Aktif Permanen</span>
          </div>
        </div>

        {/* Real QR Code Container */}
        <div className="relative p-4 bg-white border border-[#E5E5E0] rounded-2xl inline-block mx-auto shadow-xs">
          {qrDataUrl ? (
            <div className="space-y-2">
              <img
                src={qrDataUrl}
                alt="QR Code Pairing Scanner"
                className="w-48 h-48 mx-auto rounded-xl"
              />
              <div className="flex items-center justify-center gap-2">
                <span className="text-[10px] font-semibold text-[#6FA084] font-mono bg-[#F4F8F5] px-2.5 py-0.5 rounded-full border border-[#D5E5DC]">
                  ROOM: {session?.roomId || "tokoku-main-pos"}
                </span>
                <span className="text-[10px] font-semibold text-[#6B7280] font-mono bg-[#F4F4F0] px-2 py-0.5 rounded-full border border-[#E5E5E0]">
                  Permanen
                </span>
              </div>
            </div>
          ) : (
            <div className="w-48 h-48 flex items-center justify-center text-xs text-[#6B7280]">
              Menyiapkan QR Code...
            </div>
          )}
        </div>

        {/* Pairing Instructions */}
        <div className="text-xs text-[#6B7280] space-y-1.5 max-w-sm mx-auto text-left bg-[#FAFBF9] border border-[#E5E5E0] rounded-xl p-3.5">
          <div className="flex items-start gap-2 text-[#1A1A1A] font-semibold text-xs">
            <Smartphone className="w-4 h-4 text-[#6FA084] shrink-0 mt-0.5" />
            <span>Petunjuk Penggunaan:</span>
          </div>
          <ol className="list-decimal list-inside space-y-1 pl-1 text-[11px] text-[#6B7280]">
            <li>Arahkan kamera HP ke QR Code di atas (cukup sekali scan untuk selamanya).</li>
            <li>Halaman kamera pemindai TokoKu akan terbuka otomatis di HP.</li>
            <li>Arahkan kamera HP ke barcode barang, produk seketika masuk ke keranjang kasir!</li>
          </ol>
        </div>

        {/* Direct URL copy field */}
        <div className="flex items-center gap-2 p-2 bg-[#F4F4F0] rounded-xl border border-[#E5E5E0]">
          <input
            type="text"
            readOnly
            value={scanUrl}
            className="bg-transparent text-xs text-[#1A1A1A] font-mono flex-1 outline-none px-2 select-all truncate"
            placeholder="Tautan scanner nirkabel"
          />
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="shrink-0 h-8 text-xs gap-1.5"
            onClick={handleCopy}
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-[#6FA084]" />
                Tersalin
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-[#6B7280]" />
                Salin Tautan
              </>
            )}
          </Button>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-between items-center pt-2 border-t border-[#E5E5E0]">
          <a
            href={scanUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-[#6FA084] hover:underline flex items-center gap-1 font-semibold"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Buka di Tab Baru
          </a>
          <Button size="sm" onClick={onClose}>
            Tutup
          </Button>
        </div>
      </div>
    </Modal>
  );
}
