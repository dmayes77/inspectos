"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronDown, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AdminNavLink } from "@/components/layout/admin-nav-link";
import { type NavItem, type NavSection } from "@/components/layout/admin-nav";

const OPEN_SECTIONS_STORAGE_KEY = "inspectos_admin_nav_sections";

interface AdminSidebarProps {
  collapsed: boolean;
  onToggleCollapse?: () => void;
  homeHref: string;
  mainNav: NavItem[];
  pinnedNav: NavItem[];
  navSections: NavSection[];
  systemNav: NavItem[];
  isPlatformAdmin: boolean;
  pathname: string;
  businessName?: string;
  businessLogo?: string;
}

export function AdminSidebar({
  collapsed,
  onToggleCollapse,
  homeHref,
  mainNav,
  pinnedNav,
  navSections,
  systemNav,
  isPlatformAdmin,
  pathname,
  businessName,
  businessLogo,
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

  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() => getDefaultOpenSections());

  useEffect(() => {
    const defaults = getDefaultOpenSections();
    const stored = window.localStorage.getItem(OPEN_SECTIONS_STORAGE_KEY);
    if (!stored) {
      setOpenSections(defaults);
      return;
    }
    try {
      const parsed = JSON.parse(stored) as Record<string, boolean>;
      const activeLabel = getActiveSectionLabel();
      const merged = { ...defaults, ...parsed };
      setOpenSections(activeLabel ? { ...merged, [activeLabel]: true } : merged);
    } catch {
      setOpenSections(defaults);
    }
  }, [pathname, navSections]);

  const toggleSection = (label: string) => {
    setOpenSections((prev) => {
      const isOpening = !prev[label];
      const keys = Array.from(new Set([...Object.keys(prev), label]));
      const next = Object.fromEntries(
        keys.map((key) => [key, key === label ? isOpening : false])
      ) as Record<string, boolean>;
      if (typeof window !== "undefined") {
        window.localStorage.setItem(OPEN_SECTIONS_STORAGE_KEY, JSON.stringify(next));
      }
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
        "hidden md:flex flex-col transition-all duration-200 safe-area-inset-top z-10",
        "bg-[#1C2434] border-r border-[#313d4f]",
        collapsed ? "w-14" : "w-[260px]"
      )}
    >
      {/* Logo / Brand */}
      <div className="flex h-14 shrink-0 items-center border-b border-[#313d4f] px-4 gap-2">
        <Link href={homeHref} className="flex items-center gap-2.5 min-w-0 flex-1">
          <div
            className={cn(
              "relative flex items-center justify-center rounded-md shrink-0",
              collapsed ? "h-6 w-6" : "h-7 w-7"
            )}
          >
            {businessLogo ? (
              <Image
                src={businessLogo}
                alt={businessName || "Logo"}
                fill
                sizes="28px"
                className="object-contain"
              />
            ) : (
              <div className="flex items-center justify-center h-full w-full rounded-md bg-primary text-primary-foreground font-bold text-xs">
                {businessName ? businessName.slice(0, 2).toUpperCase() : "IO"}
              </div>
            )}
          </div>
          {!collapsed && (
            <span className="font-semibold text-sm truncate text-white">
              {businessName || "InspectOS"}
            </span>
          )}
        </Link>
        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="shrink-0 rounded-lg p-1 text-[#8D9DB0] hover:bg-white/[0.06] hover:text-white transition-colors"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <PanelLeftOpen className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </button>
        )}
      </div>

      <ScrollArea className="flex-1 px-2 py-3">
        {!collapsed && !isPlatformAdmin && (
          <div className="mb-3">
            <input
              type="text"
              value={navQuery}
              onChange={(e) => setNavQuery(e.target.value)}
              placeholder="Search..."
              className={cn(
                "w-full h-8 rounded-lg px-3 text-[12px] outline-none transition-colors",
                "bg-white/[0.06] text-white placeholder:text-[#8D9DB0]",
                "border border-[#313d4f] focus:border-white/25 focus:bg-white/[0.09]"
              )}
            />
          </div>
        )}

        {collapsed || isPlatformAdmin ? (
          <nav className="flex flex-col gap-0.5">
            {mainNav.map((item) => (
              <AdminNavLink key={item.href} {...item} collapsed={collapsed} size="sm" theme="dark" />
            ))}
          </nav>
        ) : (
          <div className="space-y-3">
            <div>
              <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-wider text-[#8D9DB0]">Main Menu</p>
              <nav className="flex flex-col gap-0.5">
                {filteredPinnedNav.map((item) => (
                  <AdminNavLink key={item.href} {...item} size="sm" theme="dark" />
                ))}
              </nav>
            </div>

            {normalizedQuery ? (
              <div className="space-y-3">
                {filteredSections.map((section) => (
                  <div key={section.label}>
                    <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-widest text-[#8D9DB0]">
                      {section.label}
                    </div>
                    <nav className="mt-1 flex flex-col gap-0.5">
                      {section.items.map((item) => (
                        <AdminNavLink key={item.href} {...item} size="sm" theme="dark" />
                      ))}
                    </nav>
                  </div>
                ))}
                {!hasNavMatches && (
                  <div className="px-2 text-xs text-[#8D9DB0]">
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
                      className="flex w-full items-center justify-between px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#8D9DB0] hover:text-white/70 transition-colors"
                    >
                      <span>{section.label}</span>
                      <ChevronDown
                        className={cn(
                          "h-3 w-3 transition-transform",
                          isOpen && "rotate-180"
                        )}
                      />
                    </button>
                    {isOpen && (
                      <nav className="mt-1 flex flex-col gap-0.5">
                        {section.items.map((item) => (
                          <AdminNavLink key={item.href} {...item} size="sm" theme="dark" />
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

      {/* System nav */}
      <div className="shrink-0 border-t border-[#313d4f] px-2 py-3">
        <nav className="flex flex-col gap-0.5">
          {systemNav.map((item) => (
            <AdminNavLink key={item.href} {...item} collapsed={collapsed} size="sm" theme="dark" />
          ))}
        </nav>
      </div>
    </aside>
  );
}
