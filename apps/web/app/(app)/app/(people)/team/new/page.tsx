"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AdminPageHeader } from "@/layout/admin-page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert } from "@/components/ui/alert";
import { Save, Shield } from "lucide-react";
import { useProfile } from "@/hooks/use-profile";
import { useCreateTeamMember } from "@/hooks/use-team";
import { can } from "@/lib/admin/permissions";
import { getPasswordPolicyChecks, validatePasswordPolicy } from "@/lib/password-policy";

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

function getAssignableRoles(currentRole: string) {
  if (currentRole === "OWNER") {
    return roles;
  }
  if (currentRole === "ADMIN") {
    return roles.filter((role) => role.value !== "OWNER");
  }
  return [];
}

export default function NewTeamMemberPage() {
  const router = useRouter();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const createMember = useCreateTeamMember();
  const [selectedRole, setSelectedRole] = useState("INSPECTOR");
  const [selectedCertifications, setSelectedCertifications] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [sendLoginDetails, setSendLoginDetails] = useState(false);
  const [isInspector, setIsInspector] = useState(false);
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [stateRegion, setStateRegion] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("US");
  const [formError, setFormError] = useState<string | null>(null);
  const passwordChecks = getPasswordPolicyChecks(password);
  const requiresInspectorAddress =
    selectedRole === "INSPECTOR" ||
    ((selectedRole === "OWNER" || selectedRole === "ADMIN") && isInspector);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (
      requiresInspectorAddress &&
      (!addressLine1.trim() || !city.trim() || !stateRegion.trim() || !postalCode.trim())
    ) {
      setFormError("Address line 1, city, state, and ZIP are required for inspectors.");
      return;
    }

    if (password.trim()) {
      const passwordError = validatePasswordPolicy(password.trim());
      if (passwordError) {
        setFormError(passwordError);
        return;
      }
    }

    setIsSaving(true);
    try {
      await createMember.mutateAsync({
        name: `${firstName} ${lastName}`.trim(),
        email,
        password,
        sendLoginDetails,
        phone,
        role: selectedRole as "OWNER" | "ADMIN" | "INSPECTOR" | "OFFICE_STAFF",
        isInspector:
          selectedRole === "INSPECTOR"
            ? true
            : selectedRole === "OWNER" || selectedRole === "ADMIN"
              ? isInspector
              : false,
        addressLine1,
        addressLine2,
        city,
        stateRegion,
        postalCode,
        country,
      });
      router.push("/app/team");
    } finally {
      setIsSaving(false);
    }
  };

  const toggleCertification = (cert: string) => {
    setSelectedCertifications((prev) =>
      prev.includes(cert) ? prev.filter((c) => c !== cert) : [...prev, cert]
    );
  };

  const selectedRoleInfo = roles.find((r) => r.value === selectedRole);

  const userRole = (profile?.role ?? "").toUpperCase();
  const userPermissions = profile?.permissions ?? [];
  const canInvite = can(userRole, "create_team", userPermissions);
  const assignableRoles = getAssignableRoles(userRole);

  useEffect(() => {
    if (assignableRoles.length > 0 && !assignableRoles.some((role) => role.value === selectedRole)) {
      setSelectedRole(assignableRoles[0].value);
    }
  }, [assignableRoles, selectedRole]);

  useEffect(() => {
    if (selectedRole === "INSPECTOR") {
      setIsInspector(true);
      return;
    }
    if (selectedRole !== "OWNER" && selectedRole !== "ADMIN") {
      setIsInspector(false);
    }
  }, [selectedRole]);

  if (profileLoading) {
    return <div className="p-6 text-sm text-muted-foreground">Loading access...</div>;
  }

  if (!canInvite) {
    return (
      <div className="space-y-6 max-w-3xl">
        <AdminPageHeader
          title="Add Team Member"
          description="Only owners and admins can send team invites."
        />
        <Card>
          <CardHeader>
            <CardTitle>Access Restricted</CardTitle>
            <CardDescription>
              You do not have permission to invite members to this business.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link href="/app/team">Back to Team</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
    <div className="max-w-5xl space-y-4">
      {/* Back Button */}

      <AdminPageHeader
        title="Add Team Member"
        description="Create a new team member account with role and permissions"
      />

      <Alert
        variant="info"
        title="Identity Model"
        message="Members sign in with their globally unique email. Internal UUID identity is managed automatically."
      />

      <form onSubmit={handleSubmit} className="space-y-4">
        {formError ? (
          <Alert variant="error" title="Missing required fields" message={formError} />
        ) : null}
        {/* Basic Information */}
        <Card className="card-admin">
          <CardHeader className="pb-2">
            <CardTitle>Add A New User</CardTitle>
            <CardDescription>Member setup and access configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input id="firstName" placeholder="John" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input id="lastName" placeholder="Doe" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input id="email" type="email" placeholder="john@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone *</Label>
                <Input id="phone" type="tel" placeholder="(555) 123-4567" value={phone} onChange={(e) => setPhone(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="10+ chars, 1 uppercase, 1 number, 1 special"
                  value={password}
                  minLength={password ? 10 : undefined}
                  onChange={(e) => setPassword(e.target.value)}
                />
                {password ? (
                  <div className="mt-2 space-y-1">
                    {passwordChecks.map((check) => (
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

            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="role">Permissions *</Label>
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Role-based access</span>
                </div>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
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
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="send-login-details"
                checked={sendLoginDetails}
                onCheckedChange={(value) => setSendLoginDetails(Boolean(value))}
              />
              <Label htmlFor="send-login-details" className="text-xs uppercase tracking-wide text-muted-foreground">
                Send user login details?
              </Label>
            </div>

            {(selectedRole === "OWNER" || selectedRole === "ADMIN" || selectedRole === "INSPECTOR") ? (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="also-inspector"
                  checked={selectedRole === "INSPECTOR" ? true : isInspector}
                  disabled={selectedRole === "INSPECTOR"}
                  onCheckedChange={(value) => setIsInspector(Boolean(value))}
                />
                <Label htmlFor="also-inspector" className="text-xs uppercase tracking-wide text-muted-foreground">
                  Also inspector (billable seat)
                </Label>
              </div>
            ) : null}

            {selectedRoleInfo && (
              <p className="text-xs text-muted-foreground">{selectedRoleInfo.description}</p>
            )}
          </CardContent>
        </Card>

        {/* Additional Options */}
        <Card className="card-admin">
          <CardHeader className="pb-2">
            <CardTitle>Additional Options</CardTitle>
            <CardDescription>Address is optional, required for inspectors</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="address">Street Address {requiresInspectorAddress ? "*" : ""}</Label>
              <Input id="address" placeholder="123 Main St" value={addressLine1} onChange={(e) => setAddressLine1(e.target.value)} required={requiresInspectorAddress} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address2">Address Line 2</Label>
              <Input id="address2" placeholder="Suite, unit, etc." value={addressLine2} onChange={(e) => setAddressLine2(e.target.value)} />
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="city">City {requiresInspectorAddress ? "*" : ""}</Label>
                <Input id="city" placeholder="Austin" value={city} onChange={(e) => setCity(e.target.value)} required={requiresInspectorAddress} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State {requiresInspectorAddress ? "*" : ""}</Label>
                <Input id="state" placeholder="TX" value={stateRegion} onChange={(e) => setStateRegion(e.target.value)} required={requiresInspectorAddress} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="zipCode">ZIP Code {requiresInspectorAddress ? "*" : ""}</Label>
                <Input id="zipCode" placeholder="78701" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} required={requiresInspectorAddress} />
              </div>
              <div className="space-y-2 md:col-span-3">
                <Label htmlFor="country">Country</Label>
                <Input id="country" placeholder="US" value={country} onChange={(e) => setCountry(e.target.value)} />
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
                {certifications.map((cert) => (
                  <div key={cert} className="flex items-center space-x-2 rounded-md border px-2 py-1.5">
                    <Checkbox
                      id={cert}
                      checked={selectedCertifications.includes(cert)}
                      onCheckedChange={() => toggleCertification(cert)}
                    />
                    <Label
                      htmlFor={cert}
                      className="cursor-pointer text-sm font-normal"
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
        <div className="flex items-center justify-between border-t pt-3">
          <Button type="button" variant="outline" size="sm" asChild>
            <Link href="/app/team">Cancel</Link>
          </Button>
          <Button type="submit" size="sm" disabled={isSaving}>
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? "Creating..." : "Create Team Member"}
          </Button>
        </div>
      </form>
    </div>
    </>
  );
}
