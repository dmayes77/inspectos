"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/brand/logo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  companyMobileNav,
  platformMobileNav,
  type NavItem,
} from "@/components/layout/admin-nav";

interface MobileAdminShellProps {
  children: ReactNode;
  user?: {
    name: string;
    email: string;
    avatarUrl?: string;
    companyName?: string;
  };
}

export function MobileAdminShell({ children, user }: MobileAdminShellProps) {
  const pathname = usePathname();
  const isPlatformAdmin = pathname.startsWith("/platform");
  const mobileNav = isPlatformAdmin ? platformMobileNav : companyMobileNav;
  const homeHref = isPlatformAdmin ? "/platform" : "/admin/overview";
  const contextLabel = isPlatformAdmin ? "Platform Admin" : user?.companyName;

  const NavLink = ({ href, icon: Icon, label }: NavItem) => {
    const isActive = pathname === href || pathname.startsWith(`${href}/`);
    return (
      <Link
        href={href}
        className={cn(
          "flex flex-col items-center gap-1 rounded-md px-2 py-2 text-[11px] font-medium transition-colors",
          isActive ? "text-primary" : "text-muted-foreground"
        )}
      >
        <Icon className="h-5 w-5" />
        <span>{label}</span>
      </Link>
    );
  };

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background safe-area-inset-left safe-area-inset-right">
      <header className="flex h-14 items-center justify-between border-b bg-card px-4 safe-area-inset-top">
        <Link href={homeHref}>
          <Logo size="sm" />
        </Link>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-semibold">{user?.name || "Admin"}</p>
            {contextLabel && (
              <p className="text-xs text-muted-foreground">{contextLabel}</p>
            )}
          </div>
          <Avatar className="h-8 w-8">
            <AvatarImage src={user?.avatarUrl} />
            <AvatarFallback className="text-xs">
              {user?.name
                ?.split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto overflow-x-hidden overscroll-none pb-20 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <div className="px-4 py-6">{children}</div>
      </main>

      <nav className="border-t bg-card safe-area-inset-bottom">
        <div
          className={cn(
            "grid gap-1 px-2 py-2",
            mobileNav.length >= 5 ? "grid-cols-5" : "grid-cols-4"
          )}
        >
          {mobileNav.map((item) => (
            <NavLink key={item.href} {...item} />
          ))}
        </div>
      </nav>
    </div>
  );
}
