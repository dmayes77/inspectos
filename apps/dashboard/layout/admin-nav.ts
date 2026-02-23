import {
  Calendar,
  BarChart3,
  CreditCard,
  Receipt,
  LayoutDashboard,
  Inbox,
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
  { href: "/overview", icon: LayoutDashboard, label: "Overview" },
  { href: "/orders", icon: Folders, label: "Orders" },
  { href: "/schedule", icon: Calendar, label: "Schedule" },
  { href: "/contacts", icon: Users, label: "Contacts" },
  { href: "/agents", icon: IdCard, label: "Agents" },
];

export const companyNavSections: NavSection[] = [
  {
    label: "Operations",
    items: [
      { href: "/properties", icon: MapPin, label: "Properties" },
      { href: "/templates", icon: FileText, label: "Inspection Templates" },
      { href: "/tags", icon: Tag, label: "Tags" },
    ],
  },
  {
    label: "People",
    items: [
      { href: "/team", icon: HardHat, label: "Team" },
      { href: "/vendors", icon: Building2, label: "Vendors" },
    ],
  },
  {
    label: "Communications",
    items: [
      { href: "/inbox", icon: Inbox, label: "Inbox" },
      { href: "/communications", icon: FileText, label: "Communications" },
    ],
  },
  {
    label: "Documents & Reports",
    items: [
      { href: "/documents", icon: FileText, label: "Documents" },
      { href: "/reports", icon: BarChart3, label: "Reports" },
    ],
  },
  {
    label: "Finance",
    items: [
      { href: "/invoices", icon: Receipt, label: "Invoices" },
      { href: "/payments", icon: CreditCard, label: "Payments" },
      { href: "/payouts", icon: DollarSign, label: "Payouts" },
    ],
  },
  {
    label: "Assets",
    items: [
      { href: "/inventory", icon: ClipboardList, label: "Inventory" },
      { href: "/assets", icon: HardHat, label: "Assets" },
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
  { href: "/overview", icon: LayoutDashboard, label: "Home" },
  { href: "/orders", icon: Folders, label: "Orders" },
  { href: "/schedule", icon: Calendar, label: "Schedule" },
  { href: "/contacts", icon: Users, label: "Contacts" },
  { href: "/invoices", icon: Receipt, label: "Invoices" },
  { href: "/reports", icon: BarChart3, label: "Reports" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

export const platformMobileNav: NavItem[] = [
  { href: "/platform", icon: LayoutDashboard, label: "Home" },
  { href: "/platform/companies", icon: Building2, label: "Companies" },
  { href: "/platform/features", icon: Flag, label: "Features" },
  { href: "/platform/pricing", icon: DollarSign, label: "Pricing" },
];
