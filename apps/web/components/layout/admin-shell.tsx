"use client";

import { ReactNode, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import {
  companyMainNav,
  companyPinnedNav,
  companyNavSections,
  companySystemNav,
  platformMainNav,
  platformSystemNav,
} from "@/components/layout/admin-nav";
import { AdminCommandPalette, type CommandItem } from "@/components/layout/admin-command-palette";
import { AdminNotifications } from "@/components/layout/admin-notifications";
import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { AdminHeader } from "@/components/layout/admin-header";
import { AdminMobileNav } from "@/components/layout/admin-mobile-nav";
import { useSettings } from "@/hooks/use-settings";

interface AdminShellProps {
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

export function AdminShell({
  children,
  title,
  showBackButton = false,
  onBack,
  headerActions,
  user,
}: AdminShellProps) {
  const pathname = usePathname();
  const [collapsed] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { data: settings } = useSettings();

  const isPlatformAdmin = pathname.startsWith("/platform");
  const businessName = settings?.company?.name || undefined;
  const businessLogo = settings?.branding?.logoUrl || undefined;
  const timeZone =
    settings?.company?.timezone ||
    Intl.DateTimeFormat().resolvedOptions().timeZone;
  const mainNav = isPlatformAdmin ? platformMainNav : companyMainNav;
  const pinnedNav = isPlatformAdmin ? [] : companyPinnedNav;
  const navSections = isPlatformAdmin ? [] : companyNavSections;
  const systemNav = isPlatformAdmin ? platformSystemNav : companySystemNav;
  const homeHref = isPlatformAdmin ? "/platform" : "/admin/overview";
  const contextLabel = isPlatformAdmin ? "Platform Admin" : user?.companyName;
  const settingsHref = isPlatformAdmin ? "/platform/content" : "/admin/settings";
  const allNavItems = useMemo(
    () => [
      ...mainNav,
      ...pinnedNav,
      ...navSections.flatMap((section) => section.items),
      ...systemNav,
    ],
    [mainNav, pinnedNav, navSections, systemNav]
  );

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
      { label: "New client", description: "Create a client", href: "/admin/clients/new" },
      ...navItems,
    ];
  }, [mainNav, systemNav]);

  const resolvedTitle = useMemo(() => {
    if (title) return title;
    const match = allNavItems
      .filter((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))
      .sort((a, b) => b.href.length - a.href.length)[0];
    if (match?.label) return match.label;
    return isPlatformAdmin ? "Platform" : "Overview";
  }, [title, allNavItems, pathname, isPlatformAdmin]);

  return (
    <div className="admin-shell admin-dense flex h-dvh overflow-hidden bg-background safe-area-inset-left safe-area-inset-right">
      <AdminSidebar
        collapsed={collapsed}
        homeHref={homeHref}
        mainNav={mainNav}
        pinnedNav={pinnedNav}
        navSections={navSections}
        systemNav={systemNav}
        isPlatformAdmin={isPlatformAdmin}
        pathname={pathname}
        businessName={businessName}
        businessLogo={businessLogo}
      />

      <div className="flex flex-1 flex-col overflow-hidden safe-area-inset-top">
        <AdminHeader
          title={resolvedTitle}
          showBackButton={showBackButton}
          onBack={onBack}
          headerActions={headerActions}
          user={user}
          contextLabel={contextLabel}
          settingsHref={settingsHref}
          timeZone={timeZone}
          onOpenMobileNav={() => setMobileNavOpen(true)}
          onOpenCommand={() => setCommandOpen(true)}
          onOpenNotifications={() => setNotificationsOpen(true)}
        />

        <main className="flex-1 overflow-y-auto overflow-x-hidden overscroll-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <div className="admin-content mx-auto w-full max-w-none px-4 py-4 md:px-6 overflow-x-hidden">
            {children}
          </div>
        </main>
      </div>

      <AdminMobileNav
        open={mobileNavOpen}
        onOpenChange={setMobileNavOpen}
        mainNav={mainNav}
        pinnedNav={pinnedNav}
        navSections={navSections}
        systemNav={systemNav}
        isPlatformAdmin={isPlatformAdmin}
        pathname={pathname}
        businessName={businessName}
        businessLogo={businessLogo}
      />

      <AdminCommandPalette open={commandOpen} onOpenChange={setCommandOpen} items={commandItems} />
      <AdminNotifications open={notificationsOpen} onOpenChange={setNotificationsOpen} />
    </div>
  );
}
