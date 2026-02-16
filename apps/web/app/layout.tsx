import type { Metadata, Viewport } from "next";
import { Outfit } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { ReactQueryProvider } from "@/components/providers/query-provider";
import { TenantProvider } from "@/lib/api/tenant-context";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "InspectOS - Home Inspection Software",
  description: "Enterprise-grade SaaS platform for home inspection businesses",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-icon.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#09090b",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // TODO: In a multi-tenant scenario, this should come from:
  // - URL subdomain (e.g., acme.inspectos.com)
  // - URL path parameter (e.g., /tenants/acme/...)
  // - User session after authentication
  // For now, use environment variable as the tenant identifier
  const tenantSlug = process.env.NEXT_PUBLIC_TENANT_SLUG || "acme-inspections";

  return (
    <html lang="en" suppressHydrationWarning className={outfit.variable}>
      <body
        className="antialiased overflow-x-hidden bg-background text-foreground"
        style={{ overscrollBehaviorY: "auto" }}
        suppressHydrationWarning
      >
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
          <TenantProvider tenantSlug={tenantSlug}>
            <ReactQueryProvider>
              {children}
              <Toaster />
            </ReactQueryProvider>
          </TenantProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
