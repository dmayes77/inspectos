import {
  Calendar,
  BarChart3,
  CreditCard,
  Receipt,
  Workflow,
  Target,
  LayoutDashboard,
  Users,
  ClipboardList,
  FileText,
  Settings,
  HardHat,
  Building2,
  Flag,
  DollarSign,
  Tag,
} from "lucide-react";

export type NavItem = {
  href: string;
  icon: typeof LayoutDashboard;
  label: string;
};

export type NavSection = {
  label: string;
  items: NavItem[];
};

export const companyPinnedNav: NavItem[] = [
  { href: "/admin/overview", icon: LayoutDashboard, label: "Overview" },
  { href: "/admin/inspections", icon: ClipboardList, label: "Inspections" },
  { href: "/admin/schedule", icon: Calendar, label: "Schedule" },
  { href: "/admin/clients", icon: Users, label: "Contacts" },
];

export const companyNavSections: NavSection[] = [
  {
    label: "Finance",
    items: [
      { href: "/admin/invoices", icon: Receipt, label: "Invoices" },
      { href: "/admin/payments", icon: CreditCard, label: "Payments" },
      { href: "/admin/billing", icon: CreditCard, label: "Billing" },
      { href: "/admin/accounting", icon: DollarSign, label: "Accounting" },
    ],
  },
  {
    label: "Operations",
    items: [
      { href: "/admin/services", icon: ClipboardList, label: "Services" },
      { href: "/admin/templates", icon: FileText, label: "Templates" },
      { href: "/admin/tags", icon: Tag, label: "Tags" },
      { href: "/admin/email-templates", icon: FileText, label: "Email Templates" },
      { href: "/admin/workflows", icon: Workflow, label: "Workflows" },
      { href: "/admin/documents", icon: FileText, label: "Documents" },
      { href: "/admin/reports", icon: BarChart3, label: "Reports" },
      { href: "/admin/automations", icon: Workflow, label: "Automations" },
    ],
  },
  {
    label: "People",
    items: [
      { href: "/admin/team", icon: HardHat, label: "Team" },
      { href: "/admin/hr", icon: Users, label: "HR & Payroll" },
      { href: "/admin/vendors", icon: Building2, label: "Vendors" },
    ],
  },
  {
    label: "Assets",
    items: [
      { href: "/admin/inventory", icon: ClipboardList, label: "Inventory" },
      { href: "/admin/assets", icon: HardHat, label: "Assets" },
    ],
  },
];

export const companyMainNav: NavItem[] = [
  ...companyPinnedNav,
  ...companyNavSections.flatMap((section) => section.items),
];

export const companySystemNav: NavItem[] = [
  { href: "/admin/compliance", icon: Flag, label: "Compliance" },
  { href: "/admin/integrations", icon: Settings, label: "Integrations" },
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
  { href: "/admin/schedule", icon: Calendar, label: "Schedule" },
  { href: "/admin/clients", icon: Users, label: "Contacts" },
  { href: "/admin/invoices", icon: Receipt, label: "Invoices" },
  { href: "/admin/team", icon: HardHat, label: "Team" },
  { href: "/admin/settings", icon: Settings, label: "Settings" },
];

export const platformMobileNav: NavItem[] = [
  { href: "/platform", icon: LayoutDashboard, label: "Home" },
  { href: "/platform/companies", icon: Building2, label: "Companies" },
  { href: "/platform/features", icon: Flag, label: "Features" },
  { href: "/platform/pricing", icon: DollarSign, label: "Pricing" },
];
