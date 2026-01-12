"use client";

import Link from "next/link";
import { AdminShell } from "@/components/layout/admin-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Mail, Phone, MapPin, Star, ClipboardList } from "lucide-react";
import { useTeamMembers } from "@/hooks/use-team";

const mockUser = {
  name: "Sarah Johnson",
  email: "sarah@acmeinspections.com",
  companyName: "Acme Home Inspections",
};

function getRoleBadge(role: string) {
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

function getStatusBadge(status: string) {
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

export default function TeamPage() {
  const { data: teamMembers = [], isLoading } = useTeamMembers();
  const inspectors = teamMembers.filter((m) => m.role === "INSPECTOR");
  const activeMembers = teamMembers.filter((m) => m.status === "active");

  return (
    <AdminShell user={mockUser}>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Team Members</h1>
            <p className="text-muted-foreground">Manage team members, roles, and permissions</p>
          </div>
          <Button asChild>
            <Link href="/admin/team/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Team Member
            </Link>
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{teamMembers.length}</div>
              <p className="text-sm text-muted-foreground">Total Members</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{inspectors.length}</div>
              <p className="text-sm text-muted-foreground">Inspectors</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{activeMembers.length}</div>
              <p className="text-sm text-muted-foreground">Active Members</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{inspectors.reduce((acc, i) => acc + i.inspections, 0)}</div>
              <p className="text-sm text-muted-foreground">Total Inspections</p>
            </CardContent>
          </Card>
        </div>

        {/* Team Members Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {isLoading ? (
            <div className="col-span-full py-12 text-center text-muted-foreground">Loading…</div>
          ) : (
            teamMembers.map((member) => (
              <Link key={member.teamMemberId} href={`/admin/team/${member.teamMemberId}`} className="block">
                <Card className="hover:shadow-lg hover:border-primary/50 transition-all cursor-pointer h-full">
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src="" />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {member.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-base">{member.name}</CardTitle>
                        <CardDescription className="flex flex-col gap-1 mt-1">
                          <span className="text-xs font-mono">{member.teamMemberId}</span>
                          <div>{getRoleBadge(member.role)}</div>
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      {getStatusBadge(member.status)}
                      <div className="flex gap-1">
                        {member.certifications.map((cert) => (
                          <Badge key={cert} variant="outline" className="text-xs">
                            {cert}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="h-4 w-4" />
                        <span className="truncate">{member.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="h-4 w-4" />
                        {member.phone}
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        {member.location}
                      </div>
                    </div>
                    {member.role === "INSPECTOR" && (
                      <div className="flex items-center justify-between border-t pt-4">
                        <div className="flex items-center gap-1">
                          <ClipboardList className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">{member.inspections.toLocaleString()}</span>
                          <span className="text-sm text-muted-foreground">inspections</span>
                        </div>
                        {member.rating && (
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                            <span className="text-sm font-medium">{member.rating}</span>
                          </div>
                        )}
                      </div>
                    )}
                    {member.role !== "INSPECTOR" && <div className="border-t pt-4 text-xs text-muted-foreground">Joined {member.joinedDate}</div>}
                    {/* No Edit button on card */}
                  </CardContent>
                </Card>
              </Link>
            ))
          )}
        </div>
      </div>
    </AdminShell>
  );
}
