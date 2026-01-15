"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Briefcase, Calendar, ChevronLeft, User, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { impactLight } from "@/services/haptics";
import { useNetwork } from "@/hooks/use-network";
import { usePullToRefresh } from "@/hooks/use-pull-to-refresh";
import {
  companyMobileNav,
  platformMobileNav,
  type NavItem,
} from "@/components/layout/admin-nav";

interface MobileAppShellProps {
  children: ReactNode;
  title?: string;
  showBackButton?: boolean;
  onBack?: () => void;
  headerActions?: ReactNode;
  onRefresh?: () => Promise<void> | void;
  variant?: "inspector" | "admin";
  user?: {
    name: string;
    email: string;
    avatarUrl?: string;
    companyName?: string;
  };
}

const navItems = [
  { href: "/inspector/schedule", icon: Calendar, label: "Schedule" },
  { href: "/inspector/jobs", icon: Briefcase, label: "Jobs" },
  { href: "/inspector/profile", icon: User, label: "Profile" },
];

export function MobileAppShell({
  children,
  title = "InspectOS",
  showBackButton = false,
  onBack,
  headerActions,
  onRefresh,
  variant,
  user,
}: MobileAppShellProps) {
  const pathname = usePathname();
  const { isOnline } = useNetwork();
  const { handlers, isRefreshing } = usePullToRefresh({
    onRefresh: onRefresh ?? (() => Promise.resolve()),
  });
  const isAdminRoute =
    variant === "admin" ||
    (variant !== "inspector" &&
      (pathname.startsWith("/admin") || pathname.startsWith("/platform")));
  const isPlatformAdmin = isAdminRoute && pathname.startsWith("/platform");
  const mobileNav: NavItem[] = isAdminRoute
    ? isPlatformAdmin
      ? platformMobileNav
      : companyMobileNav
    : navItems;
  const navColumns = Math.max(1, mobileNav.length);

  const handleNavClick = () => {
    impactLight();
  };

  const handleBackClick = () => {
    impactLight();
    onBack?.();
  };

  return (
    <div
      className="fixed inset-0 flex h-dvh flex-col overflow-hidden bg-background safe-area-inset-left safe-area-inset-right"
      style={{ overscrollBehaviorY: "none", overscrollBehaviorX: "none" }}
    >
      <header className="flex h-14 items-center justify-between border-b border-white/10 bg-slate-900/95 text-white backdrop-blur px-4 safe-area-inset-top z-20">
        <div className="flex items-center gap-2 text-white">
          {showBackButton ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBackClick}
              className="h-9 w-9 text-white hover:bg-white/10"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
          ) : null}
          <h1 className="text-base font-semibold">{title}</h1>
        </div>
        <div className="flex items-center gap-2 text-white">{headerActions}</div>
      </header>
      {!isOnline ? (
        <div className="flex items-center justify-center gap-2 border-b bg-amber-50 px-4 py-2 text-xs text-amber-700">
          <WifiOff className="h-3.5 w-3.5" />
          Offline mode: changes will sync when you reconnect.
        </div>
      ) : null}

      <main
        className={cn("flex-1 overflow-y-auto h-full", isAdminRoute && "pb-20")}
        {...handlers}
        style={{ WebkitOverflowScrolling: "touch", overscrollBehaviorY: "contain", overscrollBehaviorX: "none" }}
      >
        {isRefreshing && (
          <div className="flex items-center justify-center py-2 text-xs text-muted-foreground">
            Pulling to refresh...
          </div>
        )}
        {isAdminRoute ? <div className="px-4 py-6">{children}</div> : children}
      </main>

      <nav className="border-t bg-background safe-area-inset-bottom">
        <div
          className="grid gap-1 px-2 py-2"
          style={{ gridTemplateColumns: `repeat(${navColumns}, minmax(0, 1fr))` }}
        >
          {mobileNav.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={handleNavClick}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 px-2 py-2 text-xs font-medium",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
