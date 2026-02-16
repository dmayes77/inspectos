"use client";

// Helper for role description
function getRoleDescription(role: string): string {
  switch (role) {
    case "OWNER":
      return "Full access to all features and settings";
    case "ADMIN":
      return "Full access except billing and company deletion";
    case "INSPECTOR":
      return "Field operations and own inspection management";
    case "OFFICE_STAFF":
      return "Office operations without field work";
    default:
      return role;
  }
}
import { Shield, Unlock, Lock } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { permissionCategories, getPermissionsForRole } from "@/lib/permissions";
import { teamRoleBadge, teamStatusBadge } from "@/lib/admin/badges";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AdminPageHeader } from "@/layout/admin-page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Mail, Phone, MapPin, Star, ClipboardList, Edit, Trash2 } from "lucide-react";
import { useState } from "react";
import { useTeamMembers, useUpdateTeamMember, useDeleteTeamMember, TeamMember } from "@/hooks/use-team";

function formatShortMemberId(id?: string | null) {
  if (!id) return "TM-0000";
  const clean = id.replace(/-/g, "").toUpperCase();
  return `TM-${clean.slice(-4).padStart(4, "0")}`;
}

function isUuid(value: string) {
  return /^[0-9a-fA-F-]{36}$/.test(value);
}

