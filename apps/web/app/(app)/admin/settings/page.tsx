import Link from "next/link";
import { AdminShell } from "@/components/layout/admin-shell";
import { AdminPageHeader } from "@/components/layout/admin-page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Building,
  CreditCard,
  Bell,
  Users,
  Shield,
  Palette,
} from "lucide-react";
import { mockAdminUser } from "@/lib/constants/mock-users";

export default function SettingsPage() {
  return (
    <AdminShell user={mockAdminUser}>
      <div className="space-y-6">
        <AdminPageHeader
          title="Settings"
          description="Manage your company settings and preferences"
        />

        <Tabs defaultValue="company" className="space-y-6">
          <TabsList className="grid h-auto w-full grid-cols-2 gap-1 sm:flex sm:flex-wrap sm:justify-start">
            <TabsTrigger value="company" className="gap-2">
              <Building className="h-4 w-4" />
              Company
            </TabsTrigger>
            <TabsTrigger value="billing" className="gap-2">
              <CreditCard className="h-4 w-4" />
              Billing
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="team" className="gap-2">
              <Users className="h-4 w-4" />
              Team
            </TabsTrigger>
          </TabsList>

          {/* Company Settings */}
          <TabsContent value="company" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Company Information</CardTitle>
                <CardDescription>
                  Update your company details and contact information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="company-name">Company Name</Label>
                    <Input id="company-name" defaultValue="Acme Home Inspections" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company-email">Email</Label>
                    <Input id="company-email" defaultValue="contact@acmeinspections.com" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company-phone">Phone</Label>
                    <Input id="company-phone" defaultValue="(512) 555-0100" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company-website">Website</Label>
                    <Input id="company-website" defaultValue="https://acmeinspections.com" />
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="company-address">Address</Label>
                  <Input id="company-address" defaultValue="123 Business Ave, Suite 100" />
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="company-city">City</Label>
                    <Input id="company-city" defaultValue="Austin" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company-state">State</Label>
                    <Input id="company-state" defaultValue="TX" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company-zip">ZIP Code</Label>
                    <Input id="company-zip" defaultValue="78701" />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button>Save Changes</Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  <CardTitle>Branding</CardTitle>
                </div>
                <CardDescription>
                  Customize your reports and client-facing materials
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Company Logo</Label>
                  <div className="flex items-center gap-4">
                    <div className="flex h-20 w-20 items-center justify-center rounded-lg border-2 border-dashed bg-muted">
                      <span className="text-xs text-muted-foreground">Logo</span>
                    </div>
                    <Button variant="outline">Upload Logo</Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Primary Color</Label>
                  <div className="flex items-center gap-2">
                    <div className="h-10 w-10 rounded-lg bg-primary" />
                    <Input defaultValue="#f97316" className="w-32" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Billing Settings */}
          <TabsContent value="billing" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Current Plan</CardTitle>
                <CardDescription>
                  You are currently on the Professional plan
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <h3 className="font-semibold">Professional</h3>
                    <p className="text-sm text-muted-foreground">
                      Up to 5 inspectors, all features included
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">$99</p>
                    <p className="text-sm text-muted-foreground">/month</p>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button variant="outline">Change Plan</Button>
                  <Button variant="outline">View Invoices</Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payment Method</CardTitle>
                <CardDescription>
                  Manage your payment methods
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-14 items-center justify-center rounded bg-slate-800 text-white text-xs font-bold">
                      VISA
                    </div>
                    <div>
                      <p className="font-medium">•••• •••• •••• 4242</p>
                      <p className="text-sm text-muted-foreground">Expires 12/2027</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">Update</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Settings */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Email Notifications</CardTitle>
                <CardDescription>
                  Choose what emails you want to receive
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { id: "new-booking", label: "New booking received", enabled: true },
                  { id: "inspection-complete", label: "Inspection completed", enabled: true },
                  { id: "payment-received", label: "Payment received", enabled: true },
                  { id: "report-viewed", label: "Report viewed by client", enabled: false },
                  { id: "weekly-summary", label: "Weekly summary", enabled: true },
                ].map((notification) => (
                  <div key={notification.id} className="flex items-center justify-between">
                    <Label htmlFor={notification.id}>{notification.label}</Label>
                    <Switch id={notification.id} defaultChecked={notification.enabled} />
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Team Settings */}
          <TabsContent value="team" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  <CardTitle>Team Permissions</CardTitle>
                </div>
                <CardDescription>
                  Configure default permissions for team roles
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border p-4">
                  <h4 className="font-medium">Inspector Role</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Default permissions for inspectors
                  </p>
                  <div className="space-y-3">
                    {[
                      { id: "view-schedule", label: "View own schedule", enabled: true },
                      { id: "complete-inspections", label: "Complete inspections", enabled: true },
                      { id: "generate-reports", label: "Generate reports", enabled: true },
                      { id: "view-client-info", label: "View client information", enabled: true },
                      { id: "modify-templates", label: "Modify templates", enabled: false },
                    ].map((perm) => (
                      <div key={perm.id} className="flex items-center justify-between">
                        <Label htmlFor={perm.id} className="text-sm">{perm.label}</Label>
                        <Switch id={perm.id} defaultChecked={perm.enabled} />
                      </div>
                    ))}
                  </div>
                </div>

                <Button variant="outline" asChild>
                  <Link href="/admin/settings/roles">Manage Roles</Link>
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminShell>
  );
}
