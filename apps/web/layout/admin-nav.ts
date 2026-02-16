import {
  Calendar,
  BarChart3,
  CreditCard,
  Receipt,
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
  Folders,
  MapPin,
  IdCard,
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
  { href: "/admin/orders", icon: Folders, label: "Orders" },
  { href: "/admin/schedule", icon: Calendar, label: "Schedule" },
  { href: "/admin/contacts", icon: Users, label: "Contacts" },
  { href: "/admin/agents", icon: IdCard, label: "Agents" },
];

export const companyNavSections: NavSection[] = [
  {
    label: "Operations",
    items: [
      { href: "/admin/properties", icon: MapPin, label: "Properties" },
      { href: "/admin/templates", icon: FileText, label: "Inspection Templates" },
      { href: "/admin/tags", icon: Tag, label: "Tags" },
    ],
  },
  {
    label: "People",
    items: [
      { href: "/admin/team", icon: HardHat, label: "Team" },
      { href: "/admin/vendors", icon: Building2, label: "Vendors" },
    ],
  },
  {
    label: "Communications",
    items: [
      { href: "/admin/communications", icon: FileText, label: "Communications" },
    ],
  },
  {
    label: "Documents & Reports",
    items: [
      { href: "/admin/documents", icon: FileText, label: "Documents" },
      { href: "/admin/reports", icon: BarChart3, label: "Reports" },
    ],
  },
  {
    label: "Finance",
    items: [
      { href: "/admin/invoices", icon: Receipt, label: "Invoices" },
      { href: "/admin/payments", icon: CreditCard, label: "Payments" },
      { href: "/admin/payouts", icon: DollarSign, label: "Payouts" },
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

export const companyMainNav: NavItem[] = [...companyPinnedNav, ...companyNavSections.flatMap((section) => section.items)];

export const companySystemNav: NavItem[] = [];

export const platformMainNav: NavItem[] = [
  { href: "/platform", icon: LayoutDashboard, label: "Overview" },
  { href: "/platform/companies", icon: Building2, label: "Companies" },
  { href: "/platform/features", icon: Flag, label: "Features" },
  { href: "/platform/pricing", icon: DollarSign, label: "Pricing" },
];

export const platformSystemNav: NavItem[] = [{ href: "/platform/content", icon: FileText, label: "Content" }];

export const companyMobileNav: NavItem[] = [
  { href: "/admin/overview", icon: LayoutDashboard, label: "Home" },
  { href: "/admin/orders", icon: Folders, label: "Orders" },
  { href: "/admin/schedule", icon: Calendar, label: "Schedule" },
  { href: "/admin/contacts", icon: Users, label: "Contacts" },
  { href: "/admin/invoices", icon: Receipt, label: "Invoices" },
  { href: "/admin/reports", icon: BarChart3, label: "Reports" },
  { href: "/admin/settings", icon: Settings, label: "Settings" },
];

export const platformMobileNav: NavItem[] = [
  { href: "/platform", icon: LayoutDashboard, label: "Home" },
  { href: "/platform/companies", icon: Building2, label: "Companies" },
  { href: "/platform/features", icon: Flag, label: "Features" },
  { href: "/platform/pricing", icon: DollarSign, label: "Pricing" },
];
