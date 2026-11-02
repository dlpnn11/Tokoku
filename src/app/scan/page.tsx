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
  Zap,
  SwitchCamera,
  Focus,
  Crosshair,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function MobileScannerContent() {
  const searchParams = useSearchParams();
  // Default to permanent room and token so camera is always active without expiration
  const roomId = searchParams.get("room") || "tokoku-main-pos";
  const token = searchParams.get("token") || "tokoku-permanent-scanner-key";

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
  const [focusStatus, setFocusStatus] = React.useState<string | null>(null);
  const [hasAfSupport, setHasAfSupport] = React.useState<boolean>(true);
  const [macroRange, setMacroRange] = React.useState<{ min?: number; max?: number } | null>(null);
  const [isMacroMode, setIsMacroMode] = React.useState(false);

  const scannerRef = React.useRef<Html5Qrcode | null>(null);
  const channelRef = React.useRef<any>(null);
  const lastScanTimeRef = React.useRef<number>(0);

  // Setup Supabase Realtime Channel for permanent pairing
  React.useEffect(() => {
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
  }, [roomId]);

  // Broadcast barcode with authentication token to desktop POS
  const broadcastSku = React.useCallback(
    async (sku: string) => {
      if (!channelRef.current) return;
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
    [token]
  );

  // Handle zoom changes (Hardware zoom or CSS scale fallback)
  const handleSetZoom = React.useCallback(
    async (newZoom: number) => {
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
    },
    [hasHardwareZoom]
  );

  // Start scanner with specific camera & autofocus constraints
  const startScannerWithCamera = React.useCallback(
    async (cameraIdToUse?: string | null) => {
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

        // After stream is running, query actual camera capabilities & full labels
        try {
          const freshDevices = await Html5Qrcode.getCameras();
          if (freshDevices && freshDevices.length > 0) {
            setCameras(freshDevices);
          }

          const trackCaps = scannerRef.current.getRunningTrackCapabilities();
          const supportedFocusModes = ((trackCaps as any)?.focusMode as string[]) || [];
          const afSupported = supportedFocusModes.length > 0;
          setHasAfSupport(afSupported);

          if ((trackCaps as any)?.focusDistance) {
            setMacroRange((trackCaps as any).focusDistance);
          }

          const zoomCap = scannerRef.current.getRunningTrackCameraCapabilities()?.zoomFeature?.();
          if (zoomCap && zoomCap.isSupported()) {
            setHasHardwareZoom(true);
            zoomCap.apply(1.0).catch(() => {});
          }

          const torchCap = scannerRef.current.getRunningTrackCameraCapabilities()?.torchFeature?.();
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
    [broadcastSku]
  );

  // Initialize camera enumeration and smart 1x selection
  React.useEffect(() => {
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
              // Prefer index 1 on phones where index 0 is ultra-wide
              chosenCamId = nonUltra[nonUltra.length > 1 ? 1 : 0].id;
            } else if (backCameras.length > 0) {
              chosenCamId = backCameras[backCameras.length > 1 ? 1 : 0].id;
            } else {
              chosenCamId = devices[0].id;
            }
          }
          setSelectedCameraId(chosenCamId);
        }
      } catch (err) {
        console.warn("Could not list cameras initially:", err);
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
  }, [startScannerWithCamera]);

  // Handle camera switch (e.g. toggle between physical lenses)
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

  // Mode Makro: Always available right from the start!
  // Combines hardware focusDistance (if supported) with automatic 2.0x macro close-up zoom.
  const handleToggleMacro = async () => {
    const nextMacro = !isMacroMode;
    setIsMacroMode(nextMacro);

    if (nextMacro) {
      let appliedHardware = false;
      try {
        const trackCaps = scannerRef.current?.getRunningTrackCapabilities();
        if ((trackCaps as any)?.focusDistance) {
          const minDistance = (trackCaps as any).focusDistance.min ?? 0.1;
          await scannerRef.current?.applyVideoConstraints({
            advanced: [
              {
                focusMode: "manual",
                focusDistance: minDistance,
              } as any,
            ],
          });
          appliedHardware = true;
        } else {
          await scannerRef.current?.applyVideoConstraints({
            advanced: [{ focusMode: "continuous" } as any],
          });
        }
      } catch (e) {
        console.warn("Macro hardware focus failed:", e);
      }

      // Automatically engage 2.0x zoom for instant close-up sharpness
      await handleSetZoom(2.0);
      setFocusStatus(
        appliedHardware ? "Mode Makro Aktif (Jarak Dekat)" : "Mode Makro Aktif (Zoom 2.0x)"
      );
    } else {
      // Revert to normal continuous focus and 1.0x
      try {
        await scannerRef.current?.applyVideoConstraints({
          advanced: [{ focusMode: "continuous" } as any],
        });
      } catch {}
      await handleSetZoom(1.0);
      setFocusStatus("Fokus Normal (1.0x)");
    }

    setTimeout(() => setFocusStatus(null), 1800);
  };

  // Hardware Autofocus Trigger: physically cycles focus modes to sweep contrast
  const handleTapToFocus = async () => {
    setShowFocusRing(true);
    setFocusStatus("Mencari Titik Fokus...");

    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(30);
    }

    if (!scannerRef.current) return;

    try {
      const trackCaps = scannerRef.current.getRunningTrackCapabilities();
      const supportedFocusModes = ((trackCaps as any)?.focusMode as string[]) || [];

      if (supportedFocusModes.includes("single-shot")) {
        // Priority 1: Trigger physical single-shot AF sweep
        await scannerRef.current.applyVideoConstraints({
          advanced: [{ focusMode: "single-shot" } as any],
        });
        setFocusStatus("Fokus Terkunci");

        // Restore continuous tracking after 1.4s
        setTimeout(async () => {
          try {
            await scannerRef.current?.applyVideoConstraints({
              advanced: [{ focusMode: "continuous" } as any],
            });
            setFocusStatus(null);
          } catch {}
        }, 1400);
      } else if (
        supportedFocusModes.includes("manual") &&
        supportedFocusModes.includes("continuous")
      ) {
        // Priority 2: Cycle manual -> continuous to break static focus lock
        await scannerRef.current.applyVideoConstraints({
          advanced: [{ focusMode: "manual" } as any],
        });
        await new Promise((r) => setTimeout(r, 60));
        await scannerRef.current.applyVideoConstraints({
          advanced: [{ focusMode: "continuous" } as any],
        });
        setFocusStatus("Fokus Disesuaikan");
        setTimeout(() => setFocusStatus(null), 1400);
      } else {
        // Priority 3: Re-apply continuous constraints with high sharpness
        await scannerRef.current.applyVideoConstraints({
          advanced: [{ focusMode: "continuous" } as any],
        });
        setFocusStatus("Autofokus Diperbarui");
        setTimeout(() => setFocusStatus(null), 1800);
      }
    } catch (err) {
      console.warn("Autofocus apply error:", err);
      setFocusStatus("Gunakan Jarak 15 cm");
      setTimeout(() => setFocusStatus(null), 1800);
    } finally {
      setTimeout(() => setShowFocusRing(false), 1200);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualSku.trim()) return;
    broadcastSku(manualSku.trim());
    setManualSku("");
  };

  // Determine current active camera label
  const activeCameraObj = cameras.find((c) => c.id === selectedCameraId);
  const activeCameraLabel = activeCameraObj
    ? activeCameraObj.label.slice(0, 24)
    : "Kamera Utama (1x)";

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
              <span title="Sesi Nirkabel Permanen">
                <ShieldCheck className="w-3.5 h-3.5 text-[#6FA084]" />
              </span>
            </div>
            <span className="text-[10px] text-[#9E9E9E] font-mono block truncate max-w-[150px]">
              {activeCameraLabel}
            </span>
          </div>
        </div>

        {/* Connection Indicator */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#2C2C2C] border border-[#3D3D3D]">
          {isConnected ? (
            <>
              <Wifi className="w-3 h-3 text-[#6FA084]" />
              <span className="text-[#6FA084]">Terhubung Kasir</span>
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
          {/* Zoom Selector (1.0x, 1.5x, 2.0x, 2.5x) */}
          <div className="flex items-center gap-1 bg-[#1A1A1A] border border-[#3D3D3D] rounded-lg p-1">
            {[1.0, 1.5, 2.0, 2.5].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => handleSetZoom(val)}
                className={`px-2 py-1 rounded text-[11px] font-bold transition-all ${
                  zoomLevel === val
                    ? "bg-[#6FA084] text-white"
                    : "text-[#9E9E9E] hover:text-white"
                }`}
              >
                {val}x
              </button>
            ))}
          </div>

          {/* Quick Action Controls: Makro (Selalu ada dari awal!), Torch, & Lens Switch */}
          <div className="flex items-center gap-1.5">
            {/* Mode Makro: Langsung tersedia sejak detik pertama */}
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleToggleMacro}
              className={`h-8 px-2 border-[#3D3D3D] text-xs gap-1 rounded-lg transition-all ${
                isMacroMode
                  ? "bg-[#6FA084] text-white border-[#6FA084]"
                  : "bg-[#1A1A1A] text-white hover:bg-[#2C2C2C]"
              }`}
              title="Mode Makro (Fokus Jarak Dekat & Zoom 2x)"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#E8A838]" />
              <span className="text-[10px] font-bold">Makro</span>
            </Button>

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
                <span className="text-[10px]">{torchOn ? "Flash" : "Flash"}</span>
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
              <div className="w-20 h-20 border-2 border-[#6FA084] rounded-xl animate-ping flex items-center justify-center">
                <Crosshair className="w-6 h-6 text-[#6FA084]" />
              </div>
            </div>
          )}

          {/* Live Focus Status Toast */}
          {focusStatus && (
            <div className="absolute bottom-4 inset-x-4 mx-auto max-w-fit bg-black/80 backdrop-blur border border-[#6FA084] text-[#6FA084] font-bold text-[11px] px-3.5 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 z-20 animate-fade-in">
              <Focus className="w-3.5 h-3.5 animate-spin" />
              <span>{focusStatus}</span>
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

        {/* Hardware Status & Focus Guidance */}
        <div className="w-full max-w-[320px] mt-2 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] text-[#AFAFAF] px-1">
            <button
              type="button"
              onClick={handleTapToFocus}
              className="flex items-center gap-1 text-[#6FA084] hover:underline font-medium"
            >
              <Focus className="w-3.5 h-3.5" />
              <span>Ketuk untuk Kunci Fokus</span>
            </button>
            <span className="text-[#8E8E8E] text-[10px]">
              Jarak Ideal: <strong>15–20 cm</strong>
            </span>
          </div>

          <p className="text-[10px] text-[#808080] leading-snug px-1">
            💡 <strong>Tips Barcode Kecil:</strong> Tekan tombol <strong>Makro</strong> atau <strong>Zoom 2.0x</strong> di atas agar barcode kecil langsung fokus tanpa buram.
          </p>
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
          Arahkan barcode produk ke dalam kotak bidik. Data langsung masuk ke keranjang kasir desktop.
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
