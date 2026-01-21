import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

export interface CapturedPhoto {
  base64: string;
  format: string;
  path?: string;
}

export async function capturePhoto(): Promise<CapturedPhoto | null> {
  try {
    const image = await Camera.getPhoto({
      quality: 80,
      allowEditing: false,
      resultType: CameraResultType.Base64,
      source: CameraSource.Camera,
      correctOrientation: true,
    });

    if (!image.base64String) return null;

    return {
      base64: image.base64String,
      format: image.format,
      path: image.path,
    };
  } catch (error) {
    console.error('[Camera] capture failed:', error);
    return null;
  }
}

export async function pickFromGallery(): Promise<CapturedPhoto | null> {
  try {
    const image = await Camera.getPhoto({
      quality: 80,
      allowEditing: false,
      resultType: CameraResultType.Base64,
      source: CameraSource.Photos,
    });

    if (!image.base64String) return null;

    return {
      base64: image.base64String,
      format: image.format,
      path: image.path,
    };
  } catch (error) {
    console.error('[Camera] pick failed:', error);
    return null;
  }
}

export async function checkCameraPermissions(): Promise<boolean> {
  const status = await Camera.checkPermissions();
  return status.camera === 'granted' || status.camera === 'limited';
}

export async function requestCameraPermissions(): Promise<boolean> {
  const status = await Camera.requestPermissions();
  return status.camera === 'granted' || status.camera === 'limited';
}
