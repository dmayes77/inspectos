"use client";

import { ReactNode, useState, useEffect, useRef } from "react";
import { AdminUserMenu } from "@/layout/admin-user-menu";
import { ThemeToggleButton } from "@/layout/theme-toggle-button";
import { useSidebar } from "@/context/sidebar-context";
import { HamburgerIcon, CloseXIcon, SearchIcon, BellIcon } from "@/components/icons";

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
      <div className="flex flex-col items-center justify-between grow lg:flex-row lg:px-4">

        {/* Top bar row — always visible */}
        <div className="flex min-h-16 items-center justify-between w-full gap-2 px-3 py-3 border-b border-gray-200 dark:border-gray-800 sm:gap-3 lg:min-h-0 lg:justify-normal lg:border-b-0 lg:px-0 lg:py-2.5">

          {/* Sidebar / hamburger toggle */}
          <button
            type="button"
            onClick={handleToggle}
            className="flex items-center justify-center h-11 w-11 text-gray-500 rounded-sm dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors lg:h-9 lg:w-9"
            aria-label="Toggle sidebar"
          >
            {isMobileOpen ? (
              <CloseXIcon />
            ) : (
              <HamburgerIcon />
            )}
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
                className="h-9 w-full rounded-sm border border-gray-200 bg-transparent py-2 pl-10 pr-12 text-xs text-gray-500 shadow-theme-xs placeholder:text-gray-400 hover:border-gray-300 hover:bg-gray-50 focus:outline-none dark:border-gray-800 dark:text-gray-400 dark:hover:bg-white/5 xl:w-[360px] text-left"
              >
                Search or type command...
              </button>
              <button
                type="button"
                onClick={onOpenCommand}
                className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center gap-0.5 rounded-sm border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-[10px] tracking-tight text-gray-500 dark:border-gray-800 dark:bg-white/5 dark:text-gray-400"
              >
                <span>⌘</span><span>K</span>
              </button>
            </div>
          </div>

          {/* Right section — always visible on mobile and desktop */}
          <div className="ml-auto flex items-center gap-2">
            <div className="hidden sm:flex sm:items-center sm:gap-2">{headerActions}</div>
            <ThemeToggleButton />

            <div className="relative">
              <button
                type="button"
                onClick={() => { setNotifying(false); onOpenNotifications(); }}
                className="relative flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-white/5 lg:h-9 lg:w-9"
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

            <AdminUserMenu user={user} contextLabel={contextLabel} settingsHref={settingsHref} />
          </div>
        </div>

      </div>
    </header>
  );
}
