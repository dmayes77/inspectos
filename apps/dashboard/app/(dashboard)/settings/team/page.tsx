"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Users, Shield, ArrowRight, Plus } from "lucide-react";

const DEFAULT_INSPECTOR_PERMISSIONS = [
  { id: "view-schedule",        label: "View own schedule",       enabled: true  },
  { id: "complete-inspections", label: "Complete inspections",     enabled: true  },
  { id: "generate-reports",     label: "Generate reports",         enabled: true  },
  { id: "view-client-info",     label: "View client information",  enabled: true  },
  { id: "modify-templates",     label: "Modify templates",         enabled: false },
];

const SYSTEM_ROLES = [
  { name: "Owner",        description: "Full access to all features and billing",        color: "bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400" },
  { name: "Admin",        description: "Manage team, orders, and settings",              color: "bg-brand-100 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400"     },
  { name: "Inspector",    description: "Perform inspections and submit reports",          color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400" },
  { name: "Office Staff", description: "Manage bookings, invoices, and client comms",    color: "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400"  },
];

export default function TeamSettingsPage() {
  return (
    <div className="space-y-6">
      {/* Quick links */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="hover:border-brand-300 transition-colors">
          <CardContent className="pt-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-brand-50 dark:bg-brand-500/10">
                  <Users className="h-5 w-5 text-brand-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Team Members</p>
                  <p className="text-xs text-muted-foreground">Add, edit, and manage inspectors</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/team"><ArrowRight className="h-4 w-4" /></Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:border-brand-300 transition-colors">
          <CardContent className="pt-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-brand-50 dark:bg-brand-500/10">
                  <Shield className="h-5 w-5 text-brand-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Roles & Permissions</p>
                  <p className="text-xs text-muted-foreground">Create and configure custom roles</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/settings/roles"><ArrowRight className="h-4 w-4" /></Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System roles overview */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle>System Roles</CardTitle>
            <CardDescription>Built-in roles — permissions are managed in Roles &amp; Permissions</CardDescription>
          </div>
          <Button size="sm" asChild>
            <Link href="/settings/roles/new">
              <Plus className="mr-1.5 h-3.5 w-3.5" />New Role
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <ul className="divide-y divide-border">
            {SYSTEM_ROLES.map((role) => (
              <li key={role.name} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <Badge className={`text-xs font-medium border-0 ${role.color}`}>{role.name}</Badge>
                  <p className="text-sm text-muted-foreground">{role.description}</p>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/settings/roles">View</Link>
                </Button>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Default inspector permissions */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <CardTitle>Default Inspector Permissions</CardTitle>
          </div>
          <CardDescription>These defaults apply to new inspectors until a custom role is assigned</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="divide-y divide-border">
            {DEFAULT_INSPECTOR_PERMISSIONS.map(({ id, label, enabled }) => (
              <li key={id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                <Label htmlFor={id} className="text-sm cursor-pointer">{label}</Label>
                <Switch id={id} defaultChecked={enabled} />
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
