"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { Html5Qrcode } from "html5-qrcode";
import { supabase } from "@/lib/supabase";
import { playBeep } from "@/lib/audio";
import {
  Camera,
  CheckCircle2,
  Wifi,
  WifiOff,
  Barcode,
  Send,
  RefreshCw,
  ShieldCheck,
  ShieldAlert,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function MobileScannerContent() {
  const searchParams = useSearchParams();
  const roomId = searchParams.get("room") || "tokoku-main-pos";
  const token = searchParams.get("token") || "";

  const [isScanning, setIsScanning] = React.useState(false);
  const [isConnected, setIsConnected] = React.useState(false);
  const [lastScannedSku, setLastScannedSku] = React.useState<string | null>(null);
  const [manualSku, setManualSku] = React.useState("");
  const [cameraError, setCameraError] = React.useState<string | null>(null);

  const scannerRef = React.useRef<Html5Qrcode | null>(null);
  const channelRef = React.useRef<any>(null);
  const lastScanTimeRef = React.useRef<number>(0);

  const hasValidToken = Boolean(token && token.trim().length >= 8);

  // Setup Supabase Realtime Channel for pairing
  React.useEffect(() => {
    if (!hasValidToken) return;

    const channel = supabase.channel(`pos-room-${roomId}`);

    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        setIsConnected(true);
      } else {
        setIsConnected(false);
      }
    });

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, hasValidToken]);

  // Broadcast barcode with authentication token to desktop POS
  const broadcastSku = React.useCallback(
    async (sku: string) => {
      if (!channelRef.current || !hasValidToken) return;
      playBeep();
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate(100);
      }

      setLastScannedSku(sku);

      try {
        await channelRef.current.send({
          type: "broadcast",
          event: "BARCODE_SCANNED",
          payload: {
            barcode: sku.trim(),
            sku: sku.trim(),
            token: token.trim(),
            timestamp: Date.now(),
          },
        });
      } catch (err) {
        console.error("Gagal broadcast barcode:", err);
      }

      // Clear alert after 2.5s
      setTimeout(() => {
        setLastScannedSku((curr) => (curr === sku ? null : curr));
      }, 2500);
    },
    [hasValidToken, token]
  );

  // Initialize html5-qrcode scanner
  const startScanner = React.useCallback(async () => {
    if (!hasValidToken) return;
    setCameraError(null);
    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode("reader");
      }

      const qrCodeSuccessCallback = (decodedText: string) => {
        const now = Date.now();
        // Debounce: minimum 1.2s between duplicate scans
        if (now - lastScanTimeRef.current > 1200) {
          lastScanTimeRef.current = now;
          broadcastSku(decodedText);
        }
      };

      const config = {
        fps: 15,
        qrbox: { width: 260, height: 260 },
        aspectRatio: 1.0,
      };

      await scannerRef.current.start(
        { facingMode: "environment" },
        config,
        qrCodeSuccessCallback,
        undefined
      );

      setIsScanning(true);
    } catch (err: any) {
      console.error("Camera start error:", err);
      setCameraError(
        err.message || "Gagal mengakses kamera. Pastikan izin kamera aktif."
      );
      setIsScanning(false);
    }
  }, [broadcastSku, hasValidToken]);

  const stopScanner = React.useCallback(async () => {
    if (scannerRef.current && isScanning) {
      try {
        await scannerRef.current.stop();
        setIsScanning(false);
      } catch (err) {
        console.error("Camera stop error:", err);
      }
    }
  }, [isScanning]);

  React.useEffect(() => {
    if (hasValidToken) {
      startScanner();
    }
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, [startScanner, hasValidToken]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualSku.trim()) return;
    broadcastSku(manualSku.trim());
    setManualSku("");
  };

  // If token is missing, reject unauthorized access
  if (!hasValidToken) {
    return (
      <div className="min-h-screen bg-[#1F1F1F] text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#E05252]/10 border border-[#E05252]/30 flex items-center justify-center text-[#E05252] mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h1 className="text-lg font-bold mb-2">Token Otentikasi Diperlukan</h1>
        <p className="text-xs text-[#9E9E9E] max-w-xs mb-6 leading-relaxed">
          Pemindai HP ini belum diotentikasi ke terminal kasir. Buka menu
          <strong className="text-white"> "Hubungkan HP" </strong>
          pada layar kasir TokoKu lalu pindai QR Code yang tampil.
        </p>
        <div className="p-3.5 bg-[#2C2C2C] border border-[#3D3D3D] rounded-xl text-[11px] text-[#AFAFAF] max-w-xs flex items-center gap-2">
          <Lock className="w-4 h-4 text-[#E05252] shrink-0" />
          <span>Sesi nirkabel dilindungi token 10 menit untuk mencegah injeksi barang siluman.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#2C2C2C] text-white flex flex-col justify-between p-4 max-w-md mx-auto select-none">
      {/* Header Bar */}
      <div className="bg-[#1A1A1A] border border-[#3D3D3D] rounded-2xl p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#6FA084] flex items-center justify-center text-white">
            <Camera className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-bold text-xs tracking-wider uppercase">
                SCANNER BARCODE HP
              </h1>
              <span title="Sesi Terotentikasi">
                <ShieldCheck className="w-3.5 h-3.5 text-[#6FA084]" />
              </span>
            </div>
            <span className="text-[10px] text-[#9E9E9E] font-mono block">
              Room: {roomId.slice(0, 14)} • Sesi Aman
            </span>
          </div>
        </div>

        {/* Connection Indicator */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#2C2C2C] border border-[#3D3D3D]">
          {isConnected ? (
            <>
              <Wifi className="w-3 h-3 text-[#6FA084]" />
              <span className="text-[#6FA084]">Terhubung</span>
            </>
          ) : (
            <>
              <WifiOff className="w-3 h-3 text-[#E8A838]" />
              <span className="text-[#E8A838]">Menghubungkan...</span>
            </>
          )}
        </div>
      </div>

      {/* Main Viewfinder / Camera Container */}
      <div className="relative my-4 flex-1 flex flex-col items-center justify-center">
        {/* HTML5 QR Code Container */}
        <div
          id="reader"
          className="w-full max-w-[320px] aspect-square rounded-2xl overflow-hidden border-2 border-[#6FA084] shadow-2xl bg-black"
        />

        {/* Scanning status banner */}
        {lastScannedSku && (
          <div className="absolute top-4 bg-[#6FA084] text-white font-bold text-xs px-4 py-2 rounded-full shadow-lg flex items-center gap-2 animate-bounce">
            <CheckCircle2 className="w-4 h-4" />
            <span>Terkirim: {lastScannedSku}</span>
          </div>
        )}

        {cameraError && (
          <div className="absolute inset-0 bg-black/80 rounded-2xl p-4 flex flex-col items-center justify-center text-center space-y-3">
            <p className="text-xs text-[#D64545] font-bold">{cameraError}</p>
            <Button
              size="sm"
              onClick={startScanner}
              className="gap-2 bg-[#6FA084] hover:bg-[#58836B]"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Coba Nyalakan Lagi
            </Button>
          </div>
        )}
      </div>

      {/* Manual Input Fallback & Action Footer */}
      <div className="space-y-3">
        <form onSubmit={handleManualSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Barcode className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9E9E9E]" />
            <Input
              placeholder="Ketik barcode jika kamera buram..."
              value={manualSku}
              onChange={(e) => setManualSku(e.target.value)}
              className="pl-9 h-11 text-xs bg-[#1A1A1A] border-[#3D3D3D] text-white focus:border-[#6FA084]"
            />
          </div>
          <Button
            type="submit"
            disabled={!manualSku.trim()}
            className="h-11 px-4 bg-[#6FA084] hover:bg-[#58836B] text-white font-bold text-xs rounded-xl"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>

        <p className="text-[11px] text-center text-[#9E9E9E]">
          Arahkan barcode produk ke dalam kotak hijau. Data terenkripsi dikirim langsung ke kasir desktop.
        </p>
      </div>
    </div>
  );
}

export default function MobileScannerPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-[#111111] flex items-center justify-center text-[#6FA084] font-medium text-sm">
          Memuat Pemindai HP TokoKu...
        </div>
      }
    >
      <MobileScannerContent />
    </React.Suspense>
  );
}
