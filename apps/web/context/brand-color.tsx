"use client";

import { useEffect } from "react";
import { useSettings } from "@/hooks/use-settings";

// ─── Palette generation ────────────────────────────────────────────────────
// Converts a hex color to HSL, then generates a full 12-shade brand palette
// matching the structure of TailAdmin's brand-25 → brand-950 scale.

function hexToHsl(hex: string): [number, number, number] {
  const c = hex.replace("#", "");
  const r = parseInt(c.slice(0, 2), 16) / 255;
  const g = parseInt(c.slice(2, 4), 16) / 255;
  const b = parseInt(c.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l * 100];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  switch (max) {
    case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
    case g: h = ((b - r) / d + 2) / 6; break;
    case b: h = ((r - g) / d + 4) / 6; break;
  }
  return [h * 360, s * 100, l * 100];
}

function hslToHex(h: number, s: number, l: number): string {
  h /= 360; s /= 100; l /= 100;
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  let r: number, g: number, b: number;
  if (s === 0) {
    r = g = b = l;
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  return (
    "#" +
    [r, g, b]
      .map((x) => Math.round(x * 255).toString(16).padStart(2, "0"))
      .join("")
  );
}

// Shade targets: [shade, lightness%, saturation% relative to input]
// Calibrated to match TailAdmin's blue palette shape (brand-500 ≈ input color).
const SHADE_MAP: Array<[number, number, number]> = [
  [25,  97, 0.15],
  [50,  95, 0.25],
  [100, 90, 0.40],
  [200, 82, 0.60],
  [300, 72, 0.80],
  [400, 62, 0.90],
  [500,  0,  1.0], // base color (l from input, s unchanged)
  [600,  0,  1.0], // slightly darker (handled below)
  [700,  0,  1.0],
  [800,  0,  1.0],
  [900,  0,  1.0],
  [950,  0,  1.0],
];

function generateBrandPalette(hex: string): Record<string, string> {
  if (!/^#[0-9A-Fa-f]{6}$/.test(hex)) return {};
  const [h, s, l] = hexToHsl(hex);

  const palette: Record<string, string> = {};

  // Light shades (25–400): keep hue, reduce saturation, increase lightness
  for (const [shade, targetL, sFactor] of SHADE_MAP.slice(0, 6)) {
    palette[`--color-brand-${shade}`] = hslToHex(h, Math.min(s * sFactor, 100), targetL);
  }

  // Base (500) = input color
  palette["--color-brand-500"] = hex;

  // Dark shades (600–950): keep hue, progressively darken
  const darkSteps: Array<[number, number]> = [
    [600, l * 0.88],
    [700, l * 0.74],
    [800, l * 0.62],
    [900, l * 0.54],
    [950, l * 0.34],
  ];
  for (const [shade, targetL] of darkSteps) {
    palette[`--color-brand-${shade}`] = hslToHex(h, Math.min(s, 100), Math.max(targetL, 5));
  }

  return palette;
}

// ─── Apply helper (exported for real-time preview) ─────────────────────────

export function applyBrandColor(hex: string) {
  if (typeof document === "undefined") return;
  const palette = generateBrandPalette(hex);
  const root = document.documentElement;
  for (const [key, value] of Object.entries(palette)) {
    root.style.setProperty(key, value);
  }
  root.style.setProperty("--primary", hex);
  root.style.setProperty("--brand", hex);
  root.style.setProperty("--ring", hex);
}

// ─── Provider ──────────────────────────────────────────────────────────────

export function BrandColorProvider() {
  const { data: settings } = useSettings();
  const primaryColor = settings?.branding?.primaryColor;

  useEffect(() => {
    if (!primaryColor) return;
    applyBrandColor(primaryColor);
  }, [primaryColor]);

  return null;
}
