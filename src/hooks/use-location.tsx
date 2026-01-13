"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getCurrentLocation,
  watchLocation,
  stopWatchingLocation,
  checkLocationPermissions,
  requestLocationPermissions,
  type LocationResult,
} from "@/services/geolocation";

export interface LocationState {
  location: LocationResult | null;
  error: string | null;
  isLoading: boolean;
  hasPermission: boolean | null;
}

export function useLocation(options?: { watch?: boolean; highAccuracy?: boolean }) {
  const { watch = false, highAccuracy = true } = options ?? {};

  const [state, setState] = useState<LocationState>({
    location: null,
    error: null,
    isLoading: true,
    hasPermission: null,
  });

  const refresh = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    const location = await getCurrentLocation(highAccuracy);
    setState((prev) => ({
      ...prev,
      location,
      isLoading: false,
      error: location ? null : "Failed to get location",
    }));
    return location;
  }, [highAccuracy]);

  useEffect(() => {
    let mounted = true;

    async function init() {
      const hasPermission = await checkLocationPermissions();
      if (!mounted) return;

      setState((prev) => ({ ...prev, hasPermission }));

      if (!hasPermission) {
        const granted = await requestLocationPermissions();
        if (!mounted) return;
        setState((prev) => ({ ...prev, hasPermission: granted }));
        if (!granted) {
          setState((prev) => ({
            ...prev,
            isLoading: false,
            error: "Location permission denied",
          }));
          return;
        }
      }

      if (watch) {
        const started = await watchLocation(
          (location, error) => {
            if (!mounted) return;
            setState((prev) => ({
              ...prev,
              location,
              isLoading: false,
              error: error ?? null,
            }));
          },
          highAccuracy
        );

        if (!started && mounted) {
          setState((prev) => ({
            ...prev,
            isLoading: false,
            error: "Failed to watch location",
          }));
        }
      } else {
        const location = await getCurrentLocation(highAccuracy);
        if (!mounted) return;
        setState((prev) => ({
          ...prev,
          location,
          isLoading: false,
          error: location ? null : "Failed to get location",
        }));
      }
    }

    init();

    return () => {
      mounted = false;
      if (watch) {
        stopWatchingLocation();
      }
    };
  }, [watch, highAccuracy]);

  return { ...state, refresh };
}

export function useCurrentLocation() {
  const { location, isLoading, error, refresh } = useLocation({ watch: false });
  return {
    coords: location?.coords ?? null,
    timestamp: location?.timestamp ?? null,
    isLoading,
    error,
    refresh,
  };
}

export function useWatchLocation() {
  return useLocation({ watch: true });
}
