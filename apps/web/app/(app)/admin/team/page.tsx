"use client";

import { useState } from "react";
import Link from "next/link";
import { AdminShell } from "@/components/layout/admin-shell";
import { AdminPageHeader } from "@/components/layout/admin-page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Mail, Phone, MapPin, Star, ClipboardList, Search } from "lucide-react";
import { useTeamMembers } from "@/hooks/use-team";
import { mockAdminUser } from "@/lib/constants/mock-users";
import { teamRoleBadge, teamStatusBadge } from "@/lib/admin/badges";
import { can } from "@/lib/admin/permissions";

function formatShortMemberId(id?: string | null) {
  if (!id) return "TM-0000";
  const clean = id.replace(/-/g, "").toUpperCase();
  return `TM-${clean.slice(-4).padStart(4, "0")}`;
}

export default function TeamPage() {
  const { data: teamMembers = [], isLoading } = useTeamMembers();
  const inspectors = teamMembers.filter((m) => m.role === "INSPECTOR");
  const activeMembers = teamMembers.filter((m) => m.status === "active");
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const userRole = mockAdminUser.role;

  const filteredMembers = teamMembers.filter((member) => {
    const matchesRole = roleFilter === "all" || member.role === roleFilter;
    if (!matchesRole) return false;
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      member.name.toLowerCase().includes(query) ||
      member.email.toLowerCase().includes(query) ||
      member.teamMemberId.toLowerCase().includes(query)
    );
  });

  const roleOptions = [
    { value: "all", label: "All" },
    { value: "INSPECTOR", label: "Inspectors" },
    { value: "OFFICE_STAFF", label: "Office Staff" },
    { value: "ADMIN", label: "Admins" },
    { value: "OWNER", label: "Owners" },
  ];

  return (
    <AdminShell user={mockAdminUser}>
      <div className="space-y-6">
        <AdminPageHeader
          title="Team Members"
          description="Manage team members, roles, and permissions"
          actions={
            can(userRole, "create_team") ? (
            <Button asChild className="sm:w-auto">
              <Link href="/admin/team/new">
                <Plus className="mr-2 h-4 w-4" />
                Add Team Member
              </Link>
            </Button>
            ) : null
          }
        />

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Card>
            <CardContent className="pt-4">
              <div className="text-xl font-bold sm:text-2xl">{teamMembers.length}</div>
              <p className="text-xs text-muted-foreground sm:text-sm">Total Members</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-xl font-bold sm:text-2xl">{inspectors.length}</div>
              <p className="text-xs text-muted-foreground sm:text-sm">Inspectors</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-xl font-bold sm:text-2xl">{activeMembers.length}</div>
              <p className="text-xs text-muted-foreground sm:text-sm">Active Members</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-xl font-bold sm:text-2xl">{inspectors.reduce((acc, i) => acc + i.inspections, 0)}</div>
              <p className="text-xs text-muted-foreground sm:text-sm">Total Inspections</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Team Directory</CardTitle>
            <CardDescription>
              {isLoading ? "Loading..." : `${filteredMembers.length} team members`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search team members..."
                  className="pl-9"
                />
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                {roleOptions.map((option) => (
                  <Button
                    key={option.value}
                    type="button"
                    variant={roleFilter === option.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setRoleFilter(option.value)}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Team Members Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {isLoading ? (
            <div className="col-span-full py-12 text-center text-muted-foreground">Loading…</div>
          ) : filteredMembers.length === 0 ? (
            <div className="col-span-full rounded-lg border border-dashed p-10 text-center">
              <h3 className="text-lg font-semibold">No team members yet</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Invite your first inspector or office staff member.
              </p>
              {can(userRole, "create_team") && (
                <Button asChild className="mt-4">
                  <Link href="/admin/team/new">Add team member</Link>
                </Button>
              )}
            </div>
          ) : (
            filteredMembers.map((member) => (
              <Link key={member.teamMemberId} href={`/admin/team/${member.teamMemberId}`} className="block">
                <Card className="hover:shadow-lg hover:border-primary/50 transition-all cursor-pointer h-full">
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={member.avatarUrl} />
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
                          <span className="text-xs text-muted-foreground">
                            {formatShortMemberId(member.id || member.teamMemberId)}
                          </span>
                          <div className="flex flex-wrap items-center gap-2">
                            {teamRoleBadge(member.role)}
                            {teamStatusBadge(member.status)}
                          </div>
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
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
