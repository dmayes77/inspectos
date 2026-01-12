"use client";

import { ReactNode, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/brand/logo";
import {
  BarChart3,
  FileEdit,
  Users,
  CreditCard,
  Settings,
  LogOut,
  Menu,
  X,
  Building,
  TrendingUp,
  Bell,
  Boxes,
} from "lucide-react";

interface PlatformAdminShellProps {
  children: ReactNode;
}

const navigation = [
  { name: "Analytics", href: "/platform", icon: BarChart3 },
  { name: "Companies", href: "/platform/companies", icon: Building },
  { name: "Revenue", href: "/platform/revenue", icon: TrendingUp },
  { name: "Users", href: "/platform/users", icon: Users },
  { name: "Content", href: "/platform/content", icon: FileEdit },
  { name: "Pricing", href: "/platform/pricing", icon: CreditCard },
  { name: "Features", href: "/platform/features", icon: Boxes },
  { name: "Settings", href: "/platform/settings", icon: Settings },
];

export function PlatformAdminShell({ children }: PlatformAdminShellProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-dvh bg-slate-950">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 transform bg-slate-900 transition-transform duration-200 lg:static lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-14 items-center justify-between border-b border-slate-800 px-4">
            <Link href="/platform" className="flex items-center gap-2">
              <Logo size="md" theme="dark" />
              <span className="rounded bg-primary/20 px-1.5 py-0.5 text-xs text-primary">
                Platform
              </span>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="text-slate-400 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 p-3">
            {navigation.map((item) => {
              const isActive = pathname === item.href ||
                (item.href !== "/platform" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-slate-400 hover:bg-slate-800 hover:text-white"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* User */}
          <div className="border-t border-slate-800 p-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-slate-800">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      DM
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-white">David Mayes</p>
                    <p className="text-xs text-slate-400">Platform Admin</p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuLabel>Platform Admin</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/platform/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col">
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-slate-800 bg-slate-950 px-4">
          <Button
            variant="ghost"
            size="icon"
            className="text-slate-400 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="text-slate-400">
              <Bell className="h-5 w-5" />
            </Button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto bg-slate-950 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
