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
  { href: "/app/overview", icon: LayoutDashboard, label: "Overview" },
  { href: "/app/orders", icon: Folders, label: "Orders" },
  { href: "/app/schedule", icon: Calendar, label: "Schedule" },
  { href: "/app/contacts", icon: Users, label: "Contacts" },
  { href: "/app/agents", icon: IdCard, label: "Agents" },
];

export const companyNavSections: NavSection[] = [
  {
    label: "Operations",
    items: [
      { href: "/app/properties", icon: MapPin, label: "Properties" },
      { href: "/app/templates", icon: FileText, label: "Inspection Templates" },
      { href: "/app/tags", icon: Tag, label: "Tags" },
    ],
  },
  {
    label: "People",
    items: [
      { href: "/app/team", icon: HardHat, label: "Team" },
      { href: "/app/vendors", icon: Building2, label: "Vendors" },
    ],
  },
  {
    label: "Communications",
    items: [
      { href: "/app/communications", icon: FileText, label: "Communications" },
    ],
  },
  {
    label: "Documents & Reports",
    items: [
      { href: "/app/documents", icon: FileText, label: "Documents" },
      { href: "/app/reports", icon: BarChart3, label: "Reports" },
    ],
  },
  {
    label: "Finance",
    items: [
      { href: "/app/invoices", icon: Receipt, label: "Invoices" },
      { href: "/app/payments", icon: CreditCard, label: "Payments" },
      { href: "/app/payouts", icon: DollarSign, label: "Payouts" },
    ],
  },
  {
    label: "Assets",
    items: [
      { href: "/app/inventory", icon: ClipboardList, label: "Inventory" },
      { href: "/app/assets", icon: HardHat, label: "Assets" },
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
  { href: "/app/overview", icon: LayoutDashboard, label: "Home" },
  { href: "/app/orders", icon: Folders, label: "Orders" },
  { href: "/app/schedule", icon: Calendar, label: "Schedule" },
  { href: "/app/contacts", icon: Users, label: "Contacts" },
  { href: "/app/invoices", icon: Receipt, label: "Invoices" },
  { href: "/app/reports", icon: BarChart3, label: "Reports" },
  { href: "/app/settings", icon: Settings, label: "Settings" },
];

export const platformMobileNav: NavItem[] = [
  { href: "/platform", icon: LayoutDashboard, label: "Home" },
  { href: "/platform/companies", icon: Building2, label: "Companies" },
  { href: "/platform/features", icon: Flag, label: "Features" },
  { href: "/platform/pricing", icon: DollarSign, label: "Pricing" },
];
