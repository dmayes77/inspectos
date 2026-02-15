"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AdminPageHeader } from "@/components/layout/admin-page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { Save, Shield, Lock, Trash, Users } from "lucide-react";
import { permissionCategories, rolePermissions } from "@/lib/permissions";

const roles = [
  {
    id: "OWNER",
    name: "Owner",
    description: "Full access to all features and settings",
    isSystem: true,
    memberCount: 1,
  },
  {
    id: "ADMIN",
    name: "Admin",
    description: "Full access except billing and company deletion",
    isSystem: true,
    memberCount: 1,
  },
  {
    id: "INSPECTOR",
    name: "Inspector",
    description: "Field operations and own inspection management",
    isSystem: true,
    memberCount: 3,
  },
  {
    id: "OFFICE_STAFF",
    name: "Office Staff",
    description: "Office operations without field work",
    isSystem: true,
    memberCount: 1,
  },
];

export default function RoleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const role = roles.find((r) => r.id === params.id);

  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(
    rolePermissions[params.id as string] || []
  );
  const [isSaving, setIsSaving] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  if (!role) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <h1 className="text-2xl font-semibold mb-2">Role Not Found</h1>
        <p className="text-muted-foreground mb-6">
          The role you&apos;re looking for doesn&apos;t exist.
        </p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    await new Promise((resolve) => setTimeout(resolve, 1000));

    // TODO: Implement API call to update role
    router.push("/admin/settings/roles");
  };

  const handleDelete = () => {
    // TODO: Implement API call to delete role
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

  return (
    <>
    <div className="space-y-6 max-w-4xl">
      {/* Back Button */}

      <AdminPageHeader
        title={
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-primary/10">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <div>
              <div className="mb-1 flex items-center gap-3">
                <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{role.name}</h1>
                {role.isSystem ? (
                  <Badge variant="secondary" className="text-xs">
                    <Lock className="mr-1 h-3 w-3" />
                    System Role
                  </Badge>
                ) : null}
              </div>
              <p className="text-muted-foreground">{role.description}</p>
              <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>{role.memberCount} team {role.memberCount === 1 ? "member" : "members"} with this role</span>
              </div>
            </div>
          </div>
        }
        actions={
          !role.isSystem ? (
            <Button
              variant="outline"
              className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
              onClick={() => setDeleteDialogOpen(true)}
            >
              <Trash className="mr-2 h-4 w-4" />
              Delete Role
            </Button>
          ) : null
        }
      />

      {/* System Role Warning */}
      {role.isSystem && (
        <Alert>
          <Lock className="h-4 w-4" />
          <AlertTitle>System Role</AlertTitle>
          <AlertDescription>
            This is a protected system role. You can view its permissions but cannot modify the role name, description, or delete it. To customize permissions for specific users, use the custom permissions feature on the team member edit page.
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information - Only editable for custom roles */}
        {!role.isSystem && (
          <Card>
            <CardHeader>
              <CardTitle>Role Information</CardTitle>
              <CardDescription>Basic details about this role</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Role Name *</Label>
                <Input id="name" defaultValue={role.name} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  defaultValue={role.description}
                  rows={2}
                  required
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Permissions */}
        <Card>
          <CardHeader>
            <CardTitle>Permissions</CardTitle>
            <CardDescription>
              {role.isSystem
                ? "View the default permissions included with this role"
                : "Select the default permissions included with this role"
              }
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
                          disabled={role.isSystem}
                        />
                        <div className="flex-1 space-y-1">
                          <Label
                            htmlFor={permission.id}
                            className={`text-sm font-medium ${role.isSystem ? '' : 'cursor-pointer'}`}
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

        {/* Actions - Only show for custom roles */}
        {!role.isSystem && (
          <div className="flex items-center justify-between">
            <Button type="button" variant="outline" asChild>
              <Link href="/admin/settings/roles">Cancel</Link>
            </Button>
            <Button type="submit" disabled={isSaving}>
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        )}
      </form>
    </div>

    {/* Delete Confirmation Dialog */}
    <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Role</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete the {role.name} role? This action cannot be undone. Team members with this role will need to be reassigned to a different role.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-destructive hover:bg-destructive/90"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
