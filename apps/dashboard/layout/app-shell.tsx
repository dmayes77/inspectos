"use client";

import { ReactNode, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { companyMainNav, companyPinnedNav, companyNavSections, companySystemNav, platformMainNav, platformSystemNav } from "@/layout/admin-nav";
import { AdminCommandPalette, type CommandItem } from "@/layout/admin-command-palette";
import { AdminNotifications } from "@/layout/admin-notifications";
import { AdminSidebar } from "@/layout/admin-sidebar";
import { AdminHeader } from "@/layout/admin-header";
import { SidebarProvider, useSidebar } from "@/context/sidebar-context";
import { useSettings } from "@/hooks/use-settings";
import { cn } from "@/lib/utils";

interface AppShellProps {
  children: ReactNode;
  headerActions?: ReactNode;
  user?: {
    name: string;
    email: string;
    avatarUrl?: string;
    companyName?: string;
  };
}

function AppShellContent({ children, headerActions, user }: AppShellProps) {
  const pathname = usePathname();
  const { isExpanded, isHovered } = useSidebar();
  const [commandOpen, setCommandOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [ready, setReady] = useState(false);
  const { data: settings, isLoading } = useSettings();

  useEffect(() => {
    setMounted(true);
    document.body.classList.add("admin-dense");
    return () => {
      document.body.classList.remove("admin-dense");
    };
  }, []);

  useEffect(() => {
    if (mounted && !isLoading && settings) {
      requestAnimationFrame(() => {
        setReady(true);
      });
    }
  }, [mounted, isLoading, settings]);

  // Close all portals on navigation to prevent Radix removeChild race
  useEffect(() => {
    setCommandOpen(false);
    setNotificationsOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const isCmdK = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k";
      if (isCmdK) {
        event.preventDefault();
        setCommandOpen((open) => !open);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const isPlatformAdmin = pathname.startsWith("/platform");
  const brandedName = ready && settings?.company?.name ? settings.company.name : undefined;
  const brandedLogo = ready && settings?.branding?.logoUrl ? settings.branding.logoUrl : undefined;
  const mainNav = isPlatformAdmin ? platformMainNav : companyMainNav;
  const pinnedNav = isPlatformAdmin ? [] : companyPinnedNav;
  const navSections = isPlatformAdmin ? [] : companyNavSections;
  const systemNav = isPlatformAdmin ? platformSystemNav : companySystemNav;
  const homeHref = isPlatformAdmin ? "/platform" : "/overview";
  const contextLabel = isPlatformAdmin ? "Platform Admin" : user?.companyName;
  const settingsHref = isPlatformAdmin ? "/platform/content" : "/settings";

  const commandItems = useMemo<CommandItem[]>(() => {
    const navItems = [...mainNav, ...systemNav].map((item) => ({
      label: item.label,
      description: "Navigate",
      href: item.href,
      keywords: [item.label],
    }));
    return [
      { label: "Overview", description: "Admin dashboard", href: "/overview" },
      { label: "New inspection", description: "Schedule an inspection", href: "/inspections/new" },
      { label: "Add team member", description: "Invite a teammate", href: "/team/new" },
      { label: "New client", description: "Create a client", href: "/contacts/new" },
      ...navItems,
    ];
  }, [mainNav, systemNav]);

  const showLoading = !ready;
  const showExpanded = isExpanded || isHovered;

  return (
    <div className="relative min-h-dvh w-full">
      {showLoading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-background">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      )}

      <AdminSidebar
        homeHref={homeHref}
        mainNav={mainNav}
        pinnedNav={pinnedNav}
        navSections={navSections}
        systemNav={systemNav}
        isPlatformAdmin={isPlatformAdmin}
        businessName={brandedName}
        businessLogo={brandedLogo}
      />

      <div
        className={cn(
          "flex flex-col h-dvh transition-all duration-300 ease-in-out",
          showExpanded ? "lg:ml-[290px]" : "lg:ml-[90px]"
        )}
      >
        <AdminHeader
          headerActions={headerActions}
          user={user}
          contextLabel={contextLabel}
          settingsHref={settingsHref}
          onOpenCommand={() => setCommandOpen(true)}
          onOpenNotifications={() => setNotificationsOpen(true)}
        />

        <main className="flex-1 overflow-y-auto overflow-x-hidden overscroll-none bg-(--content-bg) [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <div className="admin-content admin-dense mx-auto w-full max-w-none px-3 py-3 md:px-4">
            {children}
          </div>
        </main>
      </div>

      <AdminCommandPalette open={commandOpen} onOpenChange={setCommandOpen} items={commandItems} />
      <AdminNotifications open={notificationsOpen} onOpenChange={setNotificationsOpen} />
    </div>
  );
}

export function AppShell(props: AppShellProps) {
  return (
    <SidebarProvider>
      <AppShellContent {...props} />
    </SidebarProvider>
  );
}
