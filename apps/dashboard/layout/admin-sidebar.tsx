"use client";

import Link from "next/link";
import Image from "next/image";
import { MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { type NavItem, type NavSection } from "@/layout/admin-nav";
import { usePathname } from "next/navigation";
import { useSidebar } from "@/context/sidebar-context";

interface AdminSidebarProps {
  homeHref: string;
  mainNav: NavItem[];
  pinnedNav: NavItem[];
  navSections: NavSection[];
  systemNav: NavItem[];
  isPlatformAdmin: boolean;
  businessName?: string;
  businessLogo?: string;
}

function SidebarNavItem({
  href,
  icon: Icon,
  label,
}: NavItem) {
  const pathname = usePathname();
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();
  const isActive = pathname === href || pathname.startsWith(`${href}/`);
  const showLabel = isExpanded || isHovered || isMobileOpen;

  return (
    <Link
      href={href}
      className={cn(
        "menu-item group",
        !showLabel && "lg:justify-center",
        isActive ? "menu-item-active" : "menu-item-inactive"
      )}
    >
      <Icon
        className={cn(
          "h-4 w-4 shrink-0 transition-colors",
          isActive ? "menu-item-icon-active" : "menu-item-icon-inactive"
        )}
      />
      {showLabel && <span>{label}</span>}
    </Link>
  );
}

export function AdminSidebar({
  homeHref,
  mainNav,
  pinnedNav,
  navSections,
  systemNav,
  isPlatformAdmin,
  businessName,
  businessLogo,
}: AdminSidebarProps) {
  const { isExpanded, isHovered, isMobileOpen, setIsHovered } = useSidebar();
  const showFull = isExpanded || isHovered || isMobileOpen;

  return (
    <aside
      data-sidebar
      className={cn(
        "fixed mt-14 flex flex-col lg:mt-0 top-0 left-0 bg-white dark:bg-gray-900",
        "border-r border-gray-200 dark:border-gray-800",
        "h-screen transition-all duration-300 ease-in-out z-50",
        isExpanded || isHovered ? "w-[290px]" : "w-[90px]",
        isMobileOpen ? "translate-x-0" : "-translate-x-full",
        "lg:translate-x-0"
      )}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Logo / Brand */}
      <div
        className={cn(
          "py-6 flex px-5",
          !showFull ? "lg:justify-center" : "justify-start"
        )}
      >
        <Link
          href={homeHref}
          className={cn("flex items-center gap-3 min-w-0", !showFull ? "lg:justify-center" : "flex-1")}
        >
          <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-sm overflow-hidden">
            {businessLogo ? (
              <Image
                src={businessLogo}
                alt={businessName || "Logo"}
                fill
                sizes="36px"
                className="object-contain rounded-sm"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center rounded-sm bg-brand-500 text-white font-bold text-sm">
                {businessName ? businessName.slice(0, 2).toUpperCase() : "IO"}
              </div>
            )}
          </div>
          {showFull && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-semibold leading-tight text-gray-900 dark:text-white">
                {businessName || "InspectOS"}
              </p>
              <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400 leading-tight mt-0.5">Admin Panel</p>
            </div>
          )}
        </Link>
      </div>

      {/* Nav */}
      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar py-4">
        <nav className={cn("flex flex-col gap-6", "px-5")}>

          {/* MENU group */}
          <div>
            <h2
              className={cn(
                "mb-4 flex text-xs uppercase leading-[20px] text-gray-400 dark:text-gray-500",
                !showFull ? "lg:justify-center" : "justify-start"
              )}
            >
              {showFull ? "Menu" : <MoreHorizontal className="h-4 w-4" />}
            </h2>
            <ul className="flex flex-col gap-1">
              {(isPlatformAdmin ? mainNav : pinnedNav).map((item) => (
                <li key={item.href}>
                  <SidebarNavItem {...item} />
                </li>
              ))}
            </ul>
          </div>

          {/* Section groups (Operations, People, Finance, etc.) */}
          {!isPlatformAdmin && navSections.map((section) => (
            <div key={section.label}>
              <h2
                className={cn(
                  "mb-4 flex text-xs uppercase leading-[20px] text-gray-400 dark:text-gray-500",
                  !showFull ? "lg:justify-center" : "justify-start"
                )}
              >
                {showFull ? section.label : <MoreHorizontal className="h-4 w-4" />}
              </h2>
              <ul className="flex flex-col gap-1">
                {section.items.map((item) => (
                  <li key={item.href}>
                    <SidebarNavItem {...item} />
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* SYSTEM group */}
          {systemNav.length > 0 && (
            <div>
              <h2
                className={cn(
                  "mb-4 flex text-xs uppercase leading-[20px] text-gray-400 dark:text-gray-500",
                  !showFull ? "lg:justify-center" : "justify-start"
                )}
              >
                {showFull ? "System" : <MoreHorizontal className="h-4 w-4" />}
              </h2>
              <ul className="flex flex-col gap-1">
                {systemNav.map((item) => (
                  <li key={item.href}>
                    <SidebarNavItem {...item} />
                  </li>
                ))}
              </ul>
            </div>
          )}
        </nav>
      </div>
    </aside>
  );
}
