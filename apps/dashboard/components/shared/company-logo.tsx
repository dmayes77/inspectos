"use client";

import { useMemo, useState } from "react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { logoDevUrl, type LogoFormat, type LogoTheme } from "@inspectos/shared/utils/logos";

const DEFAULT_FORMATS: LogoFormat[] = ["webp", "png", "jpg"];
type LogoSource = { format: LogoFormat | "custom"; url: string };

export type CompanyLogoProps = {
  name: string;
  logoUrl?: string | null;
  domain?: string | null;
  website?: string | null;
  size?: number;
  className?: string;
  lazy?: boolean;
  formats?: LogoFormat[];
  theme?: LogoTheme | "auto";
};

const initialsFor = (value: string) =>
  value
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 2) || "AG";

export function CompanyLogo({
  name,
  logoUrl,
  domain,
  website,
  size = 40,
  className,
  lazy = true,
  formats = DEFAULT_FORMATS,
  theme = "auto",
}: CompanyLogoProps) {
  const { resolvedTheme } = useTheme();
  const [hasError, setHasError] = useState(false);
  const targetTheme: LogoTheme = theme === "auto" ? (resolvedTheme === "dark" ? "dark" : "light") : theme;

  const sources = useMemo<LogoSource[]>(() => {
    if (logoUrl?.trim()) {
      return [{ format: "custom" as const, url: logoUrl.trim() }];
    }

    return formats.reduce<LogoSource[]>((acc, format) => {
      const url = logoDevUrl(domain ?? website ?? null, { size, format, theme: targetTheme });
      if (url) {
        acc.push({ format, url });
      }
      return acc;
    }, []);
  }, [logoUrl, formats, domain, website, size, targetTheme]);

  const initials = useMemo(() => initialsFor(name), [name]);
  const shouldShowFallback = hasError || sources.length === 0;

  if (shouldShowFallback) {
    return (
      <div
        className={cn("flex items-center justify-center rounded-md bg-muted text-xs font-semibold uppercase text-muted-foreground", className)}
        style={{ width: size, height: size }}
        aria-label={`${name} logo placeholder`}
      >
        {initials}
      </div>
    );
  }

  const baseSource = sources[sources.length - 1];
  const pictureSources = sources.filter((source): source is { format: LogoFormat; url: string } => source.format !== "custom");

  return (
    <div className={cn("relative overflow-hidden rounded-md", className)} style={{ width: size, height: size }}>
      <picture>
        {pictureSources.map((source) => (
          <source key={source.format} srcSet={source.url} type={`image/${source.format === "jpg" ? "jpeg" : source.format}`} />
        ))}
        <img
          src={baseSource.url}
          alt={`${name} logo`}
          width={size}
          height={size}
          loading={lazy ? "lazy" : "eager"}
          className="h-full w-full object-cover"
          onError={() => setHasError(true)}
        />
      </picture>
    </div>
  );
}