export default function TeamMemberDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: teamMembers = [] } = useTeamMembers();
  const updateMember = useUpdateTeamMember();
  const deleteMember = useDeleteTeamMember();
  const rawMemberId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const memberId = rawMemberId ? String(rawMemberId) : "";
  const member = teamMembers.find((m) => m.teamMemberId.toLowerCase() === memberId.toLowerCase());
  const resolvedMemberId = member?.teamMemberId && isUuid(member.teamMemberId) ? member.teamMemberId : "";
  const [form, setForm] = useState<Partial<TeamMember>>(member || {});
  const [editing, setEditing] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Fix: define memberRolePermissions after member is available
  const memberRolePermissions = member ? getPermissionsForRole(member.role) : [];

  if (!member || !resolvedMemberId) {
    return (
      <div className="p-8">Not found.</div>
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvedMemberId) {
      return;
    }
    updateMember.mutate({ teamMemberId: resolvedMemberId, ...form });
    setEditing(false);
  };

  const handleDelete = () => {
    if (!resolvedMemberId) {
      return;
    }
    deleteMember.mutate(resolvedMemberId);
    setDeleteDialogOpen(false);
    router.push("/admin/team");
  };

  return (
    <div className="space-y-6">
      {/* Back Button */}

      <AdminPageHeader
        title={
          <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-start sm:text-left">
            <Avatar className="h-20 w-20 sm:h-24 sm:w-24">
              <AvatarImage src={member.avatarUrl} />
              <AvatarFallback className="bg-primary/10 text-xl text-primary sm:text-2xl">
                {member.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex flex-col items-center gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-start">
                <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{member.name}</h1>
                <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                  {teamRoleBadge(member.role)}
                  {teamStatusBadge(member.status)}
                </div>
              </div>
              <div className="mt-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {formatShortMemberId(member.id || member.teamMemberId)}
              </div>
              <div className="mt-2 flex items-center justify-center gap-2 text-sm text-muted-foreground sm:justify-start">
                <span className="font-medium">Joined</span>
                <span>{member.joinedDate}</span>
              </div>
              {member.role ? (
                <div className="mt-2 text-xs text-muted-foreground">
                  <span className="font-medium">Role:</span> {getRoleDescription(member.role)}
                </div>
              ) : null}
              {member.certifications.length > 0 ? (
                <div className="mt-2 flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground sm:justify-start">
                  <span className="font-medium">License:</span>
                  <span>{member.certifications.join(", ")}</span>
                </div>
              ) : null}
            </div>
          </div>
        }
        actions={
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            {(member.role === "INSPECTOR" || member.role === "OWNER" || member.role === "ADMIN") ? (
              <Button variant="outline" className="w-full sm:w-auto" asChild>
                <Link href={`/admin/team/${member.teamMemberId}/schedule`}>
                  <ClipboardList className="mr-2 h-4 w-4" />
                  Schedule
                </Link>
              </Button>
            ) : null}
            <Button variant="outline" className="w-full sm:w-auto" asChild>
              <Link href={`/admin/team/${member.teamMemberId}/availability`}>
                <Star className="mr-2 h-4 w-4" />
                Availability
              </Link>
            </Button>
            <Button className="w-full sm:w-auto" asChild>
              <Link href={`/admin/team/${member.teamMemberId}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </Button>
            <Button variant="outline" className="w-full sm:w-auto">
              {member.status === "active" ? "Deactivate" : "Activate"}
            </Button>
            <Button
              variant="outline"
              className="w-full text-destructive hover:bg-destructive hover:text-destructive-foreground sm:w-auto"
              onClick={() => setDeleteDialogOpen(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        }
      />

      {/* Details Row: Contact Info & Certifications */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* Contact Info */}
        <Card className="flex-1">
          <CardHeader>
            <CardTitle className="text-base">Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Email</p>
                <a href={`mailto:${member.email}`} className="text-sm text-primary hover:underline">
                  {member.email}
                </a>
              </div>
            </div>
            <Separator />
            <div className="flex items-start gap-3">
              <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Phone</p>
                <a href={`tel:${member.phone}`} className="text-sm text-primary hover:underline">
                  {member.phone}
                </a>
              </div>
            </div>
            <Separator />
            <div className="flex items-start gap-3">
              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Location</p>
                <p className="text-sm text-muted-foreground">{member.location}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Certifications */}
        {member.certifications.length > 0 && (
          <Card className="flex-1 md:max-w-xs">
            <CardHeader>
              <CardTitle className="text-base">Certifications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {member.certifications.map((cert) => (
                  <Badge key={cert} color="light">
                    {cert}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Role & Permissions below */}
      <div className="mt-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              <CardTitle>Role & Permissions</CardTitle>
            </div>
            <div className="text-muted-foreground text-sm mt-1">
              Permissions granted by the <span className="font-semibold">{member.role.charAt(0) + member.role.slice(1).toLowerCase()}</span> role
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {Object.entries(permissionCategories).map(([categoryKey, category]) => {
              const perms = category.permissions.filter((p) => memberRolePermissions.includes(p.id));
              if (perms.length === 0) return null;
              return (
                <div key={categoryKey}>
                  <h4 className="font-medium mb-3 flex items-center gap-2">{category.label}</h4>
                  <div className="space-y-3 pl-4">
                    {perms.map((permission) => (
                      <div key={permission.id} className="flex items-start space-x-3">
                        <span className="h-2 w-2 mt-2 rounded-full bg-primary inline-block" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{permission.label}</span>
                            <Badge color="light" className="text-xs">
                              <Lock className="mr-1 h-3 w-3" />
                              From Role
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">{permission.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Separator className="mt-4" />
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Custom Permissions */}
      {member.customPermissions && member.customPermissions.length > 0 && (
        <div className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Unlock className="h-5 w-5" />
                <CardTitle>Custom Permissions</CardTitle>
              </div>
              <div className="text-muted-foreground text-sm mt-1">Permissions granted directly to this member (in addition to their role)</div>
            </CardHeader>
            <CardContent className="space-y-6">
              {Object.entries(permissionCategories).map(([categoryKey, category]) => {
                const perms = category.permissions.filter((p) => member.customPermissions.includes(p.id));
                if (perms.length === 0) return null;
                return (
                  <div key={categoryKey}>
                    <h4 className="font-medium mb-3 flex items-center gap-2">{category.label}</h4>
                    <div className="space-y-3 pl-4">
                      {perms.map((permission) => (
                        <div key={permission.id} className="flex items-start space-x-3">
                          <span className="h-2 w-2 mt-2 rounded-full bg-amber-500 inline-block" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">{permission.label}</span>
                              <Badge color="light" className="text-xs border-amber-500 text-amber-700">
                                <Unlock className="mr-1 h-3 w-3" />
                                Custom
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">{permission.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <Separator className="mt-4" />
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Inspector Stats (if applicable) */}
      {member.role === "INSPECTOR" && (
        <div className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Inspector Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <ClipboardList className="h-4 w-4" />
                  <span className="text-sm">Total Inspections</span>
                </div>
                <span className="text-lg font-bold">{member.inspections.toLocaleString()}</span>
              </div>
              {member.rating && (
                <>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Star className="h-4 w-4" />
                      <span className="text-sm">Average Rating</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                      <span className="text-lg font-bold">{member.rating}</span>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent Activity */}

      {/* Edit Form */}
      {editing && (
        <Card className="my-4">
          <CardHeader>
            <CardTitle>Edit Team Member</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label>Name</label>
                <input name="name" value={form.name || ""} onChange={handleChange} required className="w-full border rounded px-2 py-1" />
              </div>
              <div className="space-y-2">
                <label>Email</label>
                <input name="email" value={form.email || ""} onChange={handleChange} required className="w-full border rounded px-2 py-1" />
              </div>
              <div className="space-y-2">
                <label>Phone</label>
                <input name="phone" value={form.phone || ""} onChange={handleChange} className="w-full border rounded px-2 py-1" />
              </div>
              <div className="space-y-2">
                <label>Role</label>
                <select name="role" value={form.role || "INSPECTOR"} onChange={handleChange} className="w-full border rounded px-2 py-1">
                  <option value="OWNER">Owner</option>
                  <option value="ADMIN">Admin</option>
                  <option value="INSPECTOR">Inspector</option>
                  <option value="OFFICE_STAFF">Office Staff</option>
                </select>
              </div>
              <div className="space-y-2">
                <label>Status</label>
                <select name="status" value={form.status || "active"} onChange={handleChange} className="w-full border rounded px-2 py-1">
                  <option value="active">Active</option>
                  <option value="on_leave">On Leave</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="space-y-2">
                <label>Location</label>
                <input name="location" value={form.location || ""} onChange={handleChange} className="w-full border rounded px-2 py-1" />
              </div>
              <div className="space-y-2">
                <label>Certifications (comma separated)</label>
                <input
                  name="certifications"
                  value={form.certifications ? form.certifications.join(", ") : ""}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      certifications: e.target.value
                        .split(",")
                        .map((c) => c.trim())
                        .filter(Boolean),
                    }))
                  }
                  className="w-full border rounded px-2 py-1"
                />
              </div>
              {form.role === "INSPECTOR" && (
                <>
                  <div className="space-y-2">
                    <label>Inspections</label>
                    <input
                      name="inspections"
                      type="number"
                      value={form.inspections || 0}
                      onChange={handleChange}
                      className="w-full border rounded px-2 py-1"
                    />
                  </div>
                  <div className="space-y-2">
                    <label>Rating</label>
                    <input
                      name="rating"
                      type="number"
                      step="0.1"
                      value={form.rating || ""}
                      onChange={handleChange}
                      className="w-full border rounded px-2 py-1"
                    />
                  </div>
                </>
              )}
              <div className="space-y-2">
                <label>Custom Permissions (comma separated IDs)</label>
                <input
                  name="customPermissions"
                  value={form.customPermissions ? form.customPermissions.join(", ") : ""}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      customPermissions: e.target.value
                        .split(",")
                        .map((p) => p.trim())
                        .filter(Boolean),
                    }))
                  }
                  className="w-full border rounded px-2 py-1"
                />
                <div className="text-xs text-muted-foreground">IDs must match permission IDs in the system.</div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={updateMember.isPending}>
                  Save Changes
                </Button>
                <Button type="button" variant="outline" onClick={() => setEditing(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate Team Member?</AlertDialogTitle>
            <AlertDialogDescription>
              This will deactivate <span className="font-semibold">{member.name}</span>. You can reactivate them later from the team list.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-white">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
