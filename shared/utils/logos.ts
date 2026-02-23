const LOGO_DEV_BASE = "https://img.logo.dev";
const LOGO_DEV_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_LOGO_DEV_KEY ??
  process.env.LOGO_DEV_PUBLIC_KEY ??
  process.env.NEXT_PUBLIC_LOGO_DEV_PUBLISHABLE_KEY ??
  process.env.LOGO_DEV_PUBLISHABLE_KEY ??
  "";

export type LogoFormat = "webp" | "png" | "jpg";
export type LogoTheme = "light" | "dark";

export type LogoOptions = {
  size?: number;
  format?: LogoFormat;
  theme?: LogoTheme;
  retina?: boolean;
};

const ensureProtocol = (value: string) => (value.startsWith("http://") || value.startsWith("https://") ? value : `https://${value}`);

export function extractDomain(input?: string | null): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  if (!trimmed) return null;

  try {
    const url = new URL(ensureProtocol(trimmed));
    return url.hostname.toLowerCase();
  } catch (error) {
    const stripped = trimmed
      .replace(/^https?:\/\//i, "")
      .split("/")[0]
      ?.toLowerCase();
    return stripped || null;
  }
}

export function logoDevUrl(input?: string | null, options: LogoOptions = {}): string | null {
  const domain = extractDomain(input);
  if (!domain) return null;

  const size = Number.isFinite(options.size) && options.size ? Math.min(Math.max(options.size, 16), 640) : 160;
  const format: LogoFormat = options.format ?? "webp";
  const theme: LogoTheme = options.theme ?? "light";
  const retina = options.retina ?? true;

  const params = new URLSearchParams({ size: size.toString(), format, theme });
  params.set("retina", retina ? "true" : "false");
  if (LOGO_DEV_PUBLISHABLE_KEY) {
    params.set("token", LOGO_DEV_PUBLISHABLE_KEY);
  }

  return `${LOGO_DEV_BASE}/${domain}?${params.toString()}`;
}

export function resolveLogoUrl(
  params: {
    logoUrl?: string | null;
    domain?: string | null;
    website?: string | null;
  },
  options?: LogoOptions,
): string | null {
  if (params.logoUrl?.trim()) return params.logoUrl.trim();
  return logoDevUrl(params.domain ?? params.website ?? null, options);
}
