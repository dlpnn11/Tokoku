"use client";

import * as React from "react";
import QRCode from "qrcode";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Smartphone, ExternalLink, Copy, Check } from "lucide-react";

interface ScannerPairingModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId?: string;
}

export function ScannerPairingModal({
  isOpen,
  onClose,
  roomId = "tokoku-main-pos",
}: ScannerPairingModalProps) {
  const [qrDataUrl, setQrDataUrl] = React.useState<string>("");
  const [scanUrl, setScanUrl] = React.useState<string>("");
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    if (typeof window !== "undefined" && isOpen) {
      const url = `${window.location.origin}/scan?room=${roomId}`;
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
  }, [isOpen, roomId]);

  const handleCopy = () => {
    if (scanUrl) {
      navigator.clipboard.writeText(scanUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Hubungkan Pemindai Barcode HP"
      description="Gunakan kamera smartphone kasir sebagai scanner barcode nirkabel tanpa alat eksternal."
      maxWidth="md"
    >
      <div className="space-y-4 text-center">
        {/* QR Code Container */}
        <div className="bg-[#FAFBF9] border border-[#E5E5E0] rounded-2xl p-4 inline-block mx-auto shadow-sm">
          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt="QR Code Pairing Scanner"
              className="w-52 h-52 mx-auto rounded-xl"
            />
          ) : (
            <div className="w-52 h-52 flex items-center justify-center text-xs text-[#6B7280]">
              Membuat QR Code...
            </div>
          )}
        </div>

        {/* Pairing Instructions */}
        <div className="text-xs text-[#6B7280] space-y-1.5 max-w-sm mx-auto text-left bg-white border border-[#E5E5E0] rounded-xl p-3.5">
          <div className="flex items-start gap-2 text-[#1A1A1A] font-semibold">
            <Smartphone className="w-4 h-4 text-[#6FA084] shrink-0 mt-0.5" />
            <span>Cara Menghubungkan:</span>
          </div>
          <ol className="list-decimal list-inside space-y-1 pl-1 text-[11px] text-[#6B7280]">
            <li>Buka kamera atau Google Lens di HP kasir.</li>
            <li>Scan QR Code di atas, lalu buka tautan peramban.</li>
            <li>Izinkan akses kamera dan mulai scan barcode fisik produk!</li>
          </ol>
        </div>

        {/* Action Link & Copy */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#E5E5E0]">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="gap-1.5 text-xs h-9"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-[#6FA084]" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-[#6B7280]" />
            )}
            {copied ? "Tautan Tersalin" : "Salin Link"}
          </Button>

          <a
            href={scanUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 h-9 rounded-xl bg-[#6FA084] text-white text-xs font-bold hover:bg-[#58836B] transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Buka Scanner HP
          </a>
        </div>
      </div>
    </Modal>
  );
}
