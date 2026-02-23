"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { AdminNavLink } from "@/layout/admin-nav-link";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { type NavItem, type NavSection } from "@/layout/admin-nav";

const OPEN_SECTIONS_STORAGE_KEY = "inspectos_admin_nav_sections";

interface AdminMobileNavProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mainNav: NavItem[];
  pinnedNav: NavItem[];
  navSections: NavSection[];
  systemNav: NavItem[];
  isPlatformAdmin: boolean;
  pathname: string;
  businessName?: string;
  businessLogo?: string;
}

export function AdminMobileNav({
  open,
  onOpenChange,
  mainNav,
  pinnedNav,
  navSections,
  systemNav,
  isPlatformAdmin,
  pathname,
  businessName,
  businessLogo,
}: AdminMobileNavProps) {
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

  const handleNavClick = () => {
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-72 p-0 flex flex-col">
        <SheetHeader className="border-b px-3 py-3">
          <SheetTitle className="p-0">
            <div className="flex items-center gap-2">
              <div className="relative flex h-8 w-8 items-center justify-center rounded-sm shrink-0">
                {businessLogo ? (
                  <Image
                    src={businessLogo}
                    alt={businessName || "Logo"}
                    fill
                    sizes="32px"
                    className="object-contain"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full w-full rounded-sm bg-primary text-primary-foreground font-bold text-sm">
                    {businessName ? businessName.slice(0, 2).toUpperCase() : "IO"}
                  </div>
                )}
              </div>
              <span className="font-semibold text-sm truncate">
                {businessName || "InspectOS"}
              </span>
            </div>
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-2 py-0 space-y-3">
          <div>
            {isPlatformAdmin ? (
              <nav className="mt-2 flex flex-col gap-1">
                {mainNav.map((item) => (
                  <AdminNavLink key={item.href} {...item} onClick={handleNavClick} size="sm" />
                ))}
              </nav>
            ) : (
              <div className="mt-2 space-y-3">
                <nav className="flex flex-col gap-1">
                  {pinnedNav.map((item) => (
                    <AdminNavLink key={item.href} {...item} onClick={handleNavClick} size="sm" />
                  ))}
                </nav>

                <div className="space-y-3">
                  {navSections.map((section) => {
                    const isOpen = openSections[section.label];
                    return (
                      <div key={section.label}>
                        <button
                          type="button"
                          onClick={() => toggleSection(section.label)}
                          className="flex w-full items-center justify-between px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
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
                              <AdminNavLink
                                key={item.href}
                                {...item}
                                onClick={handleNavClick}
                                size="sm"
                              />
                            ))}
                          </nav>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="border-t px-2 py-3">
          <div className="px-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            System
          </div>
          <nav className="mt-2 flex flex-col gap-1">
            {systemNav.map((item) => (
              <AdminNavLink key={item.href} {...item} onClick={handleNavClick} size="sm" />
            ))}
          </nav>
        </div>
      </SheetContent>
    </Sheet>
  );
}
