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
 * - AppShell: Adaptive app UI for /admin, /platform, /inspector
 * - PublicShell: Website experience
 * - BookingShell: Client-facing booking flow
 * - ReportShell: Client-facing reports
 * - AuthShell: Authentication pages
 *
 * No device blocking needed - the app is fully responsive.
 */
export function DeviceGate({ children }: DeviceGateProps) {
  // Simply render children - no device restrictions
  // Role-based shells handle UI adaptation
  return <>{children}</>;
}
