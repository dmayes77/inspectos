"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { type NavItem } from "@/components/layout/admin-nav";

interface AdminNavLinkProps extends NavItem {
  collapsed?: boolean;
  onClick?: () => void;
  size?: "sm" | "default";
}

export function AdminNavLink({
  href,
  icon: Icon,
  label,
  collapsed = false,
  onClick,
  size = "default",
}: AdminNavLinkProps) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-md font-medium transition-colors focus-visible:bg-accent focus-visible:text-accent-foreground focus-visible:outline-1 focus-visible:outline-ring/40 focus-visible:outline-offset-2",
        size === "sm" ? "px-2.5 py-1.5 text-[13px]" : "px-3 py-2 text-sm",
        isActive
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
        collapsed && "justify-center px-2"
      )}
      title={collapsed ? label : undefined}
    >
      <Icon className={cn("shrink-0", size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4")} />
      {!collapsed && <span>{label}</span>}
    </Link>
  );
}
