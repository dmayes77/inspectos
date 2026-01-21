"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/brand/logo";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AdminNavLink } from "@/components/layout/admin-nav-link";
import { type NavItem, type NavSection } from "@/components/layout/admin-nav";

const OPEN_SECTIONS_STORAGE_KEY = "inspectos_admin_nav_sections";

interface AdminSidebarProps {
  collapsed: boolean;
  homeHref: string;
  mainNav: NavItem[];
  pinnedNav: NavItem[];
  navSections: NavSection[];
  systemNav: NavItem[];
  isPlatformAdmin: boolean;
  pathname: string;
}

export function AdminSidebar({
  collapsed,
  homeHref,
  mainNav,
  pinnedNav,
  navSections,
  systemNav,
  isPlatformAdmin,
  pathname,
}: AdminSidebarProps) {
  const [navQuery, setNavQuery] = useState("");

  const getActiveSectionLabel = () => {
    const match = navSections.find((section) =>
      section.items.some(
        (item) => pathname === item.href || pathname.startsWith(`${item.href}/`)
      )
    );
    return match?.label ?? null;
  };

  const getDefaultOpenSections = () => {
    const entries = navSections.map((section) => [section.label, false] as const);
    const defaults = Object.fromEntries(entries) as Record<string, boolean>;
    const activeLabel = getActiveSectionLabel();
    if (activeLabel) {
      defaults[activeLabel] = true;
    }
    return defaults;
  };

  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() => {
    const defaults = getDefaultOpenSections();
    if (typeof window === "undefined") return defaults;
    const stored = window.localStorage.getItem(OPEN_SECTIONS_STORAGE_KEY);
    if (!stored) return defaults;
    try {
      const parsed = JSON.parse(stored) as Record<string, boolean>;
      const activeLabel = getActiveSectionLabel();
      return activeLabel ? { ...parsed, [activeLabel]: true } : parsed;
    } catch {
      return defaults;
    }
  });

  const toggleSection = (label: string) => {
    setOpenSections((prev) => {
      const isOpening = !prev[label];
      const next = Object.fromEntries(
        Object.keys(prev).map((key) => [key, key === label ? isOpening : false])
      ) as Record<string, boolean>;
      window.localStorage.setItem(OPEN_SECTIONS_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const normalizedQuery = navQuery.trim().toLowerCase();

  const filterNavItems = (items: NavItem[]) => {
    if (!normalizedQuery) return items;
    return items.filter((item) => item.label.toLowerCase().includes(normalizedQuery));
  };

  const filteredPinnedNav = filterNavItems(pinnedNav);
  const filteredSections = navSections
    .map((section) => ({
      ...section,
      items: filterNavItems(section.items),
    }))
    .filter((section) => section.items.length > 0);
  const hasNavMatches = filteredPinnedNav.length > 0 || filteredSections.length > 0;

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col border-r bg-card transition-all duration-200 safe-area-inset-top",
        collapsed ? "w-16" : "w-56"
      )}
    >
      <div className="flex h-12 items-center border-b px-4">
        <Link href={homeHref}>
          <Logo size={collapsed ? "sm" : "md"} variant={collapsed ? "icon" : "full"} />
        </Link>
      </div>

      <ScrollArea className="flex-1 px-3 py-4">
        {!collapsed && !isPlatformAdmin && (
          <div className="mb-4">
            <Input
              value={navQuery}
              onChange={(event) => setNavQuery(event.target.value)}
              placeholder="Search navigation..."
              className="h-8 text-[13px] focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-ring/60"
            />
          </div>
        )}

        {collapsed || isPlatformAdmin ? (
          <nav className="flex flex-col gap-1">
            {mainNav.map((item) => (
              <AdminNavLink key={item.href} {...item} collapsed={collapsed} size="sm" />
            ))}
          </nav>
        ) : (
          <div className="space-y-4">
            <nav className="flex flex-col gap-1">
              {filteredPinnedNav.map((item) => (
                <AdminNavLink key={item.href} {...item} size="sm" />
              ))}
            </nav>

            {normalizedQuery ? (
              <div className="space-y-4">
                {filteredSections.map((section) => (
                  <div key={section.label}>
                    <div className="px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {section.label}
                    </div>
                    <nav className="mt-2 flex flex-col gap-1">
                      {section.items.map((item) => (
                        <AdminNavLink key={item.href} {...item} size="sm" />
                      ))}
                    </nav>
                  </div>
                ))}
                {!hasNavMatches && (
                  <div className="px-2 text-xs text-muted-foreground">
                    No matches found.
                  </div>
                )}
              </div>
            ) : (
              navSections.map((section) => {
                const isOpen = openSections[section.label];
                return (
                  <div key={section.label}>
                    <button
                      type="button"
                      onClick={() => toggleSection(section.label)}
                      className="flex w-full items-center justify-between px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                    >
                      <span>{section.label}</span>
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 transition-transform",
                          isOpen && "rotate-180"
                        )}
                      />
                    </button>
                    {isOpen && (
                      <nav className="mt-2 flex flex-col gap-1">
                        {section.items.map((item) => (
                          <AdminNavLink key={item.href} {...item} size="sm" />
                        ))}
                      </nav>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </ScrollArea>

      <div className="mt-auto border-t px-3 py-4">
        <nav className="flex flex-col gap-1">
          {systemNav.map((item) => (
            <AdminNavLink key={item.href} {...item} collapsed={collapsed} size="sm" />
          ))}
        </nav>
      </div>
    </aside>
  );
}
