import type { LucideIcon } from "lucide-react";
import { ArrowUpIcon, ArrowDownIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  /** Number shown in trend badge (positive = up, negative = down). */
  trend?: number | null;
  /** Custom text for the trend badge (e.g. "+11%"). Overrides auto-format from `trend`. */
  trendLabel?: string;
  /** Small context text below the value (e.g. "vs last week"). */
  sublabel?: string;
  className?: string;
  density?: "default" | "dense";
}

export function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  trendLabel,
  sublabel,
  className,
  density = "default",
}: StatCardProps) {
  const hasTrend = trend !== undefined && trend !== null;
  const isPositive = hasTrend && trend >= 0;
  const badgeText = trendLabel ?? (hasTrend ? `${isPositive ? "+" : ""}${trend}%` : undefined);
  const isDense = density === "dense";

  return (
    <div
      className={cn(
        "border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/3",
        isDense ? "rounded-md p-3 md:p-3.5" : "rounded-md p-5 md:p-6",
        className
      )}
    >
      {Icon && (
        <div
          className={cn(
            "flex items-center justify-center bg-gray-100 dark:bg-gray-800",
            isDense ? "h-8 w-8 rounded-md" : "h-12 w-12 rounded-md"
          )}
        >
          <Icon className={cn("text-gray-800 dark:text-white/90", isDense ? "size-4" : "size-6")} />
        </div>
      )}
      <div className={cn("flex items-end justify-between", Icon ? (isDense ? "mt-2" : "mt-5") : "")}>
        <div>
          <span className={cn("text-gray-500 dark:text-gray-400", isDense ? "text-xs" : "text-sm")}>{label}</span>
          <h4 className={cn("font-bold text-gray-800 dark:text-white/90", isDense ? "mt-1 text-base" : "mt-2 text-title-sm")}>
            {value}
          </h4>
          {sublabel && (
            <p className={cn("text-gray-400 dark:text-gray-500", isDense ? "mt-0.5 text-[11px]" : "mt-1 text-xs")}>{sublabel}</p>
          )}
        </div>
        {badgeText && (
          <div
            className={cn(
              "inline-flex items-center gap-1 rounded-md font-medium shrink-0",
              isDense ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-0.5 text-xs",
              isPositive
                ? "bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500"
                : "bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-500"
            )}
          >
            {isPositive ? <ArrowUpIcon className="size-3" /> : <ArrowDownIcon className="size-3" />}
            {badgeText}
          </div>
        )}
      </div>
    </div>
  );
}
