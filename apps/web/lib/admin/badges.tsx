import { Badge } from "@/components/ui/badge";

const COMPACT_TEAM_BADGE_CLASS = "h-5 px-1.5 text-[10px] font-medium leading-none";

export function inspectionStatusBadge(status: string) {
  switch (status) {
    case "scheduled":
      return <Badge color="info">Scheduled</Badge>;
    case "in_progress":
      return <Badge color="warning">In Progress</Badge>;
    case "completed":
      return <Badge color="success">Completed</Badge>;
    case "pending_report":
      return <Badge color="primary">Pending Report</Badge>;
    default:
      return <Badge color="light">{status}</Badge>;
  }
}

export function teamRoleBadge(role: string) {
  switch (role) {
    case "OWNER":
      return <Badge color="primary" variant="solid" className={COMPACT_TEAM_BADGE_CLASS}>Owner</Badge>;
    case "ADMIN":
      return <Badge color="info" variant="solid" className={COMPACT_TEAM_BADGE_CLASS}>Admin</Badge>;
    case "INSPECTOR":
      return <Badge color="primary" className={COMPACT_TEAM_BADGE_CLASS}>Inspector</Badge>;
    case "OFFICE_STAFF":
      return <Badge color="light" className={COMPACT_TEAM_BADGE_CLASS}>Office Staff</Badge>;
    default:
      return <Badge color="light" className={COMPACT_TEAM_BADGE_CLASS}>{role}</Badge>;
  }
}

export function teamStatusBadge(status: string) {
  switch (status) {
    case "active":
      return <Badge color="success" className={COMPACT_TEAM_BADGE_CLASS}>Active</Badge>;
    case "on_leave":
      return <Badge color="warning" className={COMPACT_TEAM_BADGE_CLASS}>On Leave</Badge>;
    case "inactive":
      return <Badge color="light" className={COMPACT_TEAM_BADGE_CLASS}>Inactive</Badge>;
    default:
      return <Badge color="light" className={COMPACT_TEAM_BADGE_CLASS}>{status}</Badge>;
  }
}

export const inspectionStatusOptions = [
  { value: "all", label: "All" },
  { value: "scheduled", label: "Scheduled" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "pending_report", label: "Pending Report" },
];
