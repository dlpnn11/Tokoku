"use client";

import * as React from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Camera, Smartphone, AlertCircle, CheckCircle2, X } from "lucide-react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { playBeep } from "@/lib/audio";
import { supabase } from "@/lib/supabase";
import { SCANNER_SYNC_CHANNEL } from "@/lib/scannerSecurity";

interface ProductBarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (barcode: string) => void;
}

export function ProductBarcodeScannerModal({
  isOpen,
  onClose,
  onScan,
}: ProductBarcodeScannerModalProps) {
  const [cameraActive, setCameraActive] = React.useState(false);
  const [cameraError, setCameraError] = React.useState<string | null>(null);
  const [scannedResult, setScannedResult] = React.useState<string | null>(null);
  const scannerRef = React.useRef<Html5Qrcode | null>(null);
  const readerId = "product-barcode-modal-reader";

  // Handle successful detection
  const handleBarcodeCapture = React.useCallback(
    (code: string) => {
      const cleanCode = code.trim();
      if (!cleanCode) return;

      playBeep();
      setScannedResult(cleanCode);

      // Brief feedback before closing modal
      setTimeout(() => {
        onScan(cleanCode);
        onClose();
      }, 400);
    },
    [onScan, onClose]
  );

  // 1. Supabase Realtime Listener (HP Scanner Sync)
  React.useEffect(() => {
    if (!isOpen) return;

    const channel = supabase.channel(SCANNER_SYNC_CHANNEL);
    channel
      .on("broadcast", { event: "BARCODE_SCANNED" }, ({ payload }) => {
        const barcode = (payload?.barcode || payload?.sku || "").trim();
        if (barcode) {
          handleBarcodeCapture(barcode);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isOpen, handleBarcodeCapture]);

  // 2. Webcam Scanner Lifecycle
  const stopWebcam = React.useCallback(async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (err) {
        console.warn("Error stopping scanner:", err);
      }
    }
    setCameraActive(false);
  }, []);

  const startWebcam = React.useCallback(async () => {
    setCameraError(null);
    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(readerId, {
          formatsToSupport: [
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.QR_CODE,
          ],
          verbose: false,
        });
      }

      await scannerRef.current.start(
        { facingMode: "environment" },
        {
          fps: 25,
          aspectRatio: 1.333333,
          videoConstraints: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            advanced: [{ focusMode: "continuous" } as any],
          },
        },
        (decodedText) => {
          handleBarcodeCapture(decodedText);
        },
        undefined
      );

      setCameraActive(true);
    } catch (err: any) {
      console.error("Gagal menyalakan webcam:", err);
      setCameraError(
        err.message || "Kamera tidak dapat diakses. Pastikan izin kamera telah diberikan."
      );
      setCameraActive(false);
    }
  }, [handleBarcodeCapture]);

  // Clean up on modal close
  React.useEffect(() => {
    if (!isOpen) {
      stopWebcam();
      setScannedResult(null);
      setCameraError(null);
    }
  }, [isOpen, stopWebcam]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Scan Barcode Produk"
      description="Pindai barcode kemasan barang menggunakan kamera laptop atau pemindai HP yang terhubung."
      maxWidth="md"
    >
      <div className="space-y-4">
        {/* Scanned Success Alert */}
        {scannedResult && (
          <div className="p-3 bg-[#EBF3EE] border border-[#6FA084] rounded-xl flex items-center gap-2.5 text-[#2C6E49] text-xs font-semibold animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 shrink-0 text-[#6FA084]" />
            <div>
              <p className="font-bold text-sm">Barcode Berhasil Terdeteksi!</p>
              <p className="font-mono text-xs text-[#1A1A1A]">{scannedResult}</p>
            </div>
          </div>
        )}

        {/* Video Scanner Box */}
        <div className="relative w-full aspect-4/3 bg-[#1A1A1A] rounded-xl overflow-hidden flex items-center justify-center border border-[#E5E5E0]">
          <div id={readerId} className="w-full h-full" />

          {!cameraActive && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-[#2C2C2C] text-white">
              <Camera className="w-12 h-12 text-[#6FA084] mb-3 opacity-90" />
              <p className="text-xs font-bold text-white mb-1">
                Kamera Laptop / Webcam Siap
              </p>
              <p className="text-[11px] text-[#A0A0A0] max-w-xs mb-4">
                Klik tombol di bawah untuk menyalakan kamera laptop dan arahkan barcode produk ke layar.
              </p>
              <Button
                type="button"
                onClick={startWebcam}
                className="bg-[#6FA084] hover:bg-[#58836B] text-white font-bold text-xs h-10 px-4 rounded-xl gap-2 cursor-pointer shadow-sm"
              >
                <Camera className="w-4 h-4" />
                Nyalakan Kamera Laptop
              </Button>
            </div>
          )}

          {cameraActive && (
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none">
              <span className="bg-[#1A1A1A]/80 text-[#6FA084] text-[10px] font-bold px-2.5 py-1 rounded-full border border-[#6FA084]/40 backdrop-blur-xs flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#6FA084] animate-pulse" />
                Kamera Aktif — Arahkan Barcode
              </span>
              <button
                type="button"
                onClick={stopWebcam}
                className="pointer-events-auto bg-[#1A1A1A]/80 text-white hover:text-[#D64545] p-1.5 rounded-full border border-white/20 transition-colors cursor-pointer"
                title="Matikan Kamera"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Camera Error Alert */}
        {cameraError && (
          <div className="p-3 bg-[#FDEAEA] border border-[#F8BEBE] text-[#D64545] text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{cameraError}</span>
          </div>
        )}

        {/* Realtime HP Scanner Synchronization Card */}
        <div className="p-3.5 bg-[#F4F4F0] border border-[#E5E5E0] rounded-xl flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#EBF3EE] text-[#6FA084] flex items-center justify-center shrink-0">
            <Smartphone className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-[#1A1A1A]">
              Sinkronisasi Scanner HP Aktif
            </p>
            <p className="text-[11px] text-[#6B7280]">
              Jika membuka Scanner HP di ponsel, barcode yang Anda scan di HP akan otomatis masuk ke form ini secara instan!
            </p>
          </div>
        </div>

        <div className="flex justify-end pt-1">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="text-xs h-9 px-4 rounded-xl border-[#E5E5E0]"
          >
            Tutup
          </Button>
        </div>
      </div>
    </Modal>
  );
}
