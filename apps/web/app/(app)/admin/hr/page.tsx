"use client";

import { AdminShell } from "@/components/layout/admin-shell";
import { AdminPageHeader } from "@/components/layout/admin-page-header";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Plus, UserCheck } from "lucide-react";
import { mockAdminUser } from "@/lib/constants/mock-users";
import { useTeamMembers } from "@/hooks/use-team";
import { teamRoleBadge, teamStatusBadge } from "@/lib/admin/badges";

export default function HrPage() {
  const { data: teamMembers = [], isLoading } = useTeamMembers();
  return (
    <AdminShell user={mockAdminUser}>
      <div className="space-y-6">
        <AdminPageHeader
          title="HR & Payroll"
          description="Track time, certifications, and payroll exports"
          actions={
            <Button className="sm:w-auto" asChild>
              <Link href="/admin/team/new">
                <Plus className="mr-2 h-4 w-4" />
                Add Employee
              </Link>
            </Button>
          }
        />

        <Card>
          <CardHeader>
            <CardTitle>Employee Roster</CardTitle>
            <CardDescription>
              Team members added in the Team directory automatically appear here for payroll.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="py-8 text-center text-sm text-muted-foreground">Loading employees...</div>
            ) : teamMembers.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-10 text-center">
                <UserCheck className="h-10 w-10 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">No employees yet</p>
                  <p className="text-xs text-muted-foreground">
                    Add team members to start tracking payroll and certifications.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {teamMembers.map((member) => (
                  <Link
                    key={member.teamMemberId}
                    href={`/admin/team/${member.teamMemberId}`}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4 text-sm hover:bg-muted/50"
                  >
                    <div className="space-y-1">
                      <p className="font-medium">{member.name}</p>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="outline">{member.teamMemberId}</Badge>
                        {teamRoleBadge(member.role)}
                        {teamStatusBadge(member.status)}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {member.email}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Time & Attendance</CardTitle>
            <CardDescription>Capture hours, PTO, and payroll summaries.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-10 text-center">
              <Users className="h-10 w-10 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">No time entries yet</p>
                <p className="text-xs text-muted-foreground">
                  Track inspector hours, mileage, and certifications.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}
