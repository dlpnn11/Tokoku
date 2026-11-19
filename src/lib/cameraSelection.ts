import {
  Html5Qrcode,
  Html5QrcodeCameraScanConfig,
} from "html5-qrcode";

export interface CameraDeviceInfo {
  id: string;
  label: string;
}

const FRONT_CAMERA_PATTERN =
  /\b(front|user|depan|selfie|facetime|truedepth)\b|facing\s+front/i;
const REAR_CAMERA_PATTERN =
  /\b(back|rear|belakang|environment)\b|facing\s+back/i;
const SECONDARY_REAR_LENS_PATTERN =
  /\b(ultra|macro|depth|tele|telephoto|wide-angle|bokeh|tof|mono|monochrome)\b|0[.,][56]x?/i;
const PRIMARY_REAR_HINT_PATTERN = /\b(main|primary|utama|1x)\b/i;

export function isFrontCameraLabel(label: string): boolean {
  return FRONT_CAMERA_PATTERN.test(label);
}

export function isRearCameraLabel(label: string): boolean {
  return REAR_CAMERA_PATTERN.test(label);
}

export function isSecondaryRearLensLabel(label: string): boolean {
  return SECONDARY_REAR_LENS_PATTERN.test(label);
}

/**
 * Scores a camera device for suitability as the primary rear 1.0x barcode lens.
 * Returns -Infinity for front cameras or unlabeled entries.
 */
export function scoreRear1xCamera(device: CameraDeviceInfo): number {
  const label = device.label?.trim() ?? "";
  if (!label || isFrontCameraLabel(label)) {
    return Number.NEGATIVE_INFINITY;
  }

  let score = 0;
  if (isRearCameraLabel(label)) {
    score += 100;
  }
  if (PRIMARY_REAR_HINT_PATTERN.test(label)) {
    score += 80;
  }
  if (/^back\s+camera$/i.test(label)) {
    score += 50;
  }
  if (isSecondaryRearLensLabel(label)) {
    score -= 200;
  }

  // On Android Camera2 in Chrome (e.g. "camera2 0, facing back"), index 0 is the primary 1x sensor.
  const cam2Match = label.match(/camera2?\s*(\d+)/i);
  if (cam2Match) {
    const idx = Number.parseInt(cam2Match[1], 10);
    if (idx === 0) {
      score += 40;
    } else if (idx > 0) {
      score -= Math.min(idx * 5, 30);
    }
  }

  return score;
}

/**
 * Picks the best rear 1.0x camera when real labels are available.
 * Returns null if labels are missing (pre-permission) or no clear rear lens is found,
 * so the browser can resolve `facingMode: { exact: "environment" }` natively.
 */
export function selectBestRear1xCamera(
  devices: CameraDeviceInfo[]
): CameraDeviceInfo | null {
  if (!devices.length) return null;

  const hasAnyLabel = devices.some((d) => Boolean(d.label?.trim()));
  if (!hasAnyLabel) return null;

  let bestDevice: CameraDeviceInfo | null = null;
  let bestScore = 0;

  for (const device of devices) {
    const score = scoreRear1xCamera(device);
    if (score > bestScore) {
      bestScore = score;
      bestDevice = device;
    }
  }

  return bestDevice;
}

export function getRunningVideoTrackInfo(containerId: string): {
  deviceId: string | null;
  label: string;
} {
  if (typeof document === "undefined") {
    return { deviceId: null, label: "" };
  }
  const videoElem = document.querySelector(
    `#${containerId} video`
  ) as HTMLVideoElement | null;
  const stream = videoElem?.srcObject;
  if (!(stream instanceof MediaStream)) {
    return { deviceId: null, label: "" };
  }
  const track = stream.getVideoTracks()[0];
  if (!track) {
    return { deviceId: null, label: "" };
  }
  const settings = track.getSettings?.();
  return {
    deviceId: settings?.deviceId ?? null,
    label: track.label ?? "",
  };
}

interface StartAttempt {
  cameraArg: string | { facingMode: string };
  config: Html5QrcodeCameraScanConfig;
}

