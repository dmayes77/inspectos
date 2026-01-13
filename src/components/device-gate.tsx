"use client";

import { ReactNode } from "react";

interface DeviceGateProps {
  children: ReactNode;
}

/**
 * DeviceGate - Unified device support component
 *
 * With the unified Capacitor architecture, we support all device sizes:
 * - Native iOS/Android app (phones and tablets)
 * - Web browsers (desktop, tablet, mobile)
 *
 * UI adaptation is handled by pattern-based shells:
 * - AppShell: Mobile-first, touch-optimized
 * - AdminShell: Desktop-dense, responsive (works on tablets too)
 * - PublicShell: Website experience
 * - BookingShell: Client-facing booking flow
 * - AuthShell: Authentication pages
 *
 * No device blocking needed - the app is fully responsive.
 */
export function DeviceGate({ children }: DeviceGateProps) {
  // Simply render children - no device restrictions
  // Role-based shells handle UI adaptation
  return <>{children}</>;
}
