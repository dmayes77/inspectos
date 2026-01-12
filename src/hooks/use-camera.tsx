"use client";

import { useState, useCallback } from "react";
import {
  capturePhoto,
  pickFromGallery,
  checkCameraPermissions,
  requestCameraPermissions,
  type CapturedPhoto,
} from "@/services/camera";

export interface CameraState {
  photo: CapturedPhoto | null;
  isCapturing: boolean;
  error: string | null;
}

export function useCamera() {
  const [state, setState] = useState<CameraState>({
    photo: null,
    isCapturing: false,
    error: null,
  });

  const capture = useCallback(async (): Promise<CapturedPhoto | null> => {
    setState((prev) => ({ ...prev, isCapturing: true, error: null }));

    try {
      const hasPermission = await checkCameraPermissions();
      if (!hasPermission) {
        const granted = await requestCameraPermissions();
        if (!granted) {
          setState((prev) => ({
            ...prev,
            isCapturing: false,
            error: "Camera permission denied",
          }));
          return null;
        }
      }

      const photo = await capturePhoto();
      setState((prev) => ({
        ...prev,
        photo,
        isCapturing: false,
        error: photo ? null : "Failed to capture photo",
      }));
      return photo;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Camera error";
      setState((prev) => ({ ...prev, isCapturing: false, error: message }));
      return null;
    }
  }, []);

  const pickFromLibrary = useCallback(async (): Promise<CapturedPhoto | null> => {
    setState((prev) => ({ ...prev, isCapturing: true, error: null }));

    try {
      const photo = await pickFromGallery();
      setState((prev) => ({
        ...prev,
        photo,
        isCapturing: false,
        error: photo ? null : "Failed to pick photo",
      }));
      return photo;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gallery error";
      setState((prev) => ({ ...prev, isCapturing: false, error: message }));
      return null;
    }
  }, []);

  const clear = useCallback(() => {
    setState({ photo: null, isCapturing: false, error: null });
  }, []);

  return {
    ...state,
    capture,
    pickFromLibrary,
    clear,
  };
}

export function usePhotoCapture() {
  const { photo, isCapturing, error, capture, pickFromLibrary, clear } = useCamera();

  return {
    photo,
    isCapturing,
    error,
    takePhoto: capture,
    selectPhoto: pickFromLibrary,
    clearPhoto: clear,
    hasPhoto: photo !== null,
    photoBase64: photo?.base64 ?? null,
  };
}
