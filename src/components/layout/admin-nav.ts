import {
  LayoutDashboard,
  Users,
  ClipboardList,
  FileText,
  Settings,
  HardHat,
  Building2,
  Flag,
  DollarSign,
} from "lucide-react";

export type NavItem = {
  href: string;
  icon: typeof LayoutDashboard;
  label: string;
};

export const companyMainNav: NavItem[] = [
  { href: "/admin/overview", icon: LayoutDashboard, label: "Overview" },
  { href: "/admin/inspections", icon: ClipboardList, label: "Inspections" },
  { href: "/admin/services", icon: ClipboardList, label: "Services" },
  { href: "/admin/team", icon: HardHat, label: "Team" },
  { href: "/admin/clients", icon: Users, label: "Clients" },
  { href: "/admin/templates", icon: FileText, label: "Templates" },
];

export const companySystemNav: NavItem[] = [
  { href: "/admin/settings", icon: Settings, label: "Settings" },
];

export const platformMainNav: NavItem[] = [
  { href: "/platform", icon: LayoutDashboard, label: "Overview" },
  { href: "/platform/companies", icon: Building2, label: "Companies" },
  { href: "/platform/features", icon: Flag, label: "Features" },
  { href: "/platform/pricing", icon: DollarSign, label: "Pricing" },
];

export const platformSystemNav: NavItem[] = [
  { href: "/platform/content", icon: FileText, label: "Content" },
];

export const companyMobileNav: NavItem[] = [
  { href: "/admin/overview", icon: LayoutDashboard, label: "Home" },
  { href: "/admin/inspections", icon: ClipboardList, label: "Inspections" },
  { href: "/admin/team", icon: HardHat, label: "Team" },
  { href: "/admin/clients", icon: Users, label: "Clients" },
  { href: "/admin/settings", icon: Settings, label: "Settings" },
];

export const platformMobileNav: NavItem[] = [
  { href: "/platform", icon: LayoutDashboard, label: "Home" },
  { href: "/platform/companies", icon: Building2, label: "Companies" },
  { href: "/platform/features", icon: Flag, label: "Features" },
  { href: "/platform/pricing", icon: DollarSign, label: "Pricing" },
];
