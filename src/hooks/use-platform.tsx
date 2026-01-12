"use client";

import { useState, useEffect, useMemo } from "react";
import { Capacitor } from "@capacitor/core";

export type Platform = "ios" | "android" | "web";

export interface PlatformInfo {
  platform: Platform;
  isNative: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isWeb: boolean;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isPWA: boolean;
}

function getPlatform(): Platform {
  const platform = Capacitor.getPlatform();
  if (platform === "ios") return "ios";
  if (platform === "android") return "android";
  return "web";
}

function isNativePlatform(): boolean {
  return Capacitor.isNativePlatform();
}

function isPWA(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function isMobileDevice(): boolean {
  if (typeof window === "undefined") return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

function isTabletDevice(): boolean {
  if (typeof window === "undefined") return false;
  const userAgent = navigator.userAgent.toLowerCase();
  return /(ipad|tablet|playbook|silk)|(android(?!.*mobile))/i.test(userAgent);
}

export function usePlatform(): PlatformInfo {
  const [platformInfo, setPlatformInfo] = useState<PlatformInfo>(() => {
    const platform = getPlatform();
    const isNative = isNativePlatform();

    return {
      platform,
      isNative,
      isIOS: platform === "ios",
      isAndroid: platform === "android",
      isWeb: platform === "web",
      isMobile: isNative || isMobileDevice(),
      isTablet: isTabletDevice(),
      isDesktop: !isNative && !isMobileDevice() && !isTabletDevice(),
      isPWA: isPWA(),
    };
  });

  useEffect(() => {
    // Re-evaluate on mount (client-side)
    const platform = getPlatform();
    const isNative = isNativePlatform();

    setPlatformInfo({
      platform,
      isNative,
      isIOS: platform === "ios",
      isAndroid: platform === "android",
      isWeb: platform === "web",
      isMobile: isNative || isMobileDevice(),
      isTablet: isTabletDevice(),
      isDesktop: !isNative && !isMobileDevice() && !isTabletDevice(),
      isPWA: isPWA(),
    });
  }, []);

  return platformInfo;
}

export function useIsNative(): boolean {
  return usePlatform().isNative;
}

export function useIsMobile(): boolean {
  return usePlatform().isMobile;
}
