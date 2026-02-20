"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AdminPageHeader } from "@/layout/admin-page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { TeamMember } from "@/hooks/use-team";
import { Alert } from "@/components/ui/alert";

import { useTeamMembers, useUpdateTeamMember } from "@/hooks/use-team";
import { useProfile } from "@/hooks/use-profile";
import { Shield } from "lucide-react";
import { Save } from "lucide-react";

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

function getAssignableRoles(currentRole: string) {
  if (currentRole === "OWNER") {
    return roles;
  }
  if (currentRole === "ADMIN") {
    return roles.filter((role) => role.value !== "OWNER");
  }
  return [];
}

export default function EditTeamMemberPage() {
  const params = useParams();
  const router = useRouter();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: teamMembers = [] } = useTeamMembers();
  const updateMember = useUpdateTeamMember();
  const rawMemberId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const memberId = rawMemberId ? String(rawMemberId) : "";
  const member = teamMembers.find((m) => m.memberId.toLowerCase() === memberId.toLowerCase());

  // Parse name into first/last for editing
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedRole, setSelectedRole] = useState<TeamMember["role"]>("INSPECTOR");
  const [selectedStatus, setSelectedStatus] = useState<TeamMember["status"]>("active");
  const [selectedCertifications, setSelectedCertifications] = useState<string[]>([]);
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [stateRegion, setStateRegion] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("US");
  const [isSaving, setIsSaving] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const userRole = (profile?.role ?? "").toUpperCase();
  const canManageTeam = userRole === "OWNER" || userRole === "ADMIN";
  const assignableRoles = getAssignableRoles(userRole);

  useEffect(() => {
    if (!member) return;
    const [first, ...rest] = member.name.split(" ");
    setFirstName(first || "");
    setLastName(rest.join(" "));
    setEmail(member.email || "");
    setPhone(member.phone || "");
    setSelectedRole(member.role || "INSPECTOR");
    setSelectedStatus(member.status || "active");
    setSelectedCertifications(member.certifications || []);
    setAddressLine1(member.addressLine1 || "");
    setAddressLine2(member.addressLine2 || "");
    setCity(member.city || "");
    setStateRegion(member.stateRegion || "");
    setPostalCode(member.postalCode || "");
    setCountry(member.country || "US");
    setAvatarPreview(member.avatarUrl || "");
  }, [member]);

  useEffect(() => {
    if (!assignableRoles.some((role) => role.value === selectedRole) && assignableRoles.length > 0) {
      setSelectedRole(assignableRoles[0].value as TeamMember["role"]);
    }
  }, [assignableRoles, selectedRole]);

  if (profileLoading) {
    return <div className="p-6 text-sm text-muted-foreground">Loading access...</div>;
  }

  if (!canManageTeam) {
    return (
      <div className="space-y-6 max-w-3xl">
        <AdminPageHeader
          title="Edit Team Member"
          description="Only owners and admins can edit team members."
        />
        <Alert
          variant="warning"
          title="Access Restricted"
          message="You do not have permission to edit team members in this business."
        />
        <Button asChild variant="outline">
          <Link href="/admin/team">Back to Team</Link>
        </Button>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <h1 className="text-2xl font-semibold mb-2">Team Member Not Found</h1>
        <p className="text-muted-foreground mb-6">The team member you&apos;re trying to edit doesn&apos;t exist.</p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (
      selectedRole === "INSPECTOR" &&
      (!addressLine1.trim() || !city.trim() || !stateRegion.trim() || !postalCode.trim())
    ) {
      setFormError("Address line 1, city, state, and ZIP are required for inspectors.");
      return;
    }

    setIsSaving(true);
    let avatarUrl = avatarPreview;
    if (avatarPreview && avatarPreview.startsWith("data:")) {
      const response = await fetch(`/api/admin/team/${member.memberId}/avatar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarUrl: avatarPreview }),
      });
      if (response.ok) {
        const json = await response.json();
        avatarUrl = json?.data?.avatarUrl || avatarPreview;
      }
    }
    await updateMember.mutateAsync({
      memberId: member.memberId,
      avatarUrl,
      name: `${firstName} ${lastName}`.trim(),
      email,
      phone,
      role: selectedRole,
      status: selectedStatus,
      certifications: selectedCertifications,
      location: [city, stateRegion].filter(Boolean).join(", "),
      addressLine1,
      addressLine2,
      city,
      stateRegion,
      postalCode,
      country,
      inspections: member.inspections,
      rating: member.rating,
      joinedDate: member.joinedDate,
    });
    router.push(`/admin/team/${member.memberId}`);
  };

  const toggleCertification = (cert: string) => {
    setSelectedCertifications((prev) => (prev.includes(cert) ? prev.filter((c) => c !== cert) : [...prev, cert]));
  };

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      setAvatarPreview(result);
    };
    reader.readAsDataURL(file);
  };

  const selectedRoleInfo = roles.find((r) => r.value === selectedRole);

  return (
    <div className="max-w-5xl space-y-4">
      {/* Back Button */}

      <AdminPageHeader
        title={`Edit ${firstName} ${lastName}`}
        description="Update team member information and permissions"
      />

      <form onSubmit={handleSubmit} className="space-y-4">
        {formError ? (
          <Alert variant="error" title="Missing required fields" message={formError} />
        ) : null}
        {/* Basic Information */}
        <Card className="card-admin">
        <CardHeader className="pb-2">
            <CardTitle>Basic Information</CardTitle>
        <CardDescription>Personal details and contact information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
            <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-center sm:text-left">
              <Avatar className="h-20 w-20">
                <AvatarImage src={avatarPreview} />
                <AvatarFallback className="bg-primary/10 text-lg text-primary">
                  {`${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-2 text-center sm:text-left">
                <Label htmlFor="avatar" className="block text-center sm:text-left">Profile Photo</Label>
                <Input id="avatar" type="file" accept="image/*" onChange={handleAvatarChange} />
                <p className="text-xs text-muted-foreground">PNG or JPG. Max 2MB (mock upload).</p>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone *</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">{/* Bio field removed: not present in TeamMember type */}</div>
          </CardContent>
        </Card>

        {/* Role & Permissions */}
        <Card className="card-admin">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              <CardTitle>Role & Permissions</CardTitle>
            </div>
            <CardDescription>Select the role and access level for this team member</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="role">Role *</Label>
              <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value as TeamMember["role"])}>
                <SelectTrigger id="role">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {assignableRoles.map((role) => (
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
        <Card className="card-admin">
          <CardHeader className="pb-2">
            <CardTitle>Location</CardTitle>
            <CardDescription>Inspector base address for routing and future geofencing</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="addressLine1">Address line 1 {selectedRole === "INSPECTOR" ? "*" : ""}</Label>
              <Input id="addressLine1" value={addressLine1} onChange={(e) => setAddressLine1(e.target.value)} placeholder="123 Main St" required={selectedRole === "INSPECTOR"} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="addressLine2">Address line 2</Label>
              <Input id="addressLine2" value={addressLine2} onChange={(e) => setAddressLine2(e.target.value)} placeholder="Suite, unit, etc." />
            </div>

            <div className="grid gap-3 md:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="city">City {selectedRole === "INSPECTOR" ? "*" : ""}</Label>
                <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Austin" required={selectedRole === "INSPECTOR"} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stateRegion">State {selectedRole === "INSPECTOR" ? "*" : ""}</Label>
                <Input id="stateRegion" value={stateRegion} onChange={(e) => setStateRegion(e.target.value)} placeholder="TX" required={selectedRole === "INSPECTOR"} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="postalCode">ZIP {selectedRole === "INSPECTOR" ? "*" : ""}</Label>
                <Input id="postalCode" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} placeholder="78701" required={selectedRole === "INSPECTOR"} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input id="country" value={country} onChange={(e) => setCountry(e.target.value)} placeholder="US" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Inspector Specific Fields */}
        {selectedRole === "INSPECTOR" && (
          <Card className="card-admin">
            <CardHeader className="pb-2">
              <CardTitle>Inspector Certifications</CardTitle>
              <CardDescription>Professional certifications and credentials</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {certificationsList.map((cert) => (
                  <div key={cert} className="flex items-center space-x-2 rounded-md border px-2 py-1.5">
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

        {/* Permissions */}
        <Card className="card-admin">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              <CardTitle>Permissions Model</CardTitle>
            </div>
            <CardDescription>
              Team access is role-based only. Invite and role-management permissions are locked to owners and admins and cannot be granted as custom permissions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              Role changes take effect immediately. Owners can assign owner, admin, office, and inspector roles. Admins can assign admin, office, and inspector roles.
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-col gap-2 border-t pt-3 sm:flex-row sm:items-center sm:justify-between">
          <Button type="button" variant="outline" size="sm" className="w-full sm:w-auto" asChild>
            <Link href={`/admin/team/${params.id}`}>Cancel</Link>
          </Button>
          <Button type="submit" size="sm" className="w-full sm:w-auto" disabled={isSaving}>
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  );
}
