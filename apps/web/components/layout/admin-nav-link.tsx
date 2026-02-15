"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { type NavItem } from "@/components/layout/admin-nav";

interface AdminNavLinkProps extends NavItem {
  collapsed?: boolean;
  onClick?: () => void;
  size?: "sm" | "default";
  theme?: "light" | "dark";
}

export function AdminNavLink({
  href,
  icon: Icon,
  label,
  collapsed = false,
  onClick,
  size = "default",
  theme = "light",
}: AdminNavLinkProps) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-2.5 rounded-md transition-colors focus-visible:outline-none",
        size === "sm" ? "px-2.5 py-1.5 text-[13px]" : "px-3 py-2 text-sm",
        theme === "dark"
          ? isActive
            ? "bg-white/10 text-white font-semibold"
            : "text-white/45 hover:bg-white/7 hover:text-white/90 font-medium"
          : isActive
            ? "bg-primary/8 text-primary font-semibold"
            : "text-muted-foreground font-medium hover:bg-muted/60 hover:text-foreground",
        collapsed && "justify-center px-2"
      )}
      title={collapsed ? label : undefined}
    >
      <Icon
        className={cn(
          "shrink-0",
          size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4",
          theme === "dark"
            ? isActive ? "text-white" : "text-white/40"
            : isActive ? "text-primary" : "text-muted-foreground/70"
        )}
      />
      {!collapsed && <span>{label}</span>}
    </Link>
  );
}
