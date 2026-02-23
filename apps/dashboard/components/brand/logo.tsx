import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "full" | "icon";
  theme?: "light" | "dark";
}

const sizes = {
  sm: { icon: "h-6 w-6 text-xs", text: "text-sm" },
  md: { icon: "h-8 w-8 text-sm", text: "text-base" },
  lg: { icon: "h-10 w-10 text-base", text: "text-lg" },
  xl: { icon: "h-12 w-12 text-lg", text: "text-xl" },
};

/**
 * InspectOS Logo Component
 *
 * Usage:
 * <Logo /> - Full logo with text
 * <Logo variant="icon" /> - Icon only
 * <Logo size="lg" /> - Large size
 * <Logo theme="dark" /> - For dark backgrounds
 */
export function Logo({
  className,
  size = "md",
  variant = "full",
  theme = "light",
}: LogoProps) {
  const sizeConfig = sizes[size];

  const iconBg = theme === "dark"
    ? "bg-primary text-primary-foreground"
    : "bg-primary text-primary-foreground";

  const textColor = theme === "dark" ? "text-white" : "text-slate-900";

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Icon Mark */}
      <div
        className={cn(
          "flex items-center justify-center rounded-sm font-bold",
          sizeConfig.icon,
          iconBg
        )}
      >
        IO
      </div>

      {/* Wordmark */}
      {variant === "full" && (
        <span className={cn("font-semibold", sizeConfig.text, textColor)}>
          InspectOS
        </span>
      )}
    </div>
  );
}

/**
 * SVG version of the logo icon for use in favicons, etc.
 */
export function LogoSvg({
  size = 32,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Background rounded-sm rectangle */}
      <rect width="32" height="32" rx="6" fill="#ea580c" />

      {/* IO text */}
      <text
        x="16"
        y="21"
        textAnchor="middle"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontSize="14"
        fontWeight="700"
        fill="white"
      >
        IO
      </text>
    </svg>
  );
}

/**
 * Logo as inline SVG data URL for use in meta tags
 */
export const logoDataUrl = `data:image/svg+xml,${encodeURIComponent(`
<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="32" height="32" rx="6" fill="#ea580c"/>
  <text x="16" y="21" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="700" fill="white">IO</text>
</svg>
`)}`;
