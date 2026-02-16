import { Badge } from "@/components/ui/badge";

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
      return <Badge color="primary" variant="solid">Owner</Badge>;
    case "ADMIN":
      return <Badge color="info" variant="solid">Admin</Badge>;
    case "INSPECTOR":
      return <Badge color="primary">Inspector</Badge>;
    case "OFFICE_STAFF":
      return <Badge color="light">Office Staff</Badge>;
    default:
      return <Badge color="light">{role}</Badge>;
  }
}

export function teamStatusBadge(status: string) {
  switch (status) {
    case "active":
      return <Badge color="success">Active</Badge>;
    case "on_leave":
      return <Badge color="warning">On Leave</Badge>;
    case "inactive":
      return <Badge color="light">Inactive</Badge>;
    default:
      return <Badge color="light">{status}</Badge>;
  }
}

export const inspectionStatusOptions = [
  { value: "all", label: "All" },
  { value: "scheduled", label: "Scheduled" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "pending_report", label: "Pending Report" },
];
