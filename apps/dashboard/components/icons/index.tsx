// Re-export Lucide icons under the names used throughout the app.
// Import from here to keep icon usage consistent and avoid direct lucide imports scattered everywhere.

export type { LucideProps as IconProps } from "lucide-react";

export {
  // Header / UI
  Menu          as HamburgerIcon,
  X             as CloseXIcon,
  MoreHorizontal as DotsMenuIcon,
  Search        as SearchIcon,
  Bell          as BellIcon,

  // User menu
  CircleUser    as UserCircleIcon,
  Settings      as GearIcon,
  Info          as InfoCircleIcon,
  LogOut        as SignOutIcon,

  // Sidebar nav
  LayoutDashboard as DashboardIcon,
  Folder        as FolderIcon,
  Calendar      as CalendarIcon,
  Users         as UsersIcon,
  Contact       as IdCardIcon,
  MapPin        as MapPinIcon,
  Target        as TargetIcon,
  FileText      as FileTextIcon,
  Tag           as TagIcon,
  Workflow      as WorkflowIcon,
  Zap           as BoltIcon,
  HardHat       as HardHatIcon,
  Building2     as BuildingIcon,
  BarChart2     as BarChartIcon,
  Receipt       as ReceiptIcon,
  CreditCard    as CreditCardIcon,
  DollarSign    as DollarSignIcon,
  ClipboardList as ClipboardListIcon,
  Flag          as FlagIcon,
} from "lucide-react";
