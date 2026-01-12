"use client";

import { useEffect, useState, ReactNode } from "react";
import { Capacitor } from "@capacitor/core";
import { Tablet, Monitor, Shield } from "lucide-react";

interface DeviceGateProps {
  children: ReactNode;
}

const MIN_WIDTH = 810; // iPad 10.2" portrait minimum

export function DeviceGate({ children }: DeviceGateProps) {
  const [isSupported, setIsSupported] = useState<boolean | null>(null);

  useEffect(() => {
    // Always allow native Capacitor app (iPad)
    if (Capacitor.isNativePlatform()) {
      setIsSupported(true);
      return;
    }

    // Check screen width
    const checkWidth = () => {
      setIsSupported(window.innerWidth >= MIN_WIDTH);
    };

    checkWidth();
    window.addEventListener("resize", checkWidth);
    return () => window.removeEventListener("resize", checkWidth);
  }, []);

  // Still checking - render nothing to prevent flash
  if (isSupported === null) {
    return null;
  }

  // Device not supported - show friendly message
  if (!isSupported) {
    return <UnsupportedDeviceMessage />;
  }

  // Device supported - render app
  return <>{children}</>;
}

function UnsupportedDeviceMessage() {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-background p-8 text-center">
      <div className="max-w-md">
        {/* Logo */}
        <div className="mb-8 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary">
            <Shield className="h-8 w-8 text-primary-foreground" />
          </div>
        </div>

        <h1 className="mb-4 text-2xl font-semibold tracking-tight">
          InspectOS works best on larger screens
        </h1>

        <p className="mb-8 text-muted-foreground">
          For the best inspection experience, please use InspectOS on an iPad or desktop computer.
        </p>

        {/* Device options */}
        <div className="space-y-4">
          <div className="flex items-center gap-4 rounded-xl border bg-card p-4 text-left">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Tablet className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="font-medium">iPad App</p>
              <p className="text-sm text-muted-foreground">
                Optimized for field inspections with Apple Pencil support
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-xl border bg-card p-4 text-left">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Monitor className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium">Desktop Browser</p>
              <p className="text-sm text-muted-foreground">
                Full admin dashboard and office management
              </p>
            </div>
          </div>
        </div>

        {/* App Store link placeholder */}
        <p className="mt-8 text-sm text-muted-foreground">
          Download the iPad app from the App Store or visit on a desktop browser.
        </p>
      </div>
    </div>
  );
}
