"use client";

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { StatusBar, Style } from "@capacitor/status-bar";
import { SplashScreen } from "@capacitor/splash-screen";
import { Keyboard } from "@capacitor/keyboard";
import { App } from "@capacitor/app";

export function NativeAppInit() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    async function initializeNativeApp() {
      try {
        // Configure status bar for dark theme
        await StatusBar.setStyle({ style: Style.Light });
        await StatusBar.setBackgroundColor({ color: "#09090b" });

        // Configure keyboard behavior
        if (Capacitor.getPlatform() === "ios") {
          await Keyboard.setAccessoryBarVisible({ isVisible: true });
          await Keyboard.setScroll({ isDisabled: false });
        }

        // Small delay to ensure app is ready, then hide splash
        await new Promise((resolve) => setTimeout(resolve, 300));
        await SplashScreen.hide({ fadeOutDuration: 300 });
      } catch (error) {
        // Silently fail - some features may not be available
        console.warn("Native init warning:", error);
        // Still try to hide splash screen
        try {
          await SplashScreen.hide();
        } catch {
          // Ignore
        }
      }
    }

    initializeNativeApp();

    // Handle Android back button
    let backButtonHandler: (() => void) | null = null;
    if (Capacitor.getPlatform() === "android") {
      App.addListener("backButton", ({ canGoBack }) => {
        if (canGoBack) {
          window.history.back();
        } else {
          App.exitApp();
        }
      }).then((handle) => {
        backButtonHandler = () => handle.remove();
      });
    }

    return () => {
      if (backButtonHandler) backButtonHandler();
    };
  }, []);

  return null;
}
