"use client";

import { useEffect } from "react";
import { useServiceWorker } from "@/hooks/use-service-worker";
import { hideSplashScreen, setStatusBarStyle } from "@/services/app-state";
import { Capacitor } from "@capacitor/core";

export function PWAInitializer() {
  const { isWaiting, skipWaiting } = useServiceWorker();

  useEffect(() => {
    // Initialize native app features
    async function initNative() {
      if (Capacitor.isNativePlatform()) {
        // Hide splash screen after app is ready
        await hideSplashScreen();

        // Set status bar style based on theme
        const isDark =
          window.matchMedia &&
          window.matchMedia("(prefers-color-scheme: dark)").matches;
        await setStatusBarStyle(isDark ? "light" : "dark");
      }
    }

    initNative();
  }, []);

  // Prompt user to reload when new version is available
  useEffect(() => {
    if (isWaiting) {
      // You can show a toast or banner here
      const shouldUpdate = window.confirm(
        "A new version of InspectOS is available. Reload to update?"
      );
      if (shouldUpdate) {
        skipWaiting();
        window.location.reload();
      }
    }
  }, [isWaiting, skipWaiting]);

  return null;
}
