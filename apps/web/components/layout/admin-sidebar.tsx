"use client";

import Link from "next/link";
import Image from "next/image";
import { MoreHorizontal, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { type NavItem, type NavSection } from "@/components/layout/admin-nav";
import { usePathname } from "next/navigation";

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

function SidebarNavItem({
  href,
  icon: Icon,
  label,
  collapsed,
}: NavItem & { collapsed: boolean }) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      title={collapsed ? label : undefined}
      className={cn(
        "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150 focus-visible:outline-none",
        collapsed && "justify-center px-2",
        isActive
          ? "bg-primary/[0.12] text-primary"
          : "text-[#8D9DB0] hover:bg-white/[0.06] hover:text-white"
      )}
    >
      {/* Active indicator bar */}
      {isActive && !collapsed && (
        <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-primary" />
      )}
      <Icon
        className={cn(
          "h-[18px] w-[18px] shrink-0 transition-colors",
          isActive ? "text-primary" : "text-[#8D9DB0] group-hover:text-white"
        )}
      />
      {!collapsed && <span>{label}</span>}
    </Link>
  );
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
  businessName,
  businessLogo,
}: AdminSidebarProps) {
  return (
    <aside
      className={cn(
        "hidden md:flex flex-col transition-all duration-300 safe-area-inset-top z-10",
        "bg-[#1C2434] border-r border-[#313d4f]",
        collapsed ? "w-[90px]" : "w-[290px]"
      )}
    >
      {/* Logo / Brand */}
      <div
        className={cn(
          "flex h-16 shrink-0 items-center border-b border-[#313d4f]",
          collapsed ? "justify-center px-4" : "px-5 gap-3"
        )}
      >
        <Link href={homeHref} className={cn("flex items-center gap-3 min-w-0", collapsed ? "justify-center" : "flex-1")}>
          <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-xl">
            {businessLogo ? (
              <Image
                src={businessLogo}
                alt={businessName || "Logo"}
                fill
                sizes="32px"
                className="object-contain rounded-xl"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-sm">
                {businessName ? businessName.slice(0, 2).toUpperCase() : "IO"}
              </div>
            )}
          </div>
          {!collapsed && (
            <span className="font-semibold text-base truncate text-white tracking-tight">
              {businessName || "InspectOS"}
            </span>
          )}
        </Link>
        {!collapsed && onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="shrink-0 rounded-lg p-1.5 text-[#8D9DB0] hover:bg-white/[0.06] hover:text-white transition-colors"
            aria-label="Collapse sidebar"
          >
            <PanelLeftClose className="h-4 w-4" />
          </button>
        )}
        {collapsed && onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="absolute -right-3 top-[52px] hidden md:flex h-6 w-6 items-center justify-center rounded-full border border-[#313d4f] bg-[#1C2434] text-[#8D9DB0] hover:text-white transition-colors z-20"
            aria-label="Expand sidebar"
          >
            <PanelLeftOpen className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Nav */}
      <ScrollArea className="flex-1 py-4">
        <nav className={cn("flex flex-col gap-6", collapsed ? "px-3" : "px-5")}>

          {/* MENU group — pinned nav */}
          <div>
            <h2
              className={cn(
                "mb-3 flex text-xs uppercase font-medium leading-5 text-[#8D9DB0]",
                collapsed ? "justify-center" : "justify-start"
              )}
            >
              {collapsed ? <MoreHorizontal className="h-4 w-4" /> : "Menu"}
            </h2>
            <ul className="flex flex-col gap-1.5">
              {(isPlatformAdmin ? mainNav : pinnedNav).map((item) => (
                <li key={item.href}>
                  <SidebarNavItem {...item} collapsed={collapsed} />
                </li>
              ))}
            </ul>
          </div>

          {/* Section groups (Operations, People, Finance, etc.) */}
          {!isPlatformAdmin && navSections.map((section) => (
            <div key={section.label}>
              <h2
                className={cn(
                  "mb-3 flex text-xs uppercase font-medium leading-5 text-[#8D9DB0]",
                  collapsed ? "justify-center" : "justify-start"
                )}
              >
                {collapsed ? <MoreHorizontal className="h-4 w-4" /> : section.label}
              </h2>
              <ul className="flex flex-col gap-1.5">
                {section.items.map((item) => (
                  <li key={item.href}>
                    <SidebarNavItem {...item} collapsed={collapsed} />
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* OTHERS group — system nav */}
          {systemNav.length > 0 && (
            <div>
              <h2
                className={cn(
                  "mb-3 flex text-xs uppercase font-medium leading-5 text-[#8D9DB0]",
                  collapsed ? "justify-center" : "justify-start"
                )}
              >
                {collapsed ? <MoreHorizontal className="h-4 w-4" /> : "System"}
              </h2>
              <ul className="flex flex-col gap-1.5">
                {systemNav.map((item) => (
                  <li key={item.href}>
                    <SidebarNavItem {...item} collapsed={collapsed} />
                  </li>
                ))}
              </ul>
            </div>
          )}
        </nav>
      </ScrollArea>
    </aside>
  );
}
