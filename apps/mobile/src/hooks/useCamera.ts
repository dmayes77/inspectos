import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Geolocation } from '@capacitor/geolocation';

type CaptureOptions = {
  source: CameraSource;
  withLocation?: boolean;
  quality?: number;
  locationTimeoutMs?: number;
  filePrefix?: string;
};

type CameraCaptureResult = {
  blob: Blob;
  file: File;
  previewUrl: string;
  capturedAt: string;
  latitude?: number;
  longitude?: number;
  accuracyMeters?: number | null;
};

function extensionForMime(mimeType: string): string {
  const clean = mimeType.trim().toLowerCase();
  if (clean === 'image/jpeg' || clean === 'image/jpg') return 'jpg';
  if (clean === 'image/png') return 'png';
  if (clean === 'image/webp') return 'webp';
  if (clean === 'image/heic' || clean === 'image/heif') return 'heic';
  return 'jpg';
}

function fileName(prefix: string, capturedAt: string, mimeType: string): string {
  const stamp = capturedAt.replace(/[-:.]/g, '').replace('T', '-').replace('Z', '');
  return `${prefix}-${stamp}.${extensionForMime(mimeType)}`;
}

export function useCamera() {
  const capture = async (options: CaptureOptions): Promise<CameraCaptureResult> => {
    const {
      source,
      withLocation = false,
      quality = 90,
      locationTimeoutMs = 15000,
      filePrefix = 'capture',
    } = options;

    const photo = await Camera.getPhoto({
      source,
      resultType: CameraResultType.Uri,
      quality,
      saveToGallery: false,
      correctOrientation: true,
    });

    if (!photo.webPath) {
      throw new Error('Could not read captured image.');
    }

    const response = await fetch(photo.webPath);
    if (!response.ok) {
      throw new Error('Could not read captured image.');
    }

    const blob = await response.blob();
    const mimeType = blob.type || 'image/jpeg';
    const capturedAt = new Date().toISOString();
    const file = new File([blob], fileName(filePrefix, capturedAt, mimeType), { type: mimeType });
    const previewUrl = URL.createObjectURL(blob);

    if (!withLocation) {
      return {
        blob,
        file,
        previewUrl,
        capturedAt,
      };
    }

    const geo = await Geolocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: locationTimeoutMs,
    });

    return {
      blob,
      file,
      previewUrl,
      capturedAt,
      latitude: geo.coords.latitude,
      longitude: geo.coords.longitude,
      accuracyMeters: Number.isFinite(geo.coords.accuracy) ? geo.coords.accuracy : null,
    };
  };

  const isCancelError = (error: unknown): boolean =>
    error instanceof Error && /cancel/i.test(error.message);

  return {
    capture,
    isCancelError,
  };
}

export type { CameraCaptureResult, CaptureOptions };
