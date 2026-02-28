"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { AdminPageHeader } from "@/layout/admin-page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert } from "@/components/ui/alert";
import {
  Plus,
  Search,
  Mail,
  Phone,
  FileText,
  StickyNote,
  Trash2,
  KeyRound,
  Pencil,
} from "lucide-react";
import { useTeamMembers, useUpdateTeamMember, useDeleteTeamMember, type TeamMember } from "@/hooks/use-team";
import { useProfile } from "@/hooks/use-profile";
import { useApiClient } from "@/lib/api/tenant-context";
import { can } from "@/lib/admin/permissions";
import { teamRoleBadge, teamStatusBadge } from "@/lib/admin/badges";
import { AdminPageSkeleton } from "@/layout/admin-page-skeleton";
import { getPasswordPolicyChecks, validatePasswordPolicy } from "@/lib/password-policy";
import { ModernDataTable } from "@/components/ui/modern-data-table";
import { toSlugIdSegment } from "@/lib/routing/slug-id";

const ROLE_OPTIONS: TeamMember["role"][] = ["OWNER", "ADMIN", "OFFICE_STAFF", "INSPECTOR"];

function getAssignableRoles(currentRole: string): TeamMember["role"][] {
  if (currentRole === "OWNER") return ROLE_OPTIONS;
  if (currentRole === "ADMIN") return ["ADMIN", "OFFICE_STAFF", "INSPECTOR"];
  return [];
}

function canEditRoleForTarget(actorRole: string, targetRole: TeamMember["role"]) {
  if (actorRole === "OWNER") return true;
  if (actorRole === "ADMIN") return targetRole !== "OWNER";
  return false;
}

