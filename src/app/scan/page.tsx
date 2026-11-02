"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { Html5Qrcode, Html5QrcodeCameraScanConfig } from "html5-qrcode";
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
  Zap,
  SwitchCamera,
  Focus,
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

  // Advanced Camera, Lens & Focus Controls
  const [cameras, setCameras] = React.useState<Array<{ id: string; label: string }>>([]);
  const [selectedCameraId, setSelectedCameraId] = React.useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = React.useState<number>(1.0);
  const [hasHardwareZoom, setHasHardwareZoom] = React.useState(false);
  const [hasTorch, setHasTorch] = React.useState(false);
  const [torchOn, setTorchOn] = React.useState(false);
  const [showFocusRing, setShowFocusRing] = React.useState(false);

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

  // Start scanner with specific camera & autofocus constraints
  const startScannerWithCamera = React.useCallback(
    async (cameraIdToUse?: string | null) => {
      if (!hasValidToken) return;
      setCameraError(null);

      try {
        if (!scannerRef.current) {
          scannerRef.current = new Html5Qrcode("reader", {
            verbose: false,
            useBarCodeDetectorIfSupported: true,
          });
        }

        const qrCodeSuccessCallback = (decodedText: string) => {
          const now = Date.now();
          // Debounce: minimum 1.2s between duplicate scans
          if (now - lastScanTimeRef.current > 1200) {
            lastScanTimeRef.current = now;
            broadcastSku(decodedText);
          }
        };

        const config: Html5QrcodeCameraScanConfig = {
          fps: 20,
          qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
            // Rectangular box specifically calibrated for 1D retail barcodes (Indomie, botol, sabun)
            const width = Math.min(Math.round(viewfinderWidth * 0.86), 300);
            const height = Math.min(Math.round(width * 0.52), 160);
            return { width, height };
          },
          aspectRatio: 1.0,
          videoConstraints: {
            ...(cameraIdToUse
              ? { deviceId: { exact: cameraIdToUse } }
              : { facingMode: { ideal: "environment" } }),
            width: { ideal: 1920, min: 1280 },
            height: { ideal: 1080, min: 720 },
            advanced: [{ focusMode: "continuous" } as any],
          },
        };

        const cameraArg = cameraIdToUse
          ? cameraIdToUse
          : { facingMode: "environment" };

        await scannerRef.current.start(
          cameraArg,
          config,
          qrCodeSuccessCallback,
          undefined
        );

        setIsScanning(true);

        // Query capabilities after camera is rendered
        try {
          const caps = scannerRef.current.getRunningTrackCameraCapabilities();
          const zoomCap = caps?.zoomFeature?.();
          if (zoomCap && zoomCap.isSupported()) {
            setHasHardwareZoom(true);
            zoomCap.apply(1.0).catch(() => {});
          }
          const torchCap = caps?.torchFeature?.();
          if (torchCap && torchCap.isSupported()) {
            setHasTorch(true);
          }
        } catch (capErr) {
          console.warn("Could not query camera track capabilities:", capErr);
        }
      } catch (err: any) {
        console.error("Camera start error:", err);
        setCameraError(
          err.message || "Gagal mengakses kamera. Pastikan izin kamera aktif."
        );
        setIsScanning(false);
      }
    },
    [broadcastSku, hasValidToken]
  );

  // Initialize camera enumeration and smart 1x selection
  React.useEffect(() => {
    if (!hasValidToken) return;

    let isMounted = true;
    const initialize = async () => {
      let chosenCamId: string | null = null;
      try {
        const devices = await Html5Qrcode.getCameras();
        if (devices && devices.length > 0 && isMounted) {
          setCameras(devices);

          const savedId =
            typeof window !== "undefined"
              ? localStorage.getItem("tokoku_preferred_camera_id")
              : null;

          if (savedId && devices.some((d) => d.id === savedId)) {
            chosenCamId = savedId;
          } else {
            // Filter back-facing cameras
            const backCameras = devices.filter((d) => {
              const l = d.label.toLowerCase();
              return (
                l.includes("back") ||
                l.includes("rear") ||
                l.includes("belakang") ||
                l.includes("environment") ||
                (!l.includes("front") && !l.includes("user") && !l.includes("depan"))
              );
            });

            // Filter out ultra-wide (0.5x), macro, depth
            const nonUltra = backCameras.filter((d) => {
              const l = d.label.toLowerCase();
              return (
                !l.includes("ultra") &&
                !l.includes("0.5") &&
                !l.includes("macro") &&
                !l.includes("depth") &&
                !l.includes("wide-angle")
              );
            });

            // Look for explicit 1x, main, or primary camera
            const mainCam = nonUltra.find((d) => {
              const l = d.label.toLowerCase();
              return l.includes("main") || l.includes("primary") || l.includes("1x");
            });

            if (mainCam) {
              chosenCamId = mainCam.id;
            } else if (nonUltra.length > 0) {
              chosenCamId = nonUltra[0].id;
            } else if (backCameras.length > 0) {
              chosenCamId = backCameras[0].id;
            } else {
              chosenCamId = devices[0].id;
            }
          }
          setSelectedCameraId(chosenCamId);
        }
      } catch (err) {
        console.warn("Could not list cameras:", err);
      }

      if (isMounted) {
        startScannerWithCamera(chosenCamId);
      }
    };

    initialize();

    return () => {
      isMounted = false;
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, [hasValidToken, startScannerWithCamera]);

  // Handle camera switch (e.g. toggle between lenses)
  const handleSwitchCamera = async () => {
    if (cameras.length <= 1) return;
    const currentIndex = cameras.findIndex((c) => c.id === selectedCameraId);
    const nextIndex = (currentIndex + 1) % cameras.length;
    const nextCamera = cameras[nextIndex];

    setSelectedCameraId(nextCamera.id);
    if (typeof window !== "undefined") {
      localStorage.setItem("tokoku_preferred_camera_id", nextCamera.id);
    }

    try {
      if (scannerRef.current && isScanning) {
        await scannerRef.current.stop();
        setIsScanning(false);
      }
    } catch (e) {
      console.warn("Stop error before switch:", e);
    }

    setTimeout(() => {
      startScannerWithCamera(nextCamera.id);
    }, 200);
  };

  // Handle zoom changes (Hardware zoom or CSS scale fallback)
  const handleSetZoom = async (newZoom: number) => {
    setZoomLevel(newZoom);
    if (scannerRef.current && hasHardwareZoom) {
      try {
        const caps = scannerRef.current.getRunningTrackCameraCapabilities();
        const zoomCap = caps?.zoomFeature?.();
        if (zoomCap && zoomCap.isSupported()) {
          await zoomCap.apply(newZoom);
          return;
        }
      } catch (e) {
        console.warn("Hardware zoom apply error:", e);
      }
    }

    // Digital CSS scale zoom fallback
    const videoElem = document.querySelector("#reader video") as HTMLVideoElement | null;
    if (videoElem) {
      videoElem.style.transform = `scale(${newZoom})`;
      videoElem.style.transformOrigin = "center center";
      videoElem.style.transition = "transform 0.2s ease-out";
    }
  };

  // Handle flashlight/torch toggle
  const handleToggleTorch = async () => {
    if (!scannerRef.current) return;
    try {
      const caps = scannerRef.current.getRunningTrackCameraCapabilities();
      const torchCap = caps?.torchFeature?.();
      if (torchCap && torchCap.isSupported()) {
        const target = !torchOn;
        await torchCap.apply(target);
        setTorchOn(target);
      }
    } catch (e) {
      console.warn("Torch apply error:", e);
    }
  };

  // Tap-to-focus trigger
  const handleTapToFocus = async () => {
    setShowFocusRing(true);
    setTimeout(() => setShowFocusRing(false), 1200);

    if (!scannerRef.current) return;
    try {
      await scannerRef.current.applyVideoConstraints({
        advanced: [{ focusMode: "continuous" } as any],
      });
    } catch {
      // Browser might ignore continuous constraint re-apply
    }
  };

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
          <strong className="text-white"> &quot;Hubungkan HP&quot; </strong>
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
      {/* Inline Scoped Styles to clean up HTML5 QR Code default artifacts */}
      <style jsx global>{`
        #reader {
          position: relative !important;
          width: 100% !important;
          height: 100% !important;
          border: none !important;
        }
        #reader video {
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
        }
        #reader__dashboard_section_csr,
        #reader__status_span,
        #reader img {
          display: none !important;
        }
      `}</style>

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
              Room: {roomId.slice(0, 14)} • Lensa 1x
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
      <div className="relative my-3 flex-1 flex flex-col items-center justify-center">
        {/* Quick Lens & Zoom Control Bar */}
        <div className="w-full max-w-[320px] flex items-center justify-between mb-2 px-1">
          {/* Zoom Selector (1.0x, 1.5x, 2.0x) */}
          <div className="flex items-center gap-1 bg-[#1A1A1A] border border-[#3D3D3D] rounded-lg p-1">
            {[1.0, 1.5, 2.0].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => handleSetZoom(val)}
                className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all ${
                  zoomLevel === val
                    ? "bg-[#6FA084] text-white"
                    : "text-[#9E9E9E] hover:text-white"
                }`}
              >
                {val}x
              </button>
            ))}
          </div>

          {/* Quick Action Controls: Torch & Lens Switch */}
          <div className="flex items-center gap-1.5">
            {hasTorch && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleToggleTorch}
                className={`h-8 px-2.5 border-[#3D3D3D] text-xs gap-1 rounded-lg ${
                  torchOn
                    ? "bg-[#E8A838] text-black border-[#E8A838] hover:bg-[#D4972E]"
                    : "bg-[#1A1A1A] text-white hover:bg-[#2C2C2C]"
                }`}
                title="Lampu Senter"
              >
                <Zap className="w-3.5 h-3.5" />
                <span className="text-[10px]">{torchOn ? "Flash ON" : "Flash"}</span>
              </Button>
            )}

            {cameras.length > 1 && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleSwitchCamera}
                className="h-8 px-2.5 bg-[#1A1A1A] border-[#3D3D3D] text-white hover:bg-[#2C2C2C] text-xs gap-1 rounded-lg"
                title="Ganti Lensa / Kamera Belakang"
              >
                <SwitchCamera className="w-3.5 h-3.5 text-[#6FA084]" />
                <span className="text-[10px]">Ganti Lensa</span>
              </Button>
            )}
          </div>
        </div>

        {/* Viewfinder Window */}
        <div
          onClick={handleTapToFocus}
          className="relative w-full max-w-[320px] aspect-square rounded-2xl overflow-hidden border-2 border-[#6FA084] shadow-2xl bg-black cursor-pointer group select-none"
        >
          {/* HTML5 QR Code Container */}
          <div id="reader" className="w-full h-full" />

          {/* Laser scanning beam line (Pure CSS animation) */}
          <div className="absolute inset-x-6 top-1/2 -translate-y-1/2 h-0.5 bg-[#E05252] shadow-[0_0_8px_#E05252] animate-pulse pointer-events-none" />

          {/* Tap-to-focus Reticle Overlay */}
          {showFocusRing && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-16 h-16 border-2 border-[#6FA084] rounded-lg animate-ping" />
            </div>
          )}

          {/* Scanning status banner */}
          {lastScannedSku && (
            <div className="absolute top-4 inset-x-4 mx-auto max-w-fit bg-[#6FA084] text-white font-bold text-xs px-4 py-2 rounded-full shadow-lg flex items-center gap-2 animate-bounce z-20">
              <CheckCircle2 className="w-4 h-4" />
              <span>Terkirim: {lastScannedSku}</span>
            </div>
          )}

          {cameraError && (
            <div className="absolute inset-0 bg-black/85 rounded-2xl p-4 flex flex-col items-center justify-center text-center space-y-3 z-30">
              <p className="text-xs text-[#E05252] font-bold">{cameraError}</p>
              <Button
                size="sm"
                onClick={() => startScannerWithCamera(selectedCameraId)}
                className="gap-2 bg-[#6FA084] hover:bg-[#58836B]"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Coba Nyalakan Lagi
              </Button>
            </div>
          )}
        </div>

        {/* Helper prompt below scanner */}
        <div className="flex items-center gap-1.5 mt-2 text-[11px] text-[#AFAFAF]">
          <Focus className="w-3.5 h-3.5 text-[#6FA084]" />
          <span>Ketuk layar kamera untuk memfokuskan • Gunakan 1.5x/2x jika barcode kecil</span>
        </div>
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
          Arahkan barcode produk ke dalam kotak bidik. Data terenkripsi dikirim langsung ke kasir desktop.
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
