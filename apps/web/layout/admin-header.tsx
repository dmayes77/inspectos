"use client";

import { ReactNode, useState, useEffect, useRef } from "react";
import { AdminUserMenu } from "@/layout/admin-user-menu";
import { ThemeToggleButton } from "@/layout/theme-toggle-button";
import { useSidebar } from "@/context/sidebar-context";
import { cn } from "@/lib/utils";
import { HamburgerIcon, CloseXIcon, DotsMenuIcon, SearchIcon, BellIcon } from "@/components/icons";

interface AdminHeaderProps {
  headerActions?: ReactNode;
  user?: {
    name: string;
    email: string;
    avatarUrl?: string;
  };
  contextLabel?: string;
  settingsHref: string;
  onOpenCommand: () => void;
  onOpenNotifications: () => void;
}

export function AdminHeader({
  headerActions,
  user,
  contextLabel,
  settingsHref,
  onOpenCommand,
  onOpenNotifications,
}: AdminHeaderProps) {
  const { isMobileOpen, toggleSidebar, toggleMobileSidebar } = useSidebar();
  const [isApplicationMenuOpen, setApplicationMenuOpen] = useState(false);
  const [notifying, setNotifying] = useState(true);
  const inputRef = useRef<HTMLButtonElement>(null);

  const handleToggle = () => {
    if (typeof window !== "undefined" && window.innerWidth >= 1024) {
      toggleSidebar();
    } else {
      toggleMobileSidebar();
    }
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        onOpenCommand();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onOpenCommand]);

  return (
    <header className="shrink-0 flex w-full bg-white border-gray-200 z-30 dark:border-gray-800 dark:bg-gray-900 lg:border-b">
      <div className="flex flex-col items-center justify-between grow lg:flex-row lg:px-6">

        {/* Top bar row — always visible */}
        <div className="flex items-center justify-between w-full gap-2 px-3 py-3 border-b border-gray-200 dark:border-gray-800 sm:gap-4 lg:justify-normal lg:border-b-0 lg:px-0 lg:py-4">

          {/* Sidebar / hamburger toggle */}
          <button
            type="button"
            onClick={handleToggle}
            className="flex items-center justify-center w-10 h-10 text-gray-500 border border-gray-200 rounded-lg dark:border-gray-800 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors lg:h-11 lg:w-11"
            aria-label="Toggle sidebar"
          >
            {isMobileOpen ? (
              <CloseXIcon />
            ) : (
              <HamburgerIcon />
            )}
          </button>

          {/* Mobile app menu toggle (3 dots) */}
          <button
            type="button"
            onClick={() => setApplicationMenuOpen(!isApplicationMenuOpen)}
            className="flex items-center justify-center w-10 h-10 text-gray-700 rounded-lg hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 lg:hidden"
          >
            <DotsMenuIcon />
          </button>

          {/* Search input — desktop only */}
          <div className="hidden lg:block">
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500 dark:text-gray-400">
                <SearchIcon />
              </span>
              <button
                ref={inputRef}
                type="button"
                onClick={onOpenCommand}
                className="h-11 w-full rounded-lg border border-gray-200 bg-transparent py-2.5 pl-12 pr-14 text-sm text-gray-500 shadow-theme-xs placeholder:text-gray-400 hover:border-gray-300 hover:bg-gray-50 focus:outline-none dark:border-gray-800 dark:text-gray-400 dark:hover:bg-white/5 xl:w-[430px] text-left"
              >
                Search or type command...
              </button>
              <button
                type="button"
                onClick={onOpenCommand}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 inline-flex items-center gap-0.5 rounded-lg border border-gray-200 bg-gray-50 px-1.75 py-[4.5px] text-xs tracking-tight text-gray-500 dark:border-gray-800 dark:bg-white/5 dark:text-gray-400"
              >
                <span>⌘</span><span>K</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right section — theme, notifications, user */}
        <div
          className={cn(
            "items-center justify-between w-full gap-4 px-5 py-4 lg:flex shadow-theme-md lg:justify-end lg:px-0 lg:shadow-none",
            isApplicationMenuOpen ? "flex" : "hidden"
          )}
        >
          <div className="flex items-center gap-2">
            {headerActions}
            <ThemeToggleButton />

            {/* Notifications */}
            <div className="relative">
              <button
                type="button"
                onClick={() => { setNotifying(false); onOpenNotifications(); }}
                className="relative flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-white/5"
                aria-label="Notifications"
              >
                {notifying && (
                  <span className="absolute right-0 top-0.5 z-10 flex h-2 w-2 rounded-full bg-brand-500">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-500 opacity-75" />
                  </span>
                )}
                <BellIcon />
              </button>
            </div>
          </div>

          {/* User dropdown */}
          <AdminUserMenu user={user} contextLabel={contextLabel} settingsHref={settingsHref} />
        </div>

      </div>
    </header>
  );
}
