"use client";

import { useState, useEffect, useCallback } from "react";

export interface ServiceWorkerState {
  isSupported: boolean;
  isRegistered: boolean;
  isInstalling: boolean;
  isWaiting: boolean;
  isActive: boolean;
  registration: ServiceWorkerRegistration | null;
  error: string | null;
}

export function useServiceWorker() {
  const [state, setState] = useState<ServiceWorkerState>({
    isSupported: false,
    isRegistered: false,
    isInstalling: false,
    isWaiting: false,
    isActive: false,
    registration: null,
    error: null,
  });

  const update = useCallback(async () => {
    if (state.registration) {
      await state.registration.update();
    }
  }, [state.registration]);

  const skipWaiting = useCallback(() => {
    if (state.registration?.waiting) {
      state.registration.waiting.postMessage({ type: "SKIP_WAITING" });
    }
  }, [state.registration]);

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    // Skip service worker in development - it breaks HMR
    if (process.env.NODE_ENV === "development") {
      // Unregister any existing service workers in dev
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => registration.unregister());
      });
      return;
    }

    setState((prev) => ({ ...prev, isSupported: true }));

    async function register() {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
        });

        setState((prev) => ({
          ...prev,
          isRegistered: true,
          registration,
          isInstalling: !!registration.installing,
          isWaiting: !!registration.waiting,
          isActive: !!registration.active,
        }));

        // Listen for updates
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (newWorker) {
            setState((prev) => ({ ...prev, isInstalling: true }));

            newWorker.addEventListener("statechange", () => {
              if (newWorker.state === "installed") {
                setState((prev) => ({
                  ...prev,
                  isInstalling: false,
                  isWaiting: true,
                }));
              }
              if (newWorker.state === "activated") {
                setState((prev) => ({
                  ...prev,
                  isWaiting: false,
                  isActive: true,
                }));
              }
            });
          }
        });

        // Listen for controller change (new SW activated)
        navigator.serviceWorker.addEventListener("controllerchange", () => {
          setState((prev) => ({ ...prev, isActive: true, isWaiting: false }));
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to register service worker";
        setState((prev) => ({ ...prev, error: message }));
      }
    }

    register();
  }, []);

  return { ...state, update, skipWaiting };
}

export function ServiceWorkerProvider({ children }: { children: React.ReactNode }) {
  useServiceWorker();
  return <>{children}</>;
}
