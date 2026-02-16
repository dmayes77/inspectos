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

interface AdminShellProps {
  children: ReactNode;
  headerActions?: ReactNode;
  user?: {
    name: string;
    email: string;
    avatarUrl?: string;
    companyName?: string;
  };
}

function AdminShellContent({ children, headerActions, user }: AdminShellProps) {
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
  const homeHref = isPlatformAdmin ? "/platform" : "/admin/overview";
  const contextLabel = isPlatformAdmin ? "Platform Admin" : user?.companyName;
  const settingsHref = isPlatformAdmin ? "/platform/content" : "/admin/settings";

  const commandItems = useMemo<CommandItem[]>(() => {
    const navItems = [...mainNav, ...systemNav].map((item) => ({
      label: item.label,
      description: "Navigate",
      href: item.href,
      keywords: [item.label],
    }));
    return [
      { label: "Overview", description: "Admin dashboard", href: "/admin/overview" },
      { label: "New inspection", description: "Schedule an inspection", href: "/admin/inspections/new" },
      { label: "Add team member", description: "Invite a teammate", href: "/admin/team/new" },
      { label: "New client", description: "Create a client", href: "/admin/contacts/new" },
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
          <div className="admin-content admin-dense mx-auto w-full max-w-none px-4 py-4 md:px-6">
            {children}
          </div>
        </main>
      </div>

      <AdminCommandPalette open={commandOpen} onOpenChange={setCommandOpen} items={commandItems} />
      <AdminNotifications open={notificationsOpen} onOpenChange={setNotificationsOpen} />
    </div>
  );
}

export function AdminShell(props: AdminShellProps) {
  return (
    <SidebarProvider>
      <AdminShellContent {...props} />
    </SidebarProvider>
  );
}
