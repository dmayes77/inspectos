import { Badge } from "@/components/ui/badge";

export function inspectionStatusBadge(status: string) {
  switch (status) {
    case "scheduled":
      return <Badge variant="secondary">Scheduled</Badge>;
    case "in_progress":
      return <Badge className="bg-amber-500 hover:bg-amber-500">In Progress</Badge>;
    case "completed":
      return <Badge className="bg-green-500 hover:bg-green-500">Completed</Badge>;
    case "pending_report":
      return <Badge className="bg-blue-500 hover:bg-blue-500">Pending Report</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export function teamRoleBadge(role: string) {
  switch (role) {
    case "OWNER":
      return <Badge className="bg-purple-500 hover:bg-purple-500">Owner</Badge>;
    case "ADMIN":
      return <Badge className="bg-blue-500 hover:bg-blue-500">Admin</Badge>;
    case "INSPECTOR":
      return <Badge className="bg-primary hover:bg-primary">Inspector</Badge>;
    case "OFFICE_STAFF":
      return <Badge variant="secondary">Office Staff</Badge>;
    default:
      return <Badge variant="outline">{role}</Badge>;
  }
}

export function teamStatusBadge(status: string) {
  switch (status) {
    case "active":
      return <Badge className="bg-green-500 hover:bg-green-500">Active</Badge>;
    case "on_leave":
      return <Badge variant="secondary">On Leave</Badge>;
    case "inactive":
      return <Badge variant="outline">Inactive</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export const inspectionStatusOptions = [
  { value: "all", label: "All" },
  { value: "scheduled", label: "Scheduled" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "pending_report", label: "Pending Report" },
];
