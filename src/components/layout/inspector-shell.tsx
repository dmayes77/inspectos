"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Briefcase,
  Calendar,
  User,
  ChevronLeft,
  Wifi,
  WifiOff,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNetwork } from "@/hooks/use-network";
import { impactLight } from "@/services/haptics";

interface InspectorShellProps {
  children: ReactNode;
  title?: string;
  showBackButton?: boolean;
  onBack?: () => void;
  headerActions?: ReactNode;
  user?: {
    name: string;
    email: string;
    avatarUrl?: string;
  };
}

const navItems = [
  { href: "/inspector/schedule", icon: Calendar, label: "Schedule" },
  { href: "/inspector/jobs", icon: Briefcase, label: "Jobs" },
];

export function InspectorShell({
  children,
  title = "InspectOS",
  showBackButton = false,
  onBack,
  headerActions,
  user,
}: InspectorShellProps) {
  const pathname = usePathname();
  const { isOnline, connectionType } = useNetwork();

  const handleNavClick = () => {
    impactLight();
  };

  const handleBackClick = () => {
    impactLight();
    onBack?.();
  };

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
