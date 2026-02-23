"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Flag, Download, Shield, Lock } from "lucide-react";

export default function ComplianceSettingsPage() {
  return (
    <div className="space-y-6">
      {/* Audit Trail */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle>Audit Trail</CardTitle>
            <CardDescription>Track sensitive access and system changes</CardDescription>
          </div>
          <Button variant="outline">
            <Flag className="mr-2 h-4 w-4" />
            View Audit Log
          </Button>
        </CardHeader>
        <CardContent>
          <div className="rounded-sm border border-dashed p-10 text-center text-sm text-muted-foreground">
            Audit events will appear here once activity is recorded.
          </div>
        </CardContent>
      </Card>

      {/* Data Retention */}
      <Card>
        <CardHeader>
          <CardTitle>Data Retention</CardTitle>
          <CardDescription>Configure how long records are kept before automatic deletion</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="divide-y divide-border">
            {[
              { label: "Inspection reports",  retention: "7 years",   status: "active" },
              { label: "Invoices & payments", retention: "7 years",   status: "active" },
              { label: "Audit logs",          retention: "2 years",   status: "active" },
              { label: "Deleted orders",      retention: "90 days",   status: "active" },
            ].map(({ label, retention, status }) => (
              <li key={label} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                <div>
                  <p className="text-sm font-medium text-foreground">{label}</p>
                  <p className="text-xs text-muted-foreground">Retained for {retention}</p>
                </div>
                <Badge color="light" className="bg-green-100 text-green-800 dark:bg-green-500/10 dark:text-green-400">{status}</Badge>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <CardTitle>Security Policies</CardTitle>
          </div>
          <CardDescription>Authentication and access security settings</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="divide-y divide-border">
            {[
              { label: "Two-factor authentication", description: "Require 2FA for all admin users", enabled: false },
              { label: "Session timeout",           description: "Auto-logout after 8 hours of inactivity", enabled: true },
              { label: "IP allowlist",              description: "Restrict logins to approved IP ranges", enabled: false },
            ].map(({ label, description, enabled }) => (
              <li key={label} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
                <div>
                  <p className="text-sm font-medium text-foreground">{label}</p>
                  <p className="text-xs text-muted-foreground">{description}</p>
                </div>
                <Badge color="light" className={enabled ? "bg-green-100 text-green-800 dark:bg-green-500/10 dark:text-green-400" : ""}>
                  {enabled ? "Enabled" : "Disabled"}
                </Badge>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Data Export */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-muted-foreground" />
            <CardTitle>Data Export</CardTitle>
          </div>
          <CardDescription>Export all your data for backup or compliance purposes</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Download a full export of orders, contacts, invoices, and reports as a ZIP archive.
          </p>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Request Export
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
