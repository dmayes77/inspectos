"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Briefcase, Calendar, ChevronLeft, User, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { impactLight } from "@/services/haptics";
import { useNetwork } from "@/hooks/use-network";

interface MobileAppShellProps {
  children: ReactNode;
  title?: string;
  showBackButton?: boolean;
  onBack?: () => void;
  headerActions?: ReactNode;
}

const navItems = [
  { href: "/inspector/schedule", icon: Calendar, label: "Schedule" },
  { href: "/inspector/jobs", icon: Briefcase, label: "Jobs" },
  { href: "/inspector/profile", icon: User, label: "Profile" },
];

export function MobileAppShell({
  children,
  title = "InspectOS",
  showBackButton = false,
  onBack,
  headerActions,
}: MobileAppShellProps) {
  const pathname = usePathname();
  const { isOnline } = useNetwork();

  const handleNavClick = () => {
    impactLight();
  };

  const handleBackClick = () => {
    impactLight();
    onBack?.();
  };

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background safe-area-inset-left safe-area-inset-right">
      <header className="flex h-14 items-center justify-between border-b bg-background px-4 safe-area-inset-top">
        <div className="flex items-center gap-2">
          {showBackButton ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBackClick}
              className="h-9 w-9"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
          ) : null}
          <h1 className="text-base font-semibold">{title}</h1>
        </div>
        <div className="flex items-center gap-2">{headerActions}</div>
      </header>
      {!isOnline ? (
        <div className="flex items-center justify-center gap-2 border-b bg-amber-50 px-4 py-2 text-xs text-amber-700">
          <WifiOff className="h-3.5 w-3.5" />
          Offline mode: changes will sync when you reconnect.
        </div>
      ) : null}

      <main className="flex-1 overflow-y-auto">{children}</main>

      <nav className="border-t bg-background safe-area-inset-bottom">
        <div className="grid grid-cols-3">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={handleNavClick}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 px-2 py-2 text-xs font-medium",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
