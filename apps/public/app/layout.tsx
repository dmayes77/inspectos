import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { PublicShell } from "@/layout/public-shell";
import "./globals.css";

export const metadata: Metadata = {
  title: "InspectOS",
  description: "InspectOS public website",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icon.svg", type: "image/svg+xml" }
    ],
    apple: "/apple-icon.svg"
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased overflow-x-hidden bg-background text-foreground" suppressHydrationWarning>
        <PublicShell fullWidth>{children}</PublicShell>
      </body>
    </html>
  );
}
