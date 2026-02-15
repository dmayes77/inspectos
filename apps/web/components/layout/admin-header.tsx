"use client";

import { ReactNode } from "react";
import { Bell, ChevronLeft, ChevronRight, Menu, Search } from "lucide-react";
import Link from "next/link";
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
  breadcrumbs?: { label: string; href: string }[];
  onOpenMobileNav: () => void;
  onOpenCommand: () => void;
  onOpenNotifications: () => void;
}

export function AdminHeader({
  showBackButton = false,
  onBack,
  headerActions,
  user,
  contextLabel,
  settingsHref,
  breadcrumbs = [],
  onOpenMobileNav,
  onOpenCommand,
  onOpenNotifications,
}: AdminHeaderProps) {
  return (
    <header className="flex h-12 shrink-0 items-center justify-between border-b bg-background px-4 md:px-5 gap-4">
      <div className="flex items-center gap-2 min-w-0">
        <Button variant="ghost" size="icon" className="md:hidden h-8 w-8 shrink-0" onClick={onOpenMobileNav}>
          <Menu className="h-4 w-4" />
        </Button>
        {showBackButton && (
          <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0 h-8 w-8">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}
        {breadcrumbs.length > 0 && (
          <nav className="hidden md:flex items-center gap-1 min-w-0">
            {breadcrumbs.map((crumb, i) => {
              const isLast = i === breadcrumbs.length - 1;
              return (
                <span key={crumb.href} className="flex items-center gap-1 min-w-0">
                  {i > 0 && <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground/40" />}
                  {isLast ? (
                    <span className="text-xs font-medium text-foreground truncate">{crumb.label}</span>
                  ) : (
                    <Link
                      href={crumb.href}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors truncate"
                    >
                      {crumb.label}
                    </Link>
                  )}
                </span>
              );
            })}
          </nav>
        )}
      </div>

      <div className="flex items-center gap-2">
        {headerActions}

        {/* Search trigger */}
        <button
          type="button"
          onClick={onOpenCommand}
          className="hidden md:flex h-8 w-56 items-center gap-2 rounded-md border border-border/60 bg-muted/40 px-3 text-xs text-muted-foreground hover:bg-muted hover:border-border transition-colors"
        >
          <Search className="h-3.5 w-3.5 shrink-0" />
          <span className="flex-1 text-left">Search...</span>
          <kbd className="pointer-events-none inline-flex h-4 select-none items-center gap-0.5 rounded border bg-background px-1 font-mono text-[10px] text-muted-foreground/60">
            ⌘K
          </kbd>
        </button>

        {/* Notifications */}
        <button
          type="button"
          onClick={onOpenNotifications}
          className="relative h-8 w-8 flex items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-destructive" />
        </button>

        <AdminUserMenu user={user} contextLabel={contextLabel} settingsHref={settingsHref} />
      </div>
    </header>
  );
}
