"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Building2,
  Palette,
  Bell,
  Users,
  Plug,
  CreditCard,
  ShieldCheck,
  ChevronRight,
  Workflow,
  Zap,
  Mail,
  Target,
} from "lucide-react";

const NAV_SECTIONS = [
  {
    label: "General",
    items: [
      { href: "/settings/company",       label: "Company",          icon: Building2  },
      { href: "/settings/branding",      label: "Branding",         icon: Palette    },
    ],
  },
  {
    label: "Workspace",
    items: [
      { href: "/settings/notifications", label: "Notifications",    icon: Bell       },
      { href: "/settings/team",          label: "Team & Roles",     icon: Users      },
    ],
  },
  {
    label: "Configuration",
    items: [
      { href: "/settings/services",               label: "Services",         icon: Target     },
      { href: "/settings/workflows",              label: "Workflows",        icon: Workflow   },
      { href: "/settings/automations",            label: "Automations",      icon: Zap        },
      { href: "/settings/email-templates",        label: "Email Templates",  icon: Mail       },
    ],
  },
  {
    label: "Account",
    items: [
      { href: "/settings/integrations",  label: "Integrations",     icon: Plug       },
      { href: "/settings/integrations/smtp", label: "SMTP",         icon: Mail       },
      { href: "/settings/billing",       label: "Billing",          icon: CreditCard },
      { href: "/settings/compliance",    label: "Compliance",       icon: ShieldCheck},
    ],
  },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-semibold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your company settings and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[224px_1fr] gap-6 lg:gap-8 items-start">
        {/* Left nav */}
        <aside className="lg:sticky lg:top-6">
          <nav className="flex flex-col gap-5">
            {NAV_SECTIONS.map((section) => (
              <div key={section.label}>
                <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                  {section.label}
                </p>
                <ul className="flex flex-col gap-0.5">
                  {section.items.map(({ href, label, icon: Icon }) => {
                    const isActive = pathname === href || pathname.startsWith(href + "/");
                    return (
                      <li key={href}>
                        <Link
                          href={href}
                          className={cn(
                            "group flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                            isActive
                              ? "bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground"
                          )}
                        >
                          <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-brand-500" : "text-muted-foreground group-hover:text-foreground")} />
                          <span className="flex-1">{label}</span>
                          {isActive && <ChevronRight className="h-3.5 w-3.5 text-brand-400" />}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>
        </aside>

        {/* Right content */}
        <div className="min-w-0">
          {children}
        </div>
      </div>
    </div>
  );
}
