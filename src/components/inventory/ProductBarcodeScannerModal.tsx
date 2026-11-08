"use client";

import * as React from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import {
  Camera,
  Smartphone,
  AlertCircle,
  CheckCircle2,
  X,
  Zap,
  SwitchCamera,
  Focus,
  Crosshair,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import {
  Html5Qrcode,
  Html5QrcodeCameraScanConfig,
  Html5QrcodeSupportedFormats,
} from "html5-qrcode";
import { playBeep, unlockAudio } from "@/lib/audio";
import { supabase } from "@/lib/supabase";
import { SCANNER_SYNC_CHANNEL } from "@/lib/scannerSecurity";

interface ProductBarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (barcode: string) => void;
}

interface ExtendedTrackCapabilities extends MediaTrackCapabilities {
  focusMode?: string[];
  focusDistance?: { min?: number; max?: number };
}

export function ProductBarcodeScannerModal({
  isOpen,
  onClose,
  onScan,
}: ProductBarcodeScannerModalProps) {
  const [cameraActive, setCameraActive] = React.useState(false);
  const [isStarting, setIsStarting] = React.useState(false);
  const [cameraError, setCameraError] = React.useState<string | null>(null);
  const [scannedResult, setScannedResult] = React.useState<string | null>(null);

  // Stabilize props via refs compliant with React 19 Compiler
  const onScanRef = React.useRef(onScan);
  React.useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  const onCloseRef = React.useRef(onClose);
  React.useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // Advanced Camera, Lens & Focus Controls (Parity with POS / HP Scanner)
  const [cameras, setCameras] = React.useState<Array<{ id: string; label: string }>>([]);
  const [selectedCameraId, setSelectedCameraId] = React.useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = React.useState<number>(1.0);
  const [hasHardwareZoom, setHasHardwareZoom] = React.useState(false);
  const [hasTorch, setHasTorch] = React.useState(false);
  const [torchOn, setTorchOn] = React.useState(false);
  const [showFocusRing, setShowFocusRing] = React.useState(false);
  const [focusStatus, setFocusStatus] = React.useState<string | null>(null);
  const [isMacroMode, setIsMacroMode] = React.useState(false);

  const modalContainerRef = React.useRef<HTMLDivElement>(null);
  const scannerRef = React.useRef<Html5Qrcode | null>(null);
  const lastScanTimeRef = React.useRef<number>(0);
  const scanTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const focusRingTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const focusStatusTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const isStartingRef = React.useRef<boolean>(false);
  const shouldStopRef = React.useRef<boolean>(false);
  const readerId = "product-barcode-modal-reader";

  // Stop camera stream safely, clear DOM references, and reset controls
  const stopCamera = React.useCallback(async () => {
    shouldStopRef.current = true;
    if (scanTimeoutRef.current) {
      clearTimeout(scanTimeoutRef.current);
      scanTimeoutRef.current = null;
    }
    if (focusRingTimeoutRef.current) {
      clearTimeout(focusRingTimeoutRef.current);
      focusRingTimeoutRef.current = null;
    }
    if (focusStatusTimeoutRef.current) {
      clearTimeout(focusStatusTimeoutRef.current);
      focusStatusTimeoutRef.current = null;
    }
    const videoElem = document.querySelector(`#${readerId} video`) as HTMLVideoElement | null;
    if (videoElem) {
      videoElem.style.transform = "scale(1)";
      if (videoElem.srcObject instanceof MediaStream) {
        videoElem.srcObject.getTracks().forEach((track) => {
          try {
            track.stop();
          } catch {}
        });
        videoElem.srcObject = null;
      }
    }
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await Promise.race([
            scannerRef.current.stop(),
            new Promise((r) => setTimeout(r, 800)),
          ]);
        }
        try {
          scannerRef.current.clear();
        } catch {}
      } catch (err: unknown) {
        console.warn("Error stopping scanner:", err);
      }
      scannerRef.current = null;
    }
    setCameraActive(false);
    setIsStarting(false);
    isStartingRef.current = false;
    setTorchOn(false);
    setIsMacroMode(false);
    setZoomLevel(1.0);
    setShowFocusRing(false);
    setFocusStatus(null);
  }, [readerId]);

  // Clean close modal handler
  const handleModalClose = React.useCallback(() => {
    stopCamera();
    setScannedResult(null);
    setCameraError(null);
    onCloseRef.current();
  }, [stopCamera]);

  // Handle successful detection
  const handleBarcodeCapture = React.useCallback(
    (code: string) => {
      const cleanCode = code.trim();
      if (!cleanCode) return;

      if (scanTimeoutRef.current) {
        clearTimeout(scanTimeoutRef.current);
      }

      playBeep();
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate(100);
      }
      setScannedResult(cleanCode);

      // Brief feedback before closing modal and filling the form
      scanTimeoutRef.current = setTimeout(async () => {
        await stopCamera();
        onScanRef.current(cleanCode);
        onCloseRef.current();
      }, 500);
    },
    [stopCamera]
  );

  // Capture Escape key and trap Focus within the modal for complete keyboard accessibility
  React.useEffect(() => {
    if (!isOpen) return;

    const container = modalContainerRef.current;
    const previouslyFocused = document.activeElement as HTMLElement | null;

    // Auto-focus primary interactive element inside modal dialog
    const focusTimer = setTimeout(() => {
      if (!container) return;
      const focusables = Array.from(
        container.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      ).filter((el) => el.offsetParent !== null);
      if (focusables.length > 0) {
        focusables[0].focus();
      }
    }, 60);

    const handleKeyDownCapture = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopImmediatePropagation();
        e.preventDefault();
        handleModalClose();
        return;
      }

      if (e.key === "Tab" && container) {
        const focusables = Array.from(
          container.querySelectorAll<HTMLElement>(
            'button:not([disabled]), [tabindex]:not([tabindex="-1"])'
          )
        ).filter((el) => el.offsetParent !== null);

        if (focusables.length === 0) return;

        const firstEl = focusables[0];
        const lastEl = focusables[focusables.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstEl) {
            e.preventDefault();
            lastEl.focus();
          }
        } else {
          if (document.activeElement === lastEl) {
            e.preventDefault();
            firstEl.focus();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDownCapture, { capture: true });
    return () => {
      clearTimeout(focusTimer);
      window.removeEventListener("keydown", handleKeyDownCapture, { capture: true });
      if (previouslyFocused && typeof previouslyFocused.focus === "function") {
        try {
          previouslyFocused.focus();
        } catch {}
      }
    };
  }, [isOpen, handleModalClose]);

  // Stabilize barcode capture handler for Supabase channel
  const handleBarcodeCaptureRef = React.useRef(handleBarcodeCapture);
  React.useEffect(() => {
    handleBarcodeCaptureRef.current = handleBarcodeCapture;
  }, [handleBarcodeCapture]);

  // 1. Supabase Realtime Listener (HP Scanner Sync)
  React.useEffect(() => {
    if (!isOpen) return;

    const channel = supabase.channel(SCANNER_SYNC_CHANNEL);
    channel
      .on("broadcast", { event: "BARCODE_SCANNED" }, ({ payload }) => {
        const barcode = (payload?.barcode || payload?.sku || "").trim();
        if (barcode) {
          handleBarcodeCaptureRef.current(barcode);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isOpen]);

  // Handle zoom changes (Hardware zoom or digital CSS scale fallback)
  const handleSetZoom = React.useCallback(
    async (newZoom: number) => {
      unlockAudio();
      setZoomLevel(newZoom);
      if (newZoom !== 2.0 && isMacroMode) {
        setIsMacroMode(false);
        try {
          await scannerRef.current?.applyVideoConstraints({
            advanced: [{ focusMode: "continuous" } as unknown as MediaTrackConstraintSet],
          });
        } catch {}
      }

      if (scannerRef.current && hasHardwareZoom) {
        try {
          const caps = scannerRef.current.getRunningTrackCameraCapabilities();
          const zoomCap = caps?.zoomFeature?.();
          if (zoomCap && zoomCap.isSupported()) {
            await zoomCap.apply(newZoom);
            return;
          }
        } catch (e: unknown) {
          console.warn("Hardware zoom apply error:", e);
        }
      }

      // Digital CSS scale zoom fallback
      const videoElem = document.querySelector(`#${readerId} video`) as HTMLVideoElement | null;
      if (videoElem) {
        videoElem.style.transform = `scale(${newZoom})`;
        videoElem.style.transformOrigin = "center center";
        videoElem.style.transition = "transform 0.2s ease-out";
      }
    },
    [hasHardwareZoom, isMacroMode, readerId]
  );

  // Start scanner with retail barcode decoding formats and full-frame camera
  const startScannerWithCamera = React.useCallback(
    async (cameraIdToUse?: string | null) => {
      if (isStartingRef.current || (scannerRef.current && scannerRef.current.isScanning)) return;
      if (typeof document !== "undefined" && !document.getElementById(readerId)) return;
      isStartingRef.current = true;
      shouldStopRef.current = false;
      setIsStarting(true);
      setCameraError(null);

      try {
        if (!scannerRef.current) {
          const formatsToSupport = [
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.QR_CODE,
            Html5QrcodeSupportedFormats.ITF,
          ];

          scannerRef.current = new Html5Qrcode(readerId, {
            formatsToSupport,
            verbose: false,
            useBarCodeDetectorIfSupported: true,
          });
        }

        const qrCodeSuccessCallback = (decodedText: string) => {
          const now = Date.now();
          if (now - lastScanTimeRef.current > 1200) {
            lastScanTimeRef.current = now;
            handleBarcodeCapture(decodedText);
          }
        };

        const config: Html5QrcodeCameraScanConfig = {
          fps: 25,
          videoConstraints: {
            ...(cameraIdToUse
              ? { deviceId: { exact: cameraIdToUse } }
              : { facingMode: { ideal: "environment" } }),
            width: { ideal: 1920, min: 1280 },
            height: { ideal: 1080, min: 720 },
            advanced: [{ focusMode: "continuous" } as unknown as MediaTrackConstraintSet],
          },
        };

        const cameraArg = cameraIdToUse
          ? cameraIdToUse
          : { facingMode: "environment" };

        try {
          await scannerRef.current.start(
            cameraArg,
            config,
            qrCodeSuccessCallback,
            undefined
          );
        } catch (firstErr: unknown) {
          console.warn("First start attempt failed, attempting fallback:", firstErr);
          if (shouldStopRef.current) return;

          const fallbackConfig: Html5QrcodeCameraScanConfig = {
            fps: 25,
            videoConstraints: {
              ...(cameraIdToUse ? { deviceId: { exact: cameraIdToUse } } : {}),
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
          };
          try {
            await scannerRef.current.start(
              cameraArg,
              fallbackConfig,
              qrCodeSuccessCallback,
              undefined
            );
          } catch (secondErr: unknown) {
            console.warn("Second start attempt failed, attempting basic fallback:", secondErr);
            if (shouldStopRef.current) return;
            const basicConfig: Html5QrcodeCameraScanConfig = { fps: 20 };
            try {
              await scannerRef.current.start(
                { facingMode: "environment" },
                basicConfig,
                qrCodeSuccessCallback,
                undefined
              );
            } catch {
              if (shouldStopRef.current) return;
              await scannerRef.current.start(
                { facingMode: "user" },
                basicConfig,
                qrCodeSuccessCallback,
                undefined
              );
            }
          }
        }

        if (shouldStopRef.current) {
          try {
            if (scannerRef.current.isScanning) {
              await scannerRef.current.stop();
            }
            try {
              scannerRef.current.clear();
            } catch {}
          } catch {}
          scannerRef.current = null;
          setCameraActive(false);
          setIsStarting(false);
          isStartingRef.current = false;
          return;
        }

        setCameraActive(true);

        // Query camera track capabilities & enumerate fresh devices
        try {
          const freshDevices = await Html5Qrcode.getCameras();
          if (freshDevices && freshDevices.length > 0) {
            setCameras(freshDevices);
            if (!cameraIdToUse) {
              setSelectedCameraId(freshDevices[0].id);
            }
          }

          const zoomCap = scannerRef.current.getRunningTrackCameraCapabilities()?.zoomFeature?.();
          if (zoomCap && zoomCap.isSupported()) {
            setHasHardwareZoom(true);
            zoomCap.apply(1.0).catch(() => {});
          } else {
            setHasHardwareZoom(false);
          }

          const torchCap = scannerRef.current.getRunningTrackCameraCapabilities()?.torchFeature?.();
          if (torchCap && torchCap.isSupported()) {
            setHasTorch(true);
          } else {
            setHasTorch(false);
            setTorchOn(false);
          }
        } catch (capErr: unknown) {
          console.warn("Could not query camera track capabilities:", capErr);
        }
      } catch (err: unknown) {
        if (shouldStopRef.current) return;
        console.error("Camera start error:", err);
        const errorMsg =
          err instanceof Error
            ? err.message
            : "Gagal mengakses kamera. Pastikan izin kamera aktif pada browser.";
        setCameraError(errorMsg);
        setCameraActive(false);
      } finally {
        setIsStarting(false);
        isStartingRef.current = false;
      }
    },
    [handleBarcodeCapture, readerId]
  );

  // Initialize camera enumeration and handle complete cleanup in effect return
  React.useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    Html5Qrcode.getCameras()
      .then((devices) => {
        if (devices && devices.length > 0 && isMounted) {
          setCameras(devices);

          const savedId =
            typeof window !== "undefined"
              ? localStorage.getItem("tokoku_preferred_camera_id")
              : null;

          let chosenCamId: string | null = null;
          if (savedId && devices.some((d) => d.id === savedId)) {
            chosenCamId = savedId;
          } else {
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

            const mainCam = nonUltra.find((d) => {
              const l = d.label.toLowerCase();
              return l.includes("main") || l.includes("primary") || l.includes("1x");
            });

            if (mainCam) {
              chosenCamId = mainCam.id;
            } else if (nonUltra.length > 0) {
              chosenCamId = nonUltra[nonUltra.length > 1 ? 1 : 0].id;
            } else if (backCameras.length > 0) {
              chosenCamId = backCameras[backCameras.length > 1 ? 1 : 0].id;
            } else {
              chosenCamId = devices[0].id;
            }
          }
          setSelectedCameraId(chosenCamId);
        }
      })
      .catch((err: unknown) => {
        console.warn("Initial camera enumeration error:", err);
      });

    return () => {
      isMounted = false;
      stopCamera();
    };
  }, [isOpen, stopCamera]);

  // Handle switching physical cameras or lenses
  const handleSwitchCamera = React.useCallback(async () => {
    unlockAudio();
    if (cameras.length <= 1 || isStartingRef.current) return;
    const currentIndex = cameras.findIndex((c) => c.id === selectedCameraId);
    const nextIndex = (currentIndex + 1) % cameras.length;
    const nextCamera = cameras[nextIndex];

    setSelectedCameraId(nextCamera.id);
    if (typeof window !== "undefined") {
      localStorage.setItem("tokoku_preferred_camera_id", nextCamera.id);
    }

    try {
      if (scannerRef.current && scannerRef.current.isScanning) {
        await scannerRef.current.stop();
      }
    } catch (e: unknown) {
      console.warn("Stop error before switch:", e);
    }

    // Short pause for OS camera driver to release sensor
    await new Promise((r) => setTimeout(r, 150));
    if (shouldStopRef.current) return;

    await startScannerWithCamera(nextCamera.id);
  }, [cameras, selectedCameraId, startScannerWithCamera]);

  // Handle flashlight/torch toggle
  const handleToggleTorch = async () => {
    unlockAudio();
    if (!scannerRef.current) return;
    try {
      const caps = scannerRef.current.getRunningTrackCameraCapabilities();
      const torchCap = caps?.torchFeature?.();
      if (torchCap && torchCap.isSupported()) {
        const target = !torchOn;
        await torchCap.apply(target);
        setTorchOn(target);
      }
    } catch (e: unknown) {
      console.warn("Torch apply error:", e);
    }
  };

  // Macro mode: combines hardware focusDistance (if supported) with automatic 2.0x zoom
  const handleToggleMacro = async () => {
    unlockAudio();
    const nextMacro = !isMacroMode;
    setIsMacroMode(nextMacro);

    if (nextMacro) {
      let appliedHardware = false;
      try {
        const trackCaps = scannerRef.current?.getRunningTrackCapabilities() as
          | ExtendedTrackCapabilities
          | undefined;
        if (trackCaps?.focusDistance) {
          const minDistance = trackCaps.focusDistance.min ?? 0.1;
          await scannerRef.current?.applyVideoConstraints({
            advanced: [
              {
                focusMode: "manual",
                focusDistance: minDistance,
              } as unknown as MediaTrackConstraintSet,
            ],
          });
          appliedHardware = true;
        } else {
          await scannerRef.current?.applyVideoConstraints({
            advanced: [{ focusMode: "continuous" } as unknown as MediaTrackConstraintSet],
          });
        }
      } catch (e: unknown) {
        console.warn("Macro hardware focus failed:", e);
      }

      await handleSetZoom(2.0);
      setFocusStatus(
        appliedHardware ? "Mode Makro Aktif (Jarak Dekat)" : "Mode Makro Aktif (Zoom 2.0x)"
      );
    } else {
      try {
        await scannerRef.current?.applyVideoConstraints({
          advanced: [{ focusMode: "continuous" } as unknown as MediaTrackConstraintSet],
        });
      } catch {}
      await handleSetZoom(1.0);
      setFocusStatus("Fokus Normal (1.0x)");
    }

    if (focusStatusTimeoutRef.current) {
      clearTimeout(focusStatusTimeoutRef.current);
    }
    focusStatusTimeoutRef.current = setTimeout(() => setFocusStatus(null), 1800);
  };

  // Hardware Autofocus Trigger
  const handleTapToFocus = async () => {
    unlockAudio();
    setShowFocusRing(true);
    setFocusStatus("Mencari Titik Fokus...");

    if (focusRingTimeoutRef.current) {
      clearTimeout(focusRingTimeoutRef.current);
    }
    if (focusStatusTimeoutRef.current) {
      clearTimeout(focusStatusTimeoutRef.current);
    }

    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(30);
    }

    if (!scannerRef.current) {
      focusRingTimeoutRef.current = setTimeout(() => setShowFocusRing(false), 1200);
      return;
    }

    try {
      const trackCaps = scannerRef.current.getRunningTrackCapabilities() as
        | ExtendedTrackCapabilities
        | undefined;
      const supportedFocusModes = trackCaps?.focusMode || [];

      if (supportedFocusModes.includes("single-shot")) {
        await scannerRef.current.applyVideoConstraints({
          advanced: [{ focusMode: "single-shot" } as unknown as MediaTrackConstraintSet],
        });
        setFocusStatus("Fokus Terkunci");

        focusStatusTimeoutRef.current = setTimeout(async () => {
          try {
            await scannerRef.current?.applyVideoConstraints({
              advanced: [{ focusMode: "continuous" } as unknown as MediaTrackConstraintSet],
            });
            setFocusStatus(null);
          } catch {}
        }, 1400);
      } else if (
        supportedFocusModes.includes("manual") &&
        supportedFocusModes.includes("continuous")
      ) {
        await scannerRef.current.applyVideoConstraints({
          advanced: [{ focusMode: "manual" } as unknown as MediaTrackConstraintSet],
        });
        await new Promise((r) => setTimeout(r, 60));
        await scannerRef.current.applyVideoConstraints({
          advanced: [{ focusMode: "continuous" } as unknown as MediaTrackConstraintSet],
        });
        setFocusStatus("Fokus Disesuaikan");
        focusStatusTimeoutRef.current = setTimeout(() => setFocusStatus(null), 1400);
      } else {
        await scannerRef.current.applyVideoConstraints({
          advanced: [{ focusMode: "continuous" } as unknown as MediaTrackConstraintSet],
        });
        setFocusStatus("Autofokus Diperbarui");
        focusStatusTimeoutRef.current = setTimeout(() => setFocusStatus(null), 1800);
      }
    } catch (err: unknown) {
      console.warn("Autofocus apply error:", err);
      setFocusStatus("Gunakan Jarak 15-30 cm");
      focusStatusTimeoutRef.current = setTimeout(() => setFocusStatus(null), 1800);
    } finally {
      focusRingTimeoutRef.current = setTimeout(() => setShowFocusRing(false), 1200);
    }
  };

  const activeCameraObj = cameras.find((c) => c.id === selectedCameraId);
  const activeCameraLabel =
    activeCameraObj?.label?.trim()
      ? activeCameraObj.label.slice(0, 24)
      : "Kamera Utama (1x)";

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleModalClose}
      title="Scan Barcode Produk"
      description="Pindai barcode kemasan barang menggunakan kamera atau pemindai HP yang terhubung."
      maxWidth="md"
    >
      <div
        ref={modalContainerRef}
        role="region"
        aria-label="Pemindai Barcode Produk"
        className="space-y-4"
      >
        {/* Scoped CSS for HTML5 QR Code clean container */}
        <style jsx global>{`
          #product-barcode-modal-reader {
            position: relative !important;
            width: 100% !important;
            height: 100% !important;
            border: none !important;
          }
          #product-barcode-modal-reader video {
            width: 100% !important;
            height: 100% !important;
            object-fit: cover !important;
          }
          #product-barcode-modal-reader__dashboard_section_csr,
          #product-barcode-modal-reader__status_span,
          #product-barcode-modal-reader img {
            display: none !important;
          }
        `}</style>

        {/* Scanned Success Alert */}
        {scannedResult && (
          <div
            role="status"
            aria-live="polite"
            className="p-3 bg-[#EBF3EE] border border-[#6FA084] rounded-xl flex items-center gap-2.5 text-[#2C6E49] text-xs font-semibold animate-in fade-in"
          >
            <CheckCircle2 className="w-5 h-5 shrink-0 text-[#6FA084]" />
            <div>
              <p className="font-bold text-sm">Barcode Berhasil Terdeteksi!</p>
              <p className="font-mono text-xs text-[#1A1A1A]">{scannedResult}</p>
            </div>
          </div>
        )}

        {/* Quick Lens & Zoom Control Bar (When Camera is Active) */}
        {cameraActive && (
          <div className="w-full flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 px-1 animate-in fade-in">
            {/* Zoom Selector (1x, 1.5x, 2x, 2.5x) */}
            <div
              role="group"
              aria-label="Pilihan Tingkat Zoom Kamera"
              className="flex items-center gap-1 bg-[#1A1A1A] border border-[#3D3D3D] rounded-xl p-1 shrink-0"
            >
              {[1.0, 1.5, 2.0, 2.5].map((val) => (
                <button
                  key={val}
                  type="button"
                  aria-pressed={zoomLevel === val}
                  aria-label={`Pilih Zoom ${val}x`}
                  onClick={() => handleSetZoom(val)}
                  className={`min-h-[44px] min-w-[44px] px-2 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center ${
                    zoomLevel === val
                      ? "bg-[#6FA084] text-white"
                      : "text-[#9E9E9E] hover:text-white"
                  }`}
                >
                  {val}x
                </button>
              ))}
            </div>

            {/* Quick Action Controls: Makro, Torch, & Lens Switch */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {/* Mode Makro */}
              <Button
                type="button"
                size="sm"
                variant="outline"
                aria-pressed={isMacroMode}
                aria-label="Mode Makro (Fokus Jarak Dekat dan Zoom 2x)"
                onClick={handleToggleMacro}
                className={`min-h-[44px] px-3.5 border-[#3D3D3D] text-xs gap-1.5 rounded-xl transition-all cursor-pointer flex items-center justify-center ${
                  isMacroMode
                    ? "bg-[#6FA084] text-white border-[#6FA084]"
                    : "bg-[#1A1A1A] text-white hover:bg-[#2C2C2C]"
                }`}
                title="Mode Makro (Fokus Jarak Dekat & Zoom 2x)"
              >
                <Sparkles className="w-4 h-4 text-[#E8A838]" />
                <span className="text-xs font-bold">Makro</span>
              </Button>

              {hasTorch && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  aria-pressed={torchOn}
                  aria-label={torchOn ? "Matikan Lampu Senter" : "Nyalakan Lampu Senter"}
                  onClick={handleToggleTorch}
                  className={`min-h-[44px] min-w-[44px] px-3.5 border-[#3D3D3D] text-xs gap-1.5 rounded-xl cursor-pointer flex items-center justify-center ${
                    torchOn
                      ? "bg-[#E8A838] text-black border-[#E8A838] hover:bg-[#D4972E]"
                      : "bg-[#1A1A1A] text-white hover:bg-[#2C2C2C]"
                  }`}
                  title="Lampu Senter"
                >
                  <Zap className="w-4 h-4" />
                  <span className="text-xs">{torchOn ? "Flash" : "Flash"}</span>
                </Button>
              )}

              {cameras.length > 1 && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  aria-label="Ganti Lensa Kamera Belakang"
                  onClick={handleSwitchCamera}
                  className="min-h-[44px] px-3.5 bg-[#1A1A1A] border-[#3D3D3D] text-white hover:bg-[#2C2C2C] text-xs gap-1.5 rounded-xl cursor-pointer flex items-center justify-center"
                  title="Ganti Lensa / Kamera"
                >
                  <SwitchCamera className="w-4 h-4 text-[#6FA084]" />
                  <span className="text-xs">Ganti Lensa</span>
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Main Viewfinder Window */}
        <div
          role="button"
          tabIndex={cameraActive ? 0 : -1}
          aria-label={
            cameraActive
              ? "Jendela kamera aktif. Ketuk atau tekan Enter untuk mengunci fokus lensa."
              : "Jendela pemindai barcode"
          }
          onClick={cameraActive ? handleTapToFocus : undefined}
          onKeyDown={
            cameraActive
              ? (e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleTapToFocus();
                  }
                }
              : undefined
          }
          className={`relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-black select-none ${
            cameraActive
              ? "border-2 border-[#6FA084] shadow-2xl cursor-pointer group"
              : "border border-[#E5E5E0]"
          }`}
        >
          {/* HTML5 QR Code Container (Always mounted in DOM) */}
          <div id={readerId} className="w-full h-full" />

          {/* Active Scanner Viewfinder Overlays */}
          {cameraActive && (
            <>
              {/* Targeting Overlay Frame */}
              <div className="absolute inset-x-6 top-1/4 bottom-1/4 border-2 border-dashed border-[#6FA084]/60 rounded-xl pointer-events-none flex items-center justify-center">
                {/* Red laser scanning line */}
                <div className="w-full h-0.5 bg-[#E05252] shadow-[0_0_10px_#E05252] animate-pulse" />
              </div>

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
                <div
                  role="status"
                  aria-live="polite"
                  className="absolute bottom-4 inset-x-4 mx-auto max-w-fit bg-[#1A1A1A] border border-[#6FA084] text-[#6FA084] font-bold text-[11px] px-3.5 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 z-20 animate-in fade-in"
                >
                  <Focus className="w-3.5 h-3.5 animate-spin" />
                  <span>{focusStatus}</span>
                </div>
              )}

              {/* In-viewfinder Scanned Banner */}
              {scannedResult && (
                <div className="absolute top-4 inset-x-4 mx-auto max-w-fit bg-[#6FA084] text-white font-bold text-xs px-4 py-2 rounded-full shadow-lg flex items-center gap-2 animate-bounce z-20">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Barcode Terdeteksi: {scannedResult}</span>
                </div>
              )}

              {/* Top Bar inside Viewfinder: Status Indicator & Close Button */}
              <div className="absolute top-3 inset-x-3 flex items-center justify-between pointer-events-none z-30">
                <span className="bg-[#1A1A1A] text-[#6FA084] text-[10px] font-bold px-2.5 py-1 rounded-full border border-[#6FA084]/40 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#6FA084] animate-pulse" />
                  <span>Kamera Aktif: {activeCameraLabel}</span>
                </span>
                <button
                  type="button"
                  aria-label="Matikan Kamera"
                  onClick={(e) => {
                    e.stopPropagation();
                    stopCamera();
                  }}
                  className="pointer-events-auto bg-[#1A1A1A] text-white hover:text-[#D64545] min-h-[44px] min-w-[44px] flex items-center justify-center p-2 rounded-full border border-white/20 transition-colors cursor-pointer"
                  title="Matikan Kamera"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Camera Error inside active viewfinder */}
              {cameraError && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute inset-0 bg-[#1A1A1A]/95 rounded-2xl p-4 flex flex-col items-center justify-center text-center space-y-3 z-30"
                >
                  <p className="text-xs text-[#E05252] font-bold">{cameraError}</p>
                  <Button
                    size="sm"
                    aria-label="Coba Nyalakan Lagi Kamera"
                    onClick={(e) => {
                      e.stopPropagation();
                      startScannerWithCamera(selectedCameraId);
                    }}
                    className="gap-2 bg-[#6FA084] hover:bg-[#58836B] min-h-[44px] px-4 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Coba Nyalakan Lagi
                  </Button>
                </div>
              )}
            </>
          )}

          {/* Inactive State Box (Buka Kamera Prompt) */}
          {!cameraActive && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-[#2C2C2C] text-white z-20">
              <Camera className="w-12 h-12 text-[#6FA084] mb-3 opacity-90" />
              <p className="text-xs font-bold text-white mb-1">
                Buka Kamera
              </p>
              <p className="text-[11px] text-[#A0A0A0] max-w-xs mb-4">
                Klik tombol di bawah untuk membuka kamera dan arahkan barcode produk ke kotak pemindai.
              </p>
              <Button
                type="button"
                disabled={isStarting}
                aria-label="Buka Kamera"
                aria-busy={isStarting}
                onClick={() => {
                  unlockAudio();
                  startScannerWithCamera(selectedCameraId);
                }}
                className="bg-[#6FA084] hover:bg-[#58836B] text-white font-bold text-xs min-h-[44px] h-11 px-6 rounded-xl gap-2 cursor-pointer shadow-sm transition-all flex items-center justify-center"
              >
                {isStarting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Membuka Kamera...
                  </>
                ) : (
                  <>
                    <Camera className="w-4 h-4" />
                    Buka Kamera
                  </>
                )}
              </Button>

              {cameraError && (
                <div
                  role="alert"
                  className="mt-4 p-2.5 bg-[#FDEAEA] border border-[#F8BEBE] text-[#D64545] text-xs rounded-xl flex items-center gap-2 max-w-sm"
                >
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span className="text-[11px] text-left">{cameraError}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Hardware Status & Focus Guidance (When Camera is Active) */}
        {cameraActive && (
          <div className="w-full space-y-1 px-1 animate-in fade-in">
            <div className="flex items-center justify-between text-[11px] text-[#4A4A4A]">
              <button
                type="button"
                aria-label="Kunci Fokus Kamera"
                onClick={handleTapToFocus}
                className="flex items-center gap-1.5 text-[#6FA084] hover:underline font-medium cursor-pointer py-2 min-h-[44px]"
              >
                <Focus className="w-3.5 h-3.5" />
                <span>Ketuk untuk Kunci Fokus</span>
              </button>
              <span className="text-[#8E8E8E] text-[10px]">
                Jarak Nyaman: <strong>20–40 cm</strong>
              </span>
            </div>

            <p className="text-[10px] text-[#808080] leading-snug">
              💡 <strong>Full-Frame Aktif:</strong> Barcode dapat dipindai dari jarak jauh maupun dekat di seluruh area kamera. Tekan <strong>Makro</strong> untuk barcode berukuran mini.
            </p>
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
            aria-label="Tutup Pemindai Barcode"
            onClick={handleModalClose}
            className="text-xs min-h-[44px] h-10 px-5 rounded-xl border-[#E5E5E0] cursor-pointer flex items-center justify-center"
          >
            Tutup
          </Button>
        </div>
      </div>
    </Modal>
  );
}
