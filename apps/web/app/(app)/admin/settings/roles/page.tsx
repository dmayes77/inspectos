"use client";

import Link from "next/link";
import { AdminPageHeader } from "@/components/layout/admin-page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Shield, Plus, Lock, Users, CheckCircle, Hash } from "lucide-react";
import { rolePermissions } from "@/lib/permissions";
import { getRolePrefix } from "@/lib/team-member-id";

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

export default function RolesPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Roles & Permissions"
        description="Manage roles and their default permissions"
        actions={
          <Button asChild className="sm:w-auto">
            <Link href="/admin/settings/roles/new">
              <Plus className="mr-2 h-4 w-4" />
              Create Custom Role
            </Link>
          </Button>
        }
      />

      {/* System Roles */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Lock className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-medium">System Roles</h2>
          <Badge variant="secondary" className="text-xs">Protected</Badge>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {roles.filter(r => r.isSystem).map((role) => {
            const permissionCount = rolePermissions[role.id]?.length || 0;

            return (
              <Link key={role.id} href={`/admin/settings/roles/${role.id}`}>
                <Card className="hover:shadow-lg hover:border-primary/50 transition-all cursor-pointer h-full">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Shield className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-base">{role.name}</CardTitle>
                          <CardDescription className="mt-1">
                            {role.description}
                          </CardDescription>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Hash className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        ID Prefix: <span className="font-mono font-semibold">{getRolePrefix(role.id)}xxx</span>
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>{role.memberCount} {role.memberCount === 1 ? 'member' : 'members'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <CheckCircle className="h-4 w-4" />
                        <span>{permissionCount} permissions</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Custom Roles - Empty State */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Shield className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-medium">Custom Roles</h2>
        </div>
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Shield className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No custom roles yet</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md mb-6">
              Create custom roles to define specific permission sets for your team. For example, create a &quot;Senior Inspector&quot; role with additional permissions.
            </p>
            <Button asChild>
              <Link href="/admin/settings/roles/new">
                <Plus className="mr-2 h-4 w-4" />
                Create First Custom Role
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
