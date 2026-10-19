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
  RefreshCw,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { useScannerStore } from "@/stores/scannerStore";
import { formatRemainingTime } from "@/lib/scannerSecurity";

interface ScannerPairingModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId?: string;
}

export function ScannerPairingModal({
  isOpen,
  onClose,
}: ScannerPairingModalProps) {
  const { session, initSession, refreshSession } = useScannerStore();
  const [qrDataUrl, setQrDataUrl] = React.useState<string>("");
  const [scanUrl, setScanUrl] = React.useState<string>("");
  const [copied, setCopied] = React.useState(false);
  const [remainingMs, setRemainingMs] = React.useState<number>(0);
  const [isRotating, setIsRotating] = React.useState(false);

  // Initialize or fetch active session on modal open
  React.useEffect(() => {
    if (isOpen) {
      const activeSession = initSession();
      setRemainingMs(Math.max(0, activeSession.expiresAt - Date.now()));
    }
  }, [isOpen, initSession]);

  // Update countdown timer every second
  React.useEffect(() => {
    if (!isOpen || !session) return;

    const interval = setInterval(() => {
      const remaining = Math.max(0, session.expiresAt - Date.now());
      setRemainingMs(remaining);
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, session]);

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

  const handleRefreshToken = () => {
    setIsRotating(true);
    const newSession = refreshSession();
    setRemainingMs(Math.max(0, newSession.expiresAt - Date.now()));
    setTimeout(() => setIsRotating(false), 400);
  };

  const isExpired = remainingMs <= 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Hubungkan Pemindai Barcode HP"
      description="Gunakan kamera ponsel untuk memindai barcode barang secara nirkabel dan terenkripsi ke terminal kasir ini."
      maxWidth="md"
    >
      <div className="space-y-4 text-center">
        {/* Security Status Badge & Expiry Countdown */}
        <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-[#FAFBF9] border border-[#E5E5E0] text-xs">
          <div className="flex items-center gap-1.5 font-semibold text-[#1A1A1A]">
            <ShieldCheck className="w-4 h-4 text-[#6FA084]" />
            <span>Sesi Pairing Terproteksi</span>
          </div>
          <div className="flex items-center gap-1.5 font-mono text-[11px]">
            <Clock className={`w-3.5 h-3.5 ${isExpired ? "text-[#E05252]" : "text-[#6FA084]"}`} />
            <span
              className={`font-semibold px-2 py-0.5 rounded-full ${
                isExpired
                  ? "bg-[#FDF2F2] text-[#E05252] border border-[#F5C2C2]"
                  : "bg-[#F4F8F5] text-[#2C2C2C] border border-[#D5E5DC]"
              }`}
            >
              {formatRemainingTime(remainingMs)}
            </span>
          </div>
        </div>

        {/* Real QR Code Container */}
        <div className="relative p-4 bg-white border border-[#E5E5E0] rounded-2xl inline-block mx-auto shadow-sm">
          {isExpired ? (
            <div className="w-52 h-52 flex flex-col items-center justify-center gap-2.5 p-4 bg-[#FDF2F2] rounded-xl border border-[#F5C2C2]">
              <AlertTriangle className="w-8 h-8 text-[#E05252]" />
              <p className="text-xs font-semibold text-[#E05252]">
                Token Pairing Kadaluarsa
              </p>
              <p className="text-[11px] text-[#6B7280]">
                Klik tombol perbarui di bawah untuk membuat token baru.
              </p>
              <Button
                type="button"
                size="sm"
                onClick={handleRefreshToken}
                className="mt-1 h-8 text-xs gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Perbarui Token
              </Button>
            </div>
          ) : qrDataUrl ? (
            <div className="space-y-2">
              <img
                src={qrDataUrl}
                alt="QR Code Pairing Scanner"
                className="w-52 h-52 mx-auto rounded-xl"
              />
              <div className="flex items-center justify-center gap-2">
                <span className="text-[10px] font-semibold text-[#6FA084] font-mono bg-[#F4F8F5] px-2.5 py-0.5 rounded-full border border-[#D5E5DC]">
                  ROOM: {session?.roomId.slice(0, 16)}
                </span>
                <span className="text-[10px] font-semibold text-[#6B7280] font-mono bg-[#F4F4F0] px-2 py-0.5 rounded-full border border-[#E5E5E0]">
                  TTL: 10 Min
                </span>
              </div>
            </div>
          ) : (
            <div className="w-52 h-52 flex items-center justify-center text-xs text-[#6B7280]">
              Membuat QR Code Terenkripsi...
            </div>
          )}
        </div>

        {/* Pairing Instructions */}
        <div className="text-xs text-[#6B7280] space-y-1.5 max-w-sm mx-auto text-left bg-[#FAFBF9] border border-[#E5E5E0] rounded-xl p-3.5">
          <div className="flex items-start gap-2 text-[#1A1A1A] font-semibold text-xs">
            <Smartphone className="w-4 h-4 text-[#6FA084] shrink-0 mt-0.5" />
            <span>Cara Penggunaan & Keamanan:</span>
          </div>
          <ol className="list-decimal list-inside space-y-1 pl-1 text-[11px] text-[#6B7280]">
            <li>Buka kamera di HP atau aplikasi pemindai QR.</li>
            <li>Scan QR Code resmi di atas untuk mengotentikasi sesi pemindai HP.</li>
            <li>Token kadaluarsa otomatis dalam 10 menit demi mencegah manipulasi jaringan.</li>
            <li>Arahkan kamera HP ke barcode kemasan barang, barang langsung masuk ke kasir!</li>
          </ol>
        </div>

        {/* Direct URL copy field & Refresh Token Button */}
        <div className="flex items-center gap-2 p-2 bg-[#F4F4F0] rounded-xl border border-[#E5E5E0]">
          <input
            type="text"
            readOnly
            value={scanUrl}
            className="bg-transparent text-xs text-[#1A1A1A] font-mono flex-1 outline-none px-2 select-all truncate"
            placeholder="Tautan pairing scanner terenkripsi"
          />
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="shrink-0 h-8 text-xs gap-1.5"
            onClick={handleRefreshToken}
            title="Generate token pairing baru"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#6B7280] ${isRotating ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Rotasi Token</span>
          </Button>
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
                Salin
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
            Buka di Tab Baru untuk Test
          </a>
          <Button size="sm" onClick={onClose}>
            Selesai
          </Button>
        </div>
      </div>
    </Modal>
  );
}
