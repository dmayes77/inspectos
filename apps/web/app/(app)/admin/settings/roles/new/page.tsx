"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AdminShell } from "@/components/layout/admin-shell";
import { AdminPageHeader } from "@/components/layout/admin-page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/ui/back-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Save, Shield, Lightbulb } from "lucide-react";
import { permissionCategories } from "@/lib/permissions";
import { mockAdminUser } from "@/lib/constants/mock-users";

const roleTemplates = [
  {
    name: "Senior Inspector",
    description: "Inspector with additional management permissions",
    permissions: [
      "view_all_inspections",
      "view_own_inspections",
      "create_inspections",
      "edit_inspections",
      "perform_inspections",
      "assign_inspections",
      "view_reports",
      "generate_reports",
      "edit_reports",
      "deliver_reports",
      "view_clients",
      "create_clients",
      "edit_clients",
      "view_client_history",
      "view_team",
      "view_templates",
    ],
  },
  {
    name: "Scheduler",
    description: "Office staff focused on scheduling and client coordination",
    permissions: [
      "view_all_inspections",
      "create_inspections",
      "edit_inspections",
      "assign_inspections",
      "view_reports",
      "deliver_reports",
      "view_clients",
      "create_clients",
      "edit_clients",
      "view_client_history",
      "view_team",
      "view_templates",
    ],
  },
  {
    name: "Bookkeeper",
    description: "Financial operations and invoice management",
    permissions: [
      "view_clients",
      "view_client_history",
      "view_billing",
      "view_invoices",
      "create_invoices",
    ],
  },
];

export default function NewRolePage() {
  const router = useRouter();
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [roleName, setRoleName] = useState("");
  const [roleDescription, setRoleDescription] = useState("");
  const [rolePrefix, setRolePrefix] = useState<number>(4); // Default to next available

  // Mock data - in production, fetch from database
  const usedPrefixes = [1, 2, 3]; // OWNER/ADMIN=1, OFFICE_STAFF=2, INSPECTOR=3
  const availablePrefixes = [4, 5, 6, 7, 8, 9].filter(n => !usedPrefixes.includes(n));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    await new Promise((resolve) => setTimeout(resolve, 1000));

    // TODO: Implement API call to create role
    router.push("/admin/settings/roles");
  };

  const togglePermission = (permissionId: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permissionId)
        ? prev.filter((p) => p !== permissionId)
        : [...prev, permissionId]
    );
  };

  const isPermissionEnabled = (permissionId: string) => {
    return selectedPermissions.includes(permissionId);
  };

  const applyTemplate = (template: typeof roleTemplates[0]) => {
    setRoleName(template.name);
    setRoleDescription(template.description);
    setSelectedPermissions(template.permissions);
  };

  return (
    <AdminShell user={mockAdminUser}>
      <div className="space-y-6 max-w-4xl">
        {/* Back Button */}
        <BackButton href="/admin/settings/roles" label="Back to Roles" variant="ghost" size="sm" />

        <AdminPageHeader
          title="Create Custom Role"
          description="Define a new role with specific permissions for your team"
        />

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Role Templates */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                <CardTitle>Quick Start Templates</CardTitle>
              </div>
              <CardDescription>
                Start with a pre-configured role template or build from scratch
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-3">
                {roleTemplates.map((template) => (
                  <Card
                    key={template.name}
                    className="cursor-pointer hover:border-primary transition-colors"
                    onClick={() => applyTemplate(template)}
                  >
                    <CardHeader className="p-4">
                      <CardTitle className="text-sm">{template.name}</CardTitle>
                      <CardDescription className="text-xs">
                        {template.description}
                      </CardDescription>
                      <div className="pt-2">
                        <Badge variant="secondary" className="text-xs">
                          {template.permissions.length} permissions
                        </Badge>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Role Information</CardTitle>
              <CardDescription>Basic details about this role</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Role Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Senior Inspector"
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Brief description of this role and its responsibilities..."
                  rows={2}
                  value={roleDescription}
                  onChange={(e) => setRoleDescription(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rolePrefix">ID Prefix *</Label>
                <div className="grid grid-cols-6 gap-2">
                  {availablePrefixes.map((prefix) => (
                    <button
                      key={prefix}
                      type="button"
                      onClick={() => setRolePrefix(prefix)}
                      className={`
                        h-12 rounded-md border-2 font-mono font-semibold text-lg
                        transition-all hover:border-primary
                        ${rolePrefix === prefix
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-input bg-background'
                        }
                      `}
                    >
                      {prefix}xxx
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Team member IDs will start with this number (e.g., ACM-{rolePrefix}001, ACM-{rolePrefix}002).
                  <br />
                  Reserved: 1=Owner/Admin, 2=Office Staff, 3=Inspector
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Permissions */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                <CardTitle>Permissions</CardTitle>
              </div>
              <CardDescription>
                Select the default permissions included with this role
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {Object.entries(permissionCategories).map(([categoryKey, category]) => (
                <div key={categoryKey}>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    {category.label}
                  </h4>
                  <div className="space-y-3 pl-4">
                    {category.permissions.map((permission) => {
                      const isEnabled = isPermissionEnabled(permission.id);

                      return (
                        <div key={permission.id} className="flex items-start space-x-3">
                          <Checkbox
                            id={permission.id}
                            checked={isEnabled}
                            onCheckedChange={() => togglePermission(permission.id)}
                          />
                          <div className="flex-1 space-y-1">
                            <Label
                              htmlFor={permission.id}
                              className="text-sm font-medium cursor-pointer"
                            >
                              {permission.label}
                            </Label>
                            <p className="text-xs text-muted-foreground">
                              {permission.description}
                            </p>
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
              <Link href="/admin/settings/roles">Cancel</Link>
            </Button>
            <Button type="submit" disabled={isSaving}>
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? "Creating..." : "Create Role"}
            </Button>
          </div>
        </form>
      </div>
    </AdminShell>
  );
}
