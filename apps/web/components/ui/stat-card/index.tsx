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
}

export function StatCard({ label, value, icon: Icon, trend, trendLabel, sublabel, className }: StatCardProps) {
  const hasTrend = trend !== undefined && trend !== null;
  const isPositive = hasTrend && trend >= 0;
  const badgeText = trendLabel ?? (hasTrend ? `${isPositive ? "+" : ""}${trend}%` : undefined);

  return (
    <div className={cn("rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/3 md:p-6", className)}>
      {Icon && (
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
          <Icon className="text-gray-800 size-6 dark:text-white/90" />
        </div>
      )}
      <div className={cn("flex items-end justify-between", Icon ? "mt-5" : "")}>
        <div>
          <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
          <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">{value}</h4>
          {sublabel && (
            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">{sublabel}</p>
          )}
        </div>
        {badgeText && (
          <div
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium shrink-0",
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
