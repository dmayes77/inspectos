"use client";

import { ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  Briefcase,
  Calendar,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Search,
  Settings,
  User,
  Wifi,
  WifiOff,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNetwork } from "@/hooks/use-network";
import { useIsNative } from "@/hooks/use-platform";
import { impactLight } from "@/services/haptics";
import { MobileAppShell } from "@/components/layout/mobile-app-shell";
import {
  companyMainNav,
  companySystemNav,
  platformMainNav,
  platformSystemNav,
  type NavItem,
} from "@/components/layout/admin-nav";

interface AppShellProps {
  children: ReactNode;
  title?: string;
  showBackButton?: boolean;
  onBack?: () => void;
  headerActions?: ReactNode;
  user?: {
    name: string;
    email: string;
    avatarUrl?: string;
    companyName?: string;
  };
}

const navItems = [
  { href: "/inspector/schedule", icon: Calendar, label: "Schedule" },
  { href: "/inspector/jobs", icon: Briefcase, label: "Jobs" },
];

/**
 * AppShell - Mobile-first application shell
 *
 * Generic app shell for mobile-first routes. Features:
 * - Sidebar navigation
 * - Fixed header with back button
 * - Touch-optimized interactions
 * - Haptic feedback
 * - Online/offline indicator
 * - Safe area handling
 *
 * Reusable for any mobile-first app routes (inspector, field work, etc.)
 */
export function AppShell({
  children,
  title = "InspectOS",
  showBackButton = false,
  onBack,
  headerActions,
  user,
}: AppShellProps) {
  const pathname = usePathname();
  const { isOnline, connectionType } = useNetwork();
  const isNative = useIsNative();
  const [isMobile, setIsMobile] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const isAdminRoute = pathname.startsWith("/admin") || pathname.startsWith("/platform");
  const isPlatformAdmin = pathname.startsWith("/platform");

  const mainNav = isPlatformAdmin ? platformMainNav : companyMainNav;
  const systemNav = isPlatformAdmin ? platformSystemNav : companySystemNav;
  const homeHref = isPlatformAdmin ? "/platform" : "/admin/overview";
  const contextLabel = isPlatformAdmin ? "Platform Admin" : user?.companyName;

  useEffect(() => {
    const media = window.matchMedia("(max-width: 1023px)");
    const update = () => setIsMobile(media.matches);
    update();
    if (media.addEventListener) {
      media.addEventListener("change", update);
      return () => media.removeEventListener("change", update);
    }
    media.addListener(update);
    return () => media.removeListener(update);
  }, []);

  const handleNavClick = () => {
    impactLight();
  };

  const handleBackClick = () => {
    impactLight();
    onBack?.();
  };

  if (isNative || isMobile) {
    return (
      <MobileAppShell
        variant={isAdminRoute ? "admin" : "inspector"}
        title={title}
        showBackButton={showBackButton}
        onBack={onBack}
        headerActions={headerActions}
        user={user}
      >
        {children}
      </MobileAppShell>
    );
  }

  if (isAdminRoute) {
    const NavLink = ({ href, icon: Icon, label }: NavItem) => {
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
          <main className="flex-1 overflow-y-auto overflow-x-hidden overscroll-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <div className="container max-w-7xl p-6 overflow-x-hidden">{children}</div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex bg-background">
      {/* Sidebar Navigation */}
      <aside className="shrink-0 w-64 border-r bg-muted/30 flex flex-col safe-area-inset-left">
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b">
          <Link href="/inspector/schedule" className="flex items-center gap-3" onClick={handleNavClick}>
            <Logo size="sm" variant="icon" />
            <span className="text-lg font-semibold">InspectOS</span>
          </Link>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-4">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={handleNavClick}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User Profile */}
        <div className="p-3 border-t">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted transition-colors"
                onClick={() => impactLight()}
              >
                <Avatar className="h-9 w-9">
                  <AvatarImage src={user?.avatarUrl} />
                  <AvatarFallback className="text-sm bg-primary/10">
                    {user?.name
                      ?.split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm font-medium truncate">{user?.name || "Inspector"}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email || "inspector@example.com"}</p>
                </div>
                <OnlineIndicator isOnline={isOnline} connectionType={connectionType} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="top" className="w-56">
              <DropdownMenuItem asChild onClick={() => impactLight()}>
                <Link href="/inspector/profile">
                  <User className="mr-2 h-4 w-4" />
                  Profile & Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => impactLight()}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 safe-area-inset-right">
        {/* Top Header */}
        <header className="shrink-0 h-16 border-b bg-background flex items-center justify-between px-6 safe-area-inset-top">
          <div className="flex items-center gap-3">
            {showBackButton && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBackClick}
                className="shrink-0 -ml-2 h-9 w-9"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
            )}
            <h1 className="text-xl font-semibold">{title}</h1>
          </div>

          <div className="flex items-center gap-3">
            {headerActions}
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

function OnlineIndicator({
  isOnline,
  connectionType
}: {
  isOnline: boolean;
  connectionType: string;
}) {
  if (isOnline && connectionType === "wifi") {
    return null;
  }

  return (
    <div
      className={cn(
        "flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium",
        isOnline
          ? "bg-blue-500/10 text-blue-600"
          : "bg-amber-500/10 text-amber-600"
      )}
    >
      {isOnline ? (
        <Wifi className="h-3.5 w-3.5" />
      ) : (
        <WifiOff className="h-3.5 w-3.5" />
      )}
      <span>{isOnline ? connectionType : "Offline"}</span>
    </div>
  );
}
