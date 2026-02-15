"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AdminPageHeader } from "@/components/layout/admin-page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Save, Shield, Info } from "lucide-react";
import { generateNextTeamMemberId, type TeamMemberRole } from "@/lib/team-member-id";

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

const certifications = ["ASHI", "InterNACHI", "NAHI", "CREIA", "NACHI"];

export default function NewTeamMemberPage() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState("INSPECTOR");
  const [selectedCertifications, setSelectedCertifications] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // TODO: Implement API call to create team member
    router.push("/admin/team");
  };

  const toggleCertification = (cert: string) => {
    setSelectedCertifications((prev) =>
      prev.includes(cert) ? prev.filter((c) => c !== cert) : [...prev, cert]
    );
  };

  const selectedRoleInfo = roles.find((r) => r.value === selectedRole);

  // Mock counters for each role (in production, these would come from the database)
  const roleCounters: Record<string, number> = {
    OWNER: 2, // Last issued: ACM-1002 (Tom Anderson)
    ADMIN: 2, // Shares counter with OWNER
    INSPECTOR: 3, // Last issued: ACM-3003 (David Chen)
    OFFICE_STAFF: 1, // Last issued: ACM-2001 (Jennifer Martinez)
  };

  // Get next ID for selected role
  const getNextTeamMemberId = (role: TeamMemberRole): string => {
    const lastNumber = roleCounters[role] || 0;
    const result = generateNextTeamMemberId({
      companyPrefix: 'ACM',
      role,
      lastIssuedNumberForRole: lastNumber,
    });
    return result.id;
  };

  const nextTeamMemberId = getNextTeamMemberId(selectedRole as TeamMemberRole);

  return (
    <>
    <div className="space-y-6 max-w-4xl">
      {/* Back Button */}

      <AdminPageHeader
        title="Add Team Member"
        description="Create a new team member account with role and permissions"
      />

      {/* Next ID Alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Team Member ID</AlertTitle>
        <AlertDescription>
          This team member will be assigned ID: <span className="font-mono font-semibold">{nextTeamMemberId}</span>
          <br />
          <span className="text-xs">This ID is permanently assigned and will be used for authentication. The leading digit indicates the role type.</span>
        </AlertDescription>
      </Alert>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Personal details and contact information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input id="firstName" placeholder="John" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input id="lastName" placeholder="Doe" required />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input id="email" type="email" placeholder="john@example.com" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone *</Label>
                <Input id="phone" type="tel" placeholder="(555) 123-4567" required />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                placeholder="Brief description of experience and specialties..."
                rows={3}
              />
            </div>
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
              <Select value={selectedRole} onValueChange={setSelectedRole}>
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
              {selectedRoleInfo && (
                <p className="text-sm text-muted-foreground">{selectedRoleInfo.description}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select defaultValue="active">
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
            <div className="space-y-2">
              <Label htmlFor="address">Street Address</Label>
              <Input id="address" placeholder="123 Main St" />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input id="city" placeholder="Austin" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input id="state" placeholder="TX" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="zipCode">ZIP Code</Label>
                <Input id="zipCode" placeholder="78701" />
              </div>
            </div>
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
                {certifications.map((cert) => (
                  <div key={cert} className="flex items-center space-x-2">
                    <Checkbox
                      id={cert}
                      checked={selectedCertifications.includes(cert)}
                      onCheckedChange={() => toggleCertification(cert)}
                    />
                    <Label
                      htmlFor={cert}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {cert}
                    </Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between">
          <Button type="button" variant="outline" asChild>
            <Link href="/admin/team">Cancel</Link>
          </Button>
          <Button type="submit" disabled={isSaving}>
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? "Creating..." : "Create Team Member"}
          </Button>
        </div>
      </form>
    </div>
    </>
  );
}