function buildStartAttempts(cameraIdToUse?: string | null): StartAttempt[] {
  if (cameraIdToUse) {
    return [
      {
        cameraArg: cameraIdToUse,
        config: {
          fps: 25,
          videoConstraints: {
            deviceId: { exact: cameraIdToUse },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
        },
      },
      {
        cameraArg: cameraIdToUse,
        config: {
          fps: 25,
          videoConstraints: {
            deviceId: { exact: cameraIdToUse },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        },
      },
      {
        cameraArg: cameraIdToUse,
        config: {
          fps: 20,
          videoConstraints: {
            deviceId: { exact: cameraIdToUse },
          },
        },
      },
    ];
  }

  // Always enforce rear camera ("environment") first; only fall back to "user"
  // if the device has no rear camera at all (e.g. desktop/laptop webcam).
  return [
    {
      cameraArg: { facingMode: "environment" },
      config: {
        fps: 25,
        videoConstraints: {
          facingMode: { exact: "environment" },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      },
    },
    {
      cameraArg: { facingMode: "environment" },
      config: {
        fps: 25,
        videoConstraints: {
          facingMode: { exact: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      },
    },
    {
      cameraArg: { facingMode: "environment" },
      config: {
        fps: 20,
        videoConstraints: {
          facingMode: { exact: "environment" },
        },
      },
    },
    {
      cameraArg: { facingMode: "environment" },
      config: {
        fps: 20,
        videoConstraints: {
          facingMode: { ideal: "environment" },
        },
      },
    },
    {
      cameraArg: { facingMode: "user" },
      config: {
        fps: 20,
        videoConstraints: {
          facingMode: "user",
        },
      },
    },
  ];
}

async function runAttempts(
  scanner: Html5Qrcode,
  attempts: StartAttempt[],
  qrCodeSuccessCallback: (decodedText: string) => void,
  isAborted?: () => boolean
): Promise<void> {
  let lastError: unknown;
  for (const attempt of attempts) {
    if (isAborted?.()) return;
    try {
      await scanner.start(
        attempt.cameraArg,
        attempt.config,
        qrCodeSuccessCallback,
        undefined
      );
      return;
    } catch (err) {
      lastError = err;
      if (scanner.isScanning) {
        try {
          await scanner.stop();
        } catch {}
      }
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new Error("Gagal mengakses kamera.");
}

export interface StartRearScannerResult {
  cameras: CameraDeviceInfo[];
  activeCameraId: string | null;
}

/**
 * Starts Html5Qrcode enforcing the rear 1.0x camera by default,
 * verifies the running track after permission is granted, and resets zoom to 1.0x.
 */
export async function startScannerWithRearPriority(params: {
  scanner: Html5Qrcode;
  containerId: string;
  cameraIdToUse?: string | null;
  preferRear1x?: boolean;
  onSuccess: (decodedText: string) => void;
  isAborted?: () => boolean;
}): Promise<StartRearScannerResult | null> {
  const {
    scanner,
    containerId,
    cameraIdToUse,
    preferRear1x = false,
    onSuccess,
    isAborted,
  } = params;

  await runAttempts(
    scanner,
    buildStartAttempts(cameraIdToUse),
    onSuccess,
    isAborted
  );
  if (isAborted?.()) return null;

  let freshDevices: CameraDeviceInfo[] = [];
  try {
    freshDevices = await Html5Qrcode.getCameras();
  } catch {}
  if (isAborted?.()) return null;

  let trackInfo = getRunningVideoTrackInfo(containerId);

  // Post-permission self-correction: if browser opened front or secondary (ultra-wide/macro/tele)
  // while a genuine rear 1.0x lens exists, immediately switch to that rear 1.0x camera.
  if (preferRear1x && !cameraIdToUse && freshDevices.length > 1) {
    const bestRear1x = selectBestRear1xCamera(freshDevices);
    const currentDevice =
      freshDevices.find((d) => d.id === trackInfo.deviceId) ??
      (trackInfo.label
        ? freshDevices.find((d) => d.label === trackInfo.label)
        : undefined) ??
      (trackInfo.label ? { id: "", label: trackInfo.label } : undefined);

    const currentScore = currentDevice
      ? scoreRear1xCamera(currentDevice)
      : Number.NEGATIVE_INFINITY;
    const bestScore = bestRear1x
      ? scoreRear1xCamera(bestRear1x)
      : Number.NEGATIVE_INFINITY;

    if (
      bestRear1x &&
      bestRear1x.id !== trackInfo.deviceId &&
      bestScore > currentScore
    ) {
      try {
        if (scanner.isScanning) {
          await scanner.stop();
        }
        if (isAborted?.()) return null;
        await runAttempts(
          scanner,
          buildStartAttempts(bestRear1x.id),
          onSuccess,
          isAborted
        );
        if (isAborted?.()) return null;
        trackInfo = getRunningVideoTrackInfo(containerId);
      } catch (switchErr) {
        console.warn("Rear 1x self-correction fallback:", switchErr);
      }
    }
  }

  // Apply continuous autofocus gently after stream opens (avoids OverconstrainedError on start)
  try {
    await scanner.applyVideoConstraints({
      advanced: [
        { focusMode: "continuous" } as unknown as MediaTrackConstraintSet,
      ],
    });
  } catch {}

  // Ensure initial visual & hardware zoom is 1.0x
  if (typeof document !== "undefined") {
    const videoElem = document.querySelector(
      `#${containerId} video`
    ) as HTMLVideoElement | null;
    if (videoElem) {
      videoElem.style.transform = "scale(1)";
    }
  }
  try {
    const zoomCap = scanner.getRunningTrackCameraCapabilities()?.zoomFeature?.();
    if (zoomCap && zoomCap.isSupported()) {
      const targetZoom = Math.max(
        zoomCap.min(),
        Math.min(1.0, zoomCap.max())
      );
      await zoomCap.apply(targetZoom);
    }
  } catch {}

  const resolvedActiveId =
    cameraIdToUse ??
    trackInfo.deviceId ??
    (trackInfo.label
      ? freshDevices.find((d) => d.label === trackInfo.label)?.id ?? null
      : null) ??
    selectBestRear1xCamera(freshDevices)?.id ??
    freshDevices[0]?.id ??
    null;

  return {
    cameras: freshDevices,
    activeCameraId: resolvedActiveId,
  };
}