export default function TeamPage() {
  const apiClient = useApiClient();
  const { data: teamMembers = [], isLoading } = useTeamMembers();
  const { data: profile } = useProfile();
  const updateMember = useUpdateTeamMember();
  const deleteMember = useDeleteTeamMember();

  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [loginDialogMember, setLoginDialogMember] = useState<TeamMember | null>(null);
  const [deleteDialogMember, setDeleteDialogMember] = useState<TeamMember | null>(null);
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isSavingLogin, setIsSavingLogin] = useState(false);
  const loginPasswordChecks = getPasswordPolicyChecks(loginPassword.trim());

  const userRole = (profile?.role ?? "").toUpperCase();
  const userPermissions = profile?.permissions ?? [];
  const canInvite = can(userRole, "create_team", userPermissions);
  const canEditMembers = can(userRole, "edit_team", userPermissions);
  const canDeleteMembers = can(userRole, "delete_team", userPermissions);
  const canManageRoles = can(userRole, "manage_roles", userPermissions);
  const assignableRoles = getAssignableRoles(userRole);

  const inspectors = useMemo(() => teamMembers.filter((m) => m.isInspector), [teamMembers]);
  const activeMembers = useMemo(() => teamMembers.filter((m) => m.status === "active"), [teamMembers]);

  const filteredMembers = useMemo(() => {
    return teamMembers.filter((member) => {
      const matchesRole = roleFilter === "all" || member.role === roleFilter;
      if (!matchesRole) return false;
      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase();
      return member.name.toLowerCase().includes(query) || member.email.toLowerCase().includes(query);
    });
  }, [teamMembers, roleFilter, searchQuery]);

  const roleOptions = [
    { value: "all", label: "All" },
    { value: "INSPECTOR", label: "Inspectors" },
    { value: "OFFICE_STAFF", label: "Office" },
    { value: "ADMIN", label: "Admins" },
    { value: "OWNER", label: "Owners" },
  ];

  const handleRoleChange = async (member: TeamMember, nextRole: TeamMember["role"]) => {
    if (!canEditMembers || !canManageRoles) return;
    if (nextRole === member.role) return;
    if (!canEditRoleForTarget(userRole, member.role)) return;

    await updateMember.mutateAsync({ memberId: member.memberId, role: nextRole });
  };

  const handleColorChange = async (member: TeamMember, color: string) => {
    if (!canEditMembers) return;
    if (!canEditRoleForTarget(userRole, member.role)) return;
    const normalized = color.trim().toUpperCase();
    if (!/^#[0-9A-F]{6}$/.test(normalized)) return;
    await updateMember.mutateAsync({ memberId: member.memberId, color: normalized });
  };

  const handleDelete = async (member: TeamMember) => {
    if (!canDeleteMembers) return;
    if (!canEditRoleForTarget(userRole, member.role)) return;
    await deleteMember.mutateAsync(member.memberId);
    setDeleteDialogMember(null);
  };

  const openLoginDialog = (member: TeamMember) => {
    setLoginDialogMember(member);
    setLoginPassword("");
    setLoginError(null);
  };

  const closeLoginDialog = () => {
    setLoginDialogMember(null);
    setLoginPassword("");
    setLoginError(null);
  };

  const handleResetLogin = async () => {
    if (!loginDialogMember) return;
    setLoginError(null);

    const hasPassword = loginPassword.trim().length > 0;
    if (!hasPassword) {
      setLoginError("Password is required.");
      return;
    }
    if (hasPassword) {
      const passwordError = validatePasswordPolicy(loginPassword.trim());
      if (passwordError) {
        setLoginError(passwordError);
        return;
      }
    }

    setIsSavingLogin(true);
    try {
      await apiClient.put(`/admin/team/${loginDialogMember.memberId}/login`, {
        password: hasPassword ? loginPassword.trim() : undefined,
      });
      closeLoginDialog();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to reset login";
      setLoginError(message);
    } finally {
      setIsSavingLogin(false);
    }
  };

  const teamColumns = useMemo<ColumnDef<TeamMember>[]>(
    () => [
      {
        accessorKey: "member",
        enableSorting: false,
        header: "Member",
        cell: ({ row }) => {
          const member = row.original;
          return (
            <div className="flex items-center gap-2.5">
              <Avatar className="h-8 w-8">
                <AvatarImage src={member.avatarUrl} />
                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                  {member.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <Link href={`/team/${toSlugIdSegment(member.name, member.memberId)}`} className="text-sm font-medium leading-tight hover:underline">
                  {member.name}
                </Link>
                <div className="mt-0.5 text-xs text-muted-foreground">ID# {member.memberId}</div>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "contact",
        enableSorting: false,
        header: "Contact",
        cell: ({ row }) => {
          const member = row.original;
          return (
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Mail className="h-3 w-3" />
                <span className="truncate">{member.email}</span>
              </div>
              <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Phone className="h-3 w-3" />
                <span>{member.phone || "—"}</span>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "role",
        enableSorting: false,
        header: "Access",
        cell: ({ row }) => {
          const member = row.original;
          const canManageThisMemberRole =
            canEditMembers && canManageRoles && canEditRoleForTarget(userRole, member.role);

          if (canManageThisMemberRole) {
            return (
              <Select value={member.role} onValueChange={(value) => void handleRoleChange(member, value as TeamMember["role"])}>
                <SelectTrigger className="h-8 text-xs min-w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {assignableRoles.map((role) => (
                    <SelectItem key={`${member.memberId}-${role}`} value={role} className="text-xs">
                      {role === "OFFICE_STAFF" ? "Office" : role.charAt(0) + role.slice(1).toLowerCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            );
          }

          return <div className="text-xs">{teamRoleBadge(member.role)}</div>;
        },
      },
      {
        accessorKey: "status",
        enableSorting: false,
        header: "Status",
        cell: ({ row }) => <div className="text-xs">{teamStatusBadge(row.original.status)}</div>,
      },
      {
        accessorKey: "color",
        enableSorting: false,
        header: "Color",
        cell: ({ row }) => {
          const member = row.original;
          return (
            <input
              type="color"
              value={member.color ?? "#CBD5E1"}
              onChange={(event) => void handleColorChange(member, event.target.value)}
              aria-label={`${member.name} color`}
              className="h-7 w-7 cursor-pointer rounded-md border border-border bg-transparent p-0"
              disabled={!canEditMembers || !canEditRoleForTarget(userRole, member.role)}
            />
          );
        },
      },
      {
        id: "actions",
        enableSorting: false,
        header: "Actions",
        cell: ({ row }) => {
          const member = row.original;
          const canResetMemberLogin = canEditMembers && canEditRoleForTarget(userRole, member.role);
          const canDeleteMemberRow = canDeleteMembers && canEditRoleForTarget(userRole, member.role);

          return (
            <div className="flex items-center gap-1">
              <Button size="sm" variant="outline" asChild className="h-8 w-8 p-0">
                <Link href={`/team/${toSlugIdSegment(member.name, member.memberId)}`}>
                  <FileText className="h-3.5 w-3.5" />
                  <span className="sr-only">Profile</span>
                </Link>
              </Button>
              {canResetMemberLogin ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openLoginDialog(member)}
                  className="h-8 w-8 p-0"
                >
                  <KeyRound className="h-3.5 w-3.5" />
                  <span className="sr-only">Reset Login</span>
                </Button>
              ) : null}
              {canEditMembers ? (
                <Button size="sm" variant="outline" asChild className="h-8 w-8 p-0">
                  <Link href={`/team/${toSlugIdSegment(member.name, member.memberId)}`}>
                    <Pencil className="h-3.5 w-3.5" />
                    <span className="sr-only">Edit</span>
                  </Link>
                </Button>
              ) : null}
              {canDeleteMemberRow ? (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 w-8 p-0 text-destructive"
                  onClick={() => setDeleteDialogMember(member)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span className="sr-only">Delete</span>
                </Button>
              ) : null}
            </div>
          );
        },
      },
    ],
    [assignableRoles, canDeleteMembers, canEditMembers, canManageRoles, handleDelete, handleRoleChange, userRole]
  );

  if (isLoading) {
    return <AdminPageSkeleton listItems={8} />;
  }

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="Team Members"
        description="Owner command view for access, role assignment, and member operations"
        actions={
          canInvite ? (
            <Button asChild className="sm:w-auto">
              <Link href="/team/new">
                <Plus className="mr-2 h-4 w-4" />
                Add Team Member
              </Link>
            </Button>
          ) : null
        }
      />

      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        <StatCard label="Total Members" value={teamMembers.length} />
        <StatCard label="Inspectors" value={inspectors.length} />
        <StatCard label="Active Members" value={activeMembers.length} />
        <StatCard label="Total Inspections" value={inspectors.reduce((acc, i) => acc + i.inspections, 0)} />
      </div>

      <div className="hidden lg:block">
        <ModernDataTable
          columns={teamColumns}
          data={filteredMembers}
          title="Users"
          description={`${filteredMembers.length} members`}
          filterControls={
            <>
              <div className="relative w-full md:w-[280px]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search by name or email"
                  className="h-9 pl-9"
                />
              </div>
              <div className="flex flex-wrap gap-1.5">
                {roleOptions.map((option) => (
                  <Button
                    key={option.value}
                    type="button"
                    variant={roleFilter === option.value ? "primary" : "outline"}
                    onClick={() => setRoleFilter(option.value)}
                    size="sm"
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </>
          }
          emptyState={
            <div className="rounded-md border border-dashed p-10 text-center">
              <h3 className="text-lg font-semibold">No team members found</h3>
              <p className="mt-2 text-sm text-muted-foreground">Try a different filter or search term.</p>
            </div>
          }
        />
      </div>

      <Card className="card-admin lg:hidden">
        <CardHeader className="pb-2">
          <CardTitle>Users</CardTitle>
          <CardDescription>{filteredMembers.length} members</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-col gap-2">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search by name or email"
                className="h-9 pl-9"
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {roleOptions.map((option) => (
                <Button
                  key={option.value}
                  type="button"
                  variant={roleFilter === option.value ? "primary" : "outline"}
                  onClick={() => setRoleFilter(option.value)}
                  size="sm"
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>

          {filteredMembers.length === 0 ? (
            <div className="rounded-md border border-dashed p-10 text-center">
              <h3 className="text-lg font-semibold">No team members found</h3>
              <p className="mt-2 text-sm text-muted-foreground">Try a different filter or search term.</p>
            </div>
          ) : (
            <div className="grid gap-2">
              {filteredMembers.map((member) => (
                <Card key={member.memberId} className="card-admin">
                  <CardContent className="space-y-2.5 pt-3">
                    <div className="flex items-center gap-2.5">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={member.avatarUrl} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {member.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <Link href={`/team/${toSlugIdSegment(member.name, member.memberId)}`} className="font-medium hover:underline">
                          {member.name}
                        </Link>
                        <div className="text-xs text-muted-foreground truncate">{member.email}</div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className="text-[11px] text-muted-foreground">ID# {member.memberId}</span>
                      {teamRoleBadge(member.role)}
                      {teamStatusBadge(member.status)}
                      <span
                        className="inline-block h-4 w-4 rounded-md border border-border"
                        style={{ backgroundColor: member.color ?? "#CBD5E1" }}
                        aria-label="Member color"
                      />
                      <Badge color="light">{member.phone || "No phone"}</Badge>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/team/${toSlugIdSegment(member.name, member.memberId)}`}>
                          <StickyNote className="mr-1 h-3.5 w-3.5" />Open
                        </Link>
                      </Button>
                      {canEditMembers && canEditRoleForTarget(userRole, member.role) ? (
                        <Button size="sm" variant="outline" onClick={() => openLoginDialog(member)}>
                          <KeyRound className="mr-1 h-3.5 w-3.5" />Reset Login
                        </Button>
                      ) : null}
                      {canEditMembers ? (
                        <Button size="sm" variant="outline" asChild>
                          <Link href={`/team/${toSlugIdSegment(member.name, member.memberId)}`}>
                            Edit
                          </Link>
                        </Button>
                      ) : null}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={Boolean(loginDialogMember)} onOpenChange={(open) => (!open ? closeLoginDialog() : undefined)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User Login</DialogTitle>
            <DialogDescription>
              Set a new password for {loginDialogMember?.name ?? "this member"}.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="reset-password">Password</Label>
              <Input
                id="reset-password"
                type="password"
                value={loginPassword}
                onChange={(event) => setLoginPassword(event.target.value)}
                placeholder="10+ chars, 1 uppercase, 1 number, 1 special"
                autoComplete="new-password"
              />
              {loginPassword ? (
                <div className="space-y-1">
                  {loginPasswordChecks.map((check) => (
                    <p
                      key={check.key}
                      className={`text-xs ${
                        check.met ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"
                      }`}
                    >
                      {check.met ? "✓" : "○"} {check.label}
                    </p>
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          {loginError ? <Alert variant="error" title="Unable to save login" message={loginError} /> : null}

          <DialogFooter>
            <Button variant="outline" onClick={closeLoginDialog} disabled={isSavingLogin}>
              Cancel
            </Button>
            <Button onClick={handleResetLogin} disabled={isSavingLogin}>
              {isSavingLogin ? "Saving..." : "Save Logins"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deleteDialogMember)} onOpenChange={(open) => (!open ? setDeleteDialogMember(null) : undefined)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete team member?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {deleteDialogMember?.name ?? "this member"}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMember.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => (deleteDialogMember ? void handleDelete(deleteDialogMember) : undefined)}
              disabled={deleteMember.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMember.isPending ? "Deleting..." : "Delete Anyway"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
