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
      description="Gunakan kamera ponsel untuk memindai barcode barang secara nirkabel ke terminal kasir ini."
      maxWidth="md"
    >
      <div className="space-y-4 text-center">
        {/* Real QR Code Container */}
        <div className="p-4 bg-white border border-[#E5E5E0] rounded-2xl inline-block mx-auto shadow-sm">
          {qrDataUrl ? (
            <div className="space-y-2">
              <img
                src={qrDataUrl}
                alt="QR Code Pairing Scanner"
                className="w-52 h-52 mx-auto rounded-xl"
              />
              <span className="inline-block text-[11px] font-semibold text-[#6FA084] font-mono bg-[#F4F8F5] px-3 py-1 rounded-full border border-[#D5E5DC]">
                ROOM: {roomId}
              </span>
            </div>
          ) : (
            <div className="w-52 h-52 flex items-center justify-center text-xs text-[#6B7280]">
              Membuat QR Code...
            </div>
          )}
        </div>

        {/* Pairing Instructions */}
        <div className="text-xs text-[#6B7280] space-y-1.5 max-w-sm mx-auto text-left bg-[#FAFBF9] border border-[#E5E5E0] rounded-xl p-3.5">
          <div className="flex items-start gap-2 text-[#1A1A1A] font-semibold text-xs">
            <Smartphone className="w-4 h-4 text-[#6FA084] shrink-0 mt-0.5" />
            <span>Cara Penggunaan:</span>
          </div>
          <ol className="list-decimal list-inside space-y-1 pl-1 text-[11px] text-[#6B7280]">
            <li>Buka kamera di HP kamu atau browser HP.</li>
            <li>Scan QR Code di atas atau akses tautan di bawah.</li>
            <li>Arahkan kamera HP ke barcode kemasan barang (misal: Indomie / Aqua).</li>
            <li>HP akan berbunyi "Beep" dan barang langsung masuk ke kasir!</li>
          </ol>
        </div>

        {/* Direct URL copy field */}
        <div className="flex items-center gap-2 p-2 bg-[#F4F4F0] rounded-xl border border-[#E5E5E0]">
          <input
            type="text"
            readOnly
            value={scanUrl}
            className="bg-transparent text-xs text-[#1A1A1A] font-mono flex-1 outline-none px-2 select-all truncate"
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
