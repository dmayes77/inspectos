"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AdminShell } from "@/components/layout/admin-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { TeamMember } from "@/hooks/use-team";

import { useTeamMembers, useUpdateTeamMember } from "@/hooks/use-team";
import { getPermissionsForRole } from "@/lib/permissions";
import { ArrowLeft } from "lucide-react";
import { Shield } from "lucide-react";
import { Unlock } from "lucide-react";
import { Save } from "lucide-react";
import { Lock } from "lucide-react";
import { permissionCategories } from "@/lib/permissions";

const mockUser = {
  name: "Sarah Johnson",
  email: "sarah@acmeinspections.com",
  companyName: "Acme Home Inspections",
};

const roles = [
  {
    value: "OWNER",
    label: "Owner",
    description: "Full access to all features and settings",
  },
  {
    value: "ADMIN",
    label: "Admin",
    description: "Full access except billing and company deletion",
  },
  {
    value: "INSPECTOR",
    label: "Inspector",
    description: "Field operations and own inspection management",
  },
  {
    value: "OFFICE_STAFF",
    label: "Office Staff",
    description: "Office operations without field work",
  },
];

const certificationsList = ["ASHI", "InterNACHI", "NAHI", "CREIA", "NACHI"];

export default function EditTeamMemberPage() {
  const params = useParams();
  const router = useRouter();
  const { data: teamMembers = [] } = useTeamMembers();
  const updateMember = useUpdateTeamMember();
  const member = teamMembers.find((m) => m.teamMemberId.toLowerCase() === String(params.id).toLowerCase());

  // Parse name into first/last for editing
  const [firstName, setFirstName] = useState(member?.name?.split(" ")[0] || "");
  const [lastName, setLastName] = useState(member?.name?.split(" ").slice(1).join(" ") || "");
  const [selectedRole, setSelectedRole] = useState(member?.role || "INSPECTOR");
  const [selectedStatus, setSelectedStatus] = useState(member?.status || "active");
  const [selectedCertifications, setSelectedCertifications] = useState<string[]>(member?.certifications || []);
  const [customPermissions, setCustomPermissions] = useState<string[]>(member?.customPermissions || []);
  const [isSaving, setIsSaving] = useState(false);

  // Get role-based permissions
  const roleBasedPermissions = getPermissionsForRole(selectedRole);

  // Merge role permissions with custom permissions
  const allEnabledPermissions = Array.from(new Set([...roleBasedPermissions, ...customPermissions]));

  if (!member) {
    return (
      <AdminShell user={mockUser}>
        <div className="flex flex-col items-center justify-center py-12">
          <h1 className="text-2xl font-semibold mb-2">Team Member Not Found</h1>
          <p className="text-muted-foreground mb-6">The team member you&apos;re trying to edit doesn&apos;t exist.</p>
          <Button asChild>
            <Link href="/admin/team">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Team
            </Link>
          </Button>
        </div>
      </AdminShell>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    await updateMember.mutateAsync({
      teamMemberId: member.teamMemberId,
      name: `${firstName} ${lastName}`.trim(),
      email: member.email,
      phone: member.phone,
      role: selectedRole,
      status: selectedStatus,
      certifications: selectedCertifications,
      customPermissions,
      location: member.location,
      inspections: member.inspections,
      rating: member.rating,
      joinedDate: member.joinedDate,
    });
    router.push(`/admin/team/${params.id}`);
  };

  const toggleCertification = (cert: string) => {
    setSelectedCertifications((prev) => (prev.includes(cert) ? prev.filter((c) => c !== cert) : [...prev, cert]));
  };

  const togglePermission = (permissionId: string) => {
    const isRoleBased = roleBasedPermissions.includes(permissionId);

    if (isRoleBased) {
      // If it's a role-based permission, remove it (override to disable)
      setCustomPermissions((prev) => (prev.includes(permissionId) ? prev.filter((p) => p !== permissionId) : [...prev.filter((p) => p !== permissionId)]));
    } else {
      // If it's not a role-based permission, toggle it as custom
      setCustomPermissions((prev) => (prev.includes(permissionId) ? prev.filter((p) => p !== permissionId) : [...prev, permissionId]));
    }
  };

  const isPermissionEnabled = (permissionId: string) => {
    return allEnabledPermissions.includes(permissionId);
  };

  const isPermissionFromRole = (permissionId: string) => {
    return roleBasedPermissions.includes(permissionId);
  };

  const selectedRoleInfo = roles.find((r) => r.value === selectedRole);

  return (
    <AdminShell user={mockUser}>
      <div className="space-y-6 max-w-4xl">
        {/* Back Button */}
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/admin/team/${params.id}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Profile
          </Link>
        </Button>

        {/* Header */}
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            Edit {firstName} {lastName}
          </h1>
          <p className="text-muted-foreground">Update team member information and permissions</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Personal details and contact information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="teamMemberId">Team Member ID</Label>
                <Input id="teamMemberId" defaultValue={member.teamMemberId} disabled className="bg-muted" />
                <p className="text-xs text-muted-foreground">This ID is permanently assigned and cannot be changed</p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input id="email" type="email" defaultValue={member.email} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone *</Label>
                  <Input id="phone" type="tel" defaultValue={member.phone} required />
                </div>
              </div>

              <div className="space-y-2">{/* Bio field removed: not present in TeamMember type */}</div>
            </CardContent>
          </Card>

          {/* Role & Permissions */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                <CardTitle>Role & Permissions</CardTitle>
              </div>
              <CardDescription>Select the role and access level for this team member</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="role">Role *</Label>
                <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value as TeamMember["role"])}>
                  <SelectTrigger id="role">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedRoleInfo && <p className="text-sm text-muted-foreground">{selectedRoleInfo.description}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <Select value={selectedStatus} onValueChange={(value) => setSelectedStatus(value as TeamMember["status"])}>
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="on_leave">On Leave</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Location */}
          <Card>
            <CardHeader>
              <CardTitle>Location</CardTitle>
              <CardDescription>Physical address and service area</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">{/* Address field removed: not present in TeamMember type */}</div>

              <div className="grid gap-4 md:grid-cols-3">{/* City, State, ZIP fields removed: not present in TeamMember type */}</div>
            </CardContent>
          </Card>

          {/* Inspector Specific Fields */}
          {selectedRole === "INSPECTOR" && (
            <Card>
              <CardHeader>
                <CardTitle>Inspector Certifications</CardTitle>
                <CardDescription>Professional certifications and credentials</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {certificationsList.map((cert) => (
                    <div key={cert} className="flex items-center space-x-2">
                      <Checkbox id={cert} checked={selectedCertifications.includes(cert)} onCheckedChange={() => toggleCertification(cert)} />
                      <Label htmlFor={cert} className="text-sm font-normal cursor-pointer">
                        {cert}
                      </Label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Custom Permissions */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Unlock className="h-5 w-5" />
                <CardTitle>Custom Permissions</CardTitle>
              </div>
              <CardDescription>
                Grant or restrict specific permissions beyond the selected role. Permissions marked with
                <Badge variant="secondary" className="mx-1 text-xs">
                  Role
                </Badge>
                are included by default. You can add additional permissions as needed.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {Object.entries(permissionCategories).map(([categoryKey, category]) => (
                <div key={categoryKey}>
                  <h4 className="font-medium mb-3 flex items-center gap-2">{category.label}</h4>
                  <div className="space-y-3 pl-4">
                    {category.permissions.map((permission) => {
                      const isEnabled = isPermissionEnabled(permission.id);
                      const isFromRole = isPermissionFromRole(permission.id);

                      return (
                        <div key={permission.id} className="flex items-start space-x-3">
                          <Checkbox id={permission.id} checked={isEnabled} onCheckedChange={() => togglePermission(permission.id)} />
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <Label htmlFor={permission.id} className="text-sm font-medium cursor-pointer">
                                {permission.label}
                              </Label>
                              {isFromRole && (
                                <Badge variant="secondary" className="text-xs">
                                  <Lock className="mr-1 h-3 w-3" />
                                  From Role
                                </Badge>
                              )}
                              {!isFromRole && isEnabled && (
                                <Badge variant="default" className="text-xs">
                                  Custom
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">{permission.description}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <Separator className="mt-4" />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <Button type="button" variant="outline" asChild>
              <Link href={`/admin/team/${params.id}`}>Cancel</Link>
            </Button>
            <Button type="submit" disabled={isSaving}>
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>
    </AdminShell>
  );
}
