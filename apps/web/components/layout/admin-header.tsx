"use client";

import { ReactNode } from "react";
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
  onOpenMobileNav,
  onOpenCommand,
  onOpenNotifications,
}: AdminHeaderProps) {
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
        <h1 className="text-lg font-semibold">{title}</h1>
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
