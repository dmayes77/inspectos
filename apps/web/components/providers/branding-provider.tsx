"use client";

import { useEffect, useRef } from "react";
import { useSettings } from "@/hooks/use-settings";

function hexToOklch(hex: string): string | null {
  // Remove # if present
  hex = hex.replace(/^#/, "");

  // Parse hex to RGB
  let r: number, g: number, b: number;
  if (hex.length === 3) {
    r = parseInt(hex[0] + hex[0], 16) / 255;
    g = parseInt(hex[1] + hex[1], 16) / 255;
    b = parseInt(hex[2] + hex[2], 16) / 255;
  } else if (hex.length === 6) {
    r = parseInt(hex.slice(0, 2), 16) / 255;
    g = parseInt(hex.slice(2, 4), 16) / 255;
    b = parseInt(hex.slice(4, 6), 16) / 255;
  } else {
    return null;
  }

  // Convert RGB to linear RGB
  const toLinear = (c: number) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  const lr = toLinear(r);
  const lg = toLinear(g);
  const lb = toLinear(b);

  // Convert linear RGB to XYZ (D65)
  const x = 0.4124564 * lr + 0.3575761 * lg + 0.1804375 * lb;
  const y = 0.2126729 * lr + 0.7151522 * lg + 0.0721750 * lb;
  const z = 0.0193339 * lr + 0.1191920 * lg + 0.9503041 * lb;

  // Convert XYZ to OKLab
  const l_ = Math.cbrt(0.8189330101 * x + 0.3618667424 * y - 0.1288597137 * z);
  const m_ = Math.cbrt(0.0329845436 * x + 0.9293118715 * y + 0.0361456387 * z);
  const s_ = Math.cbrt(0.0482003018 * x + 0.2643662691 * y + 0.6338517070 * z);

  const L = 0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_;
  const a = 1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_;
  const bVal = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_;

  // Convert OKLab to OKLCH
  const C = Math.sqrt(a * a + bVal * bVal);
  let H = Math.atan2(bVal, a) * (180 / Math.PI);
  if (H < 0) H += 360;

  return `oklch(${L.toFixed(3)} ${C.toFixed(3)} ${H.toFixed(0)})`;
}

function generateColorVariants(hex: string) {
  // Remove # if present
  hex = hex.replace(/^#/, "");

  // Parse to RGB
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);

  // Calculate relative luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  // Determine if color is light or dark
  const isLight = luminance > 0.5;

  // Generate foreground color (white for dark colors, dark for light colors)
  const foreground = isLight ? "oklch(0.2 0 0)" : "oklch(1 0 0)";

  // Generate lighter variant for accent/hover (mix with white)
  const accentR = Math.round(r + (255 - r) * 0.85);
  const accentG = Math.round(g + (255 - g) * 0.85);
  const accentB = Math.round(b + (255 - b) * 0.85);
  const accentHex = `#${accentR.toString(16).padStart(2, "0")}${accentG.toString(16).padStart(2, "0")}${accentB.toString(16).padStart(2, "0")}`;

  // Generate darker variant for accent foreground
  const darkR = Math.round(r * 0.3);
  const darkG = Math.round(g * 0.3);
  const darkB = Math.round(b * 0.3);
  const darkHex = `#${darkR.toString(16).padStart(2, "0")}${darkG.toString(16).padStart(2, "0")}${darkB.toString(16).padStart(2, "0")}`;

  return {
    primary: hexToOklch(`#${hex}`) || `#${hex}`,
    primaryForeground: foreground,
    accent: hexToOklch(accentHex) || accentHex,
    accentForeground: hexToOklch(darkHex) || darkHex,
    ring: hexToOklch(`#${hex}`) || `#${hex}`,
    brand: hexToOklch(`#${hex}`) || `#${hex}`,
  };
}

export function BrandingProvider({ children }: { children: React.ReactNode }) {
  const { data: settings } = useSettings();
  const lastLogoRef = useRef<string | null>(null);
  const faviconVersionRef = useRef(0);

  useEffect(() => {
    if (!settings?.branding?.primaryColor) return;

    const color = settings.branding.primaryColor;

    // Validate hex color
    if (!/^#[0-9A-Fa-f]{6}$/.test(color)) return;

    const variants = generateColorVariants(color);

    // Apply CSS custom properties to document root
    const root = document.documentElement;
    root.style.setProperty("--primary", variants.primary);
    root.style.setProperty("--primary-foreground", variants.primaryForeground);
    root.style.setProperty("--accent", variants.accent);
    root.style.setProperty("--accent-foreground", variants.accentForeground);
    root.style.setProperty("--ring", variants.ring);
    root.style.setProperty("--brand", variants.brand);
    root.style.setProperty("--brand-foreground", variants.primaryForeground);
    root.style.setProperty("--sidebar-primary", variants.primary);
    root.style.setProperty("--sidebar-primary-foreground", variants.primaryForeground);
    root.style.setProperty("--sidebar-accent", variants.accent);
    root.style.setProperty("--sidebar-accent-foreground", variants.accentForeground);
    root.style.setProperty("--sidebar-ring", variants.ring);

    // Cleanup on unmount
    return () => {
      root.style.removeProperty("--primary");
      root.style.removeProperty("--primary-foreground");
      root.style.removeProperty("--accent");
      root.style.removeProperty("--accent-foreground");
      root.style.removeProperty("--ring");
      root.style.removeProperty("--brand");
      root.style.removeProperty("--brand-foreground");
      root.style.removeProperty("--sidebar-primary");
      root.style.removeProperty("--sidebar-primary-foreground");
      root.style.removeProperty("--sidebar-accent");
      root.style.removeProperty("--sidebar-accent-foreground");
      root.style.removeProperty("--sidebar-ring");
    };
  }, [settings?.branding?.primaryColor]);

  useEffect(() => {
    const companyName = settings?.company?.name?.trim();
    document.title = companyName ? `${companyName} Dashboard` : "InspectOS Dashboard";

    const logoUrl = settings?.branding?.logoUrl || null;
    if (logoUrl !== lastLogoRef.current) {
      faviconVersionRef.current += 1;
      lastLogoRef.current = logoUrl;
    }
    const version = faviconVersionRef.current;
    const baseUrl = logoUrl || "/favicon.svg";
    const separator = baseUrl.includes("?") ? "&" : "?";
    const faviconUrl = `${baseUrl}${separator}v=${version}`;

    const inferType = (url: string) => {
      const clean = url.split("?")[0];
      const ext = clean.split(".").pop()?.toLowerCase();
      if (ext === "svg") return "image/svg+xml";
      if (ext === "png") return "image/png";
      if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
      if (ext === "webp") return "image/webp";
      if (ext === "gif") return "image/gif";
      if (ext === "ico") return "image/x-icon";
      return undefined;
    };

    const type = inferType(faviconUrl);
    const iconLinks: Array<{ rel: string; href: string; type?: string; sizes?: string }> = [
      { rel: "icon", href: faviconUrl, type, sizes: type === "image/svg+xml" ? "any" : "32x32" },
      { rel: "shortcut icon", href: faviconUrl, type },
      { rel: "apple-touch-icon", href: faviconUrl, sizes: "180x180" },
    ];

    document
      .querySelectorAll('link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]')
      .forEach((link) => link.remove());

    iconLinks.forEach(({ rel, href, type: linkType, sizes }) => {
      const link = document.createElement("link");
      link.rel = rel;
      link.href = href;
      if (linkType) link.type = linkType;
      if (sizes) link.sizes = sizes;
      document.head.appendChild(link);
    });
  }, [settings?.branding?.logoUrl, settings?.company?.name]);

  return <>{children}</>;
}
