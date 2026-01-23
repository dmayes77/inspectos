"use client";

import { ReactNode, useEffect, useMemo, useState } from "react";
import { Bell, ChevronLeft, Menu, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdminUserMenu } from "@/components/layout/admin-user-menu";

interface AdminHeaderProps {
  title: string;
  showBackButton?: boolean;
  onBack?: () => void;
  headerActions?: ReactNode;
  user?: {
    name: string;
    email: string;
    avatarUrl?: string;
  };
  contextLabel?: string;
  settingsHref: string;
  timeZone: string;
  onOpenMobileNav: () => void;
  onOpenCommand: () => void;
  onOpenNotifications: () => void;
}

export function AdminHeader({
  title,
  showBackButton = false,
  onBack,
  headerActions,
  user,
  contextLabel,
  settingsHref,
  timeZone,
  onOpenMobileNav,
  onOpenCommand,
  onOpenNotifications,
}: AdminHeaderProps) {
  const [mounted, setMounted] = useState(false);
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    setMounted(true);
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const timeLabel = useMemo(() => {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone,
      weekday: "long",
      month: "short",
      day: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    const parts = formatter.formatToParts(now);
    const byType = new Map(parts.map((part) => [part.type, part.value]));
    const date = `${byType.get("weekday")} ${byType.get("month")} ${byType.get("day")} ${byType.get("year")}`;
    const time = `${byType.get("hour")}:${byType.get("minute")}:${byType.get("second")} ${byType.get("dayPeriod")}`;
    return `${date} ${time}`;
  }, [now, timeZone]);

  return (
    <header className="flex h-12 items-center justify-between border-b bg-card px-4 md:px-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={onOpenMobileNav}
        >
          <Menu className="h-5 w-5" />
        </Button>
        {showBackButton && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="shrink-0 -ml-2 h-9 w-9"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
        )}
        <h1 className="text-lg font-semibold tabular-nums" suppressHydrationWarning>
          {mounted ? timeLabel : "Loading time..."}
        </h1>
      </div>

      <div className="flex items-center gap-3">
        {headerActions}
        <Button
          variant="outline"
          className="hidden w-64 justify-start gap-2 text-muted-foreground md:flex"
          onClick={onOpenCommand}
        >
          <Search className="h-4 w-4" />
          <span>Search...</span>
          <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
            <span className="text-xs">⌘</span>K
          </kbd>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          onClick={onOpenNotifications}
        >
          <Bell className="h-4 w-4" />
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-destructive" />
        </Button>
        <AdminUserMenu
          user={user}
          contextLabel={contextLabel}
          settingsHref={settingsHref}
        />
      </div>
    </header>
  );
}
