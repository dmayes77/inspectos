"use client";

import { ReactNode, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Bell,
  Search,
  HardHat,
  Building2,
  Flag,
  DollarSign,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AdminShellProps {
  children: ReactNode;
  user?: {
    name: string;
    email: string;
    avatarUrl?: string;
    companyName?: string;
  };
}

// Company admin navigation
const companyMainNav = [
  { href: "/admin/overview", icon: LayoutDashboard, label: "Overview" },
  { href: "/admin/inspections", icon: ClipboardList, label: "Inspections" },
  { href: "/admin/services", icon: ClipboardList, label: "Services" },
  { href: "/admin/team", icon: HardHat, label: "Team" },
  { href: "/admin/clients", icon: Users, label: "Clients" },
  { href: "/admin/templates", icon: FileText, label: "Templates" },
];

const companySystemNav = [
  { href: "/admin/settings", icon: Settings, label: "Settings" },
];

// Platform admin navigation
const platformMainNav = [
  { href: "/platform", icon: LayoutDashboard, label: "Overview" },
  { href: "/platform/companies", icon: Building2, label: "Companies" },
  { href: "/platform/features", icon: Flag, label: "Features" },
  { href: "/platform/pricing", icon: DollarSign, label: "Pricing" },
];

const platformSystemNav = [
  { href: "/platform/content", icon: FileText, label: "Content" },
];

/**
 * AdminShell - Desktop-dense admin interface
 *
 * Supports both company admin (/admin/*) and platform admin (/platform/*).
 * Auto-detects context based on route and shows appropriate navigation.
 *
 * Features:
 * - Collapsible sidebar
 * - Keyboard shortcuts (⌘K search)
 * - Notifications
 * - User dropdown
 * - Safe area handling
 */
export function AdminShell({ children, user }: AdminShellProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  // Auto-detect platform admin based on route
  const isPlatformAdmin = pathname.startsWith('/platform');

  // Select navigation based on context
  const mainNav = isPlatformAdmin ? platformMainNav : companyMainNav;
  const systemNav = isPlatformAdmin ? platformSystemNav : companySystemNav;

  // Select home link based on context
  const homeHref = isPlatformAdmin ? "/platform" : "/admin/overview";

  // Select header context text
  const contextLabel = isPlatformAdmin ? "Platform Admin" : user?.companyName;

  const NavLink = ({
    href,
    icon: Icon,
    label,
  }: {
    href: string;
    icon: typeof LayoutDashboard;
    label: string;
  }) => {
    const isActive = pathname === href || pathname.startsWith(`${href}/`);
    return (
      <Link
        href={href}
        className={cn(
          "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
          isActive
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
          collapsed && "justify-center px-2"
        )}
        title={collapsed ? label : undefined}
      >
        <Icon className="h-4 w-4 shrink-0" />
        {!collapsed && <span>{label}</span>}
      </Link>
    );
  };

  return (
    <div className="flex h-dvh overflow-hidden bg-background safe-area-inset-left safe-area-inset-right">
      {/* Sidebar */}
      <aside
        className={cn(
          "flex flex-col border-r bg-card transition-all duration-200 safe-area-inset-top",
          collapsed ? "w-16" : "w-56"
        )}
      >
        {/* Logo */}
        <div className="flex h-14 items-center border-b px-4">
          <Link href={homeHref}>
            <Logo
              size={collapsed ? "sm" : "md"}
              variant={collapsed ? "icon" : "full"}
            />
          </Link>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 px-3 py-4">
          <nav className="flex flex-col gap-1">
            {mainNav.map((item) => (
              <NavLink key={item.href} {...item} />
            ))}
          </nav>

          <Separator className="my-4" />

          <nav className="flex flex-col gap-1">
            {systemNav.map((item) => (
              <NavLink key={item.href} {...item} />
            ))}
          </nav>
        </ScrollArea>

        {/* Collapse Toggle */}
        <div className="border-t p-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed(!collapsed)}
            className="w-full justify-center"
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden safe-area-inset-top">
        {/* Top Bar */}
        <header className="flex h-14 items-center justify-between border-b bg-card px-6">
          {/* Search */}
          <Button
            variant="outline"
            className="hidden w-64 justify-start gap-2 text-muted-foreground md:flex"
          >
            <Search className="h-4 w-4" />
            <span>Search...</span>
            <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
              <span className="text-xs">⌘</span>K
            </kbd>
          </Button>

          <div className="flex items-center gap-3">
            {/* Notifications */}
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-4 w-4" />
              <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-destructive" />
            </Button>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center gap-2 px-2"
                >
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={user?.avatarUrl} />
                    <AvatarFallback className="text-xs">
                      {user?.name
                        ?.split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden flex-col items-start md:flex">
                    <span className="text-sm font-medium">
                      {user?.name || "Admin"}
                    </span>
                    {contextLabel && (
                      <span className="text-xs text-muted-foreground">
                        {contextLabel}
                      </span>
                    )}
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span>{user?.name || "Admin"}</span>
                    <span className="text-xs font-normal text-muted-foreground">
                      {user?.email || "admin@example.com"}
                    </span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href={isPlatformAdmin ? "/platform/content" : "/admin/settings"}>
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <div className="container max-w-7xl p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
