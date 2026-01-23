"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
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
  Loader2,
  Upload,
  X,
} from "lucide-react";
import { mockAdminUser } from "@/lib/constants/mock-users";
import { useSettings, useUpdateSettings } from "@/hooks/use-settings";
import { toast } from "sonner";

function isLightColor(hex: string): boolean {
  const color = hex.replace("#", "");
  const r = parseInt(color.slice(0, 2), 16);
  const g = parseInt(color.slice(2, 4), 16);
  const b = parseInt(color.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5;
}

export default function SettingsPage() {
  const { data: settings, isLoading } = useSettings();
  const updateMutation = useUpdateSettings();

  // Local state for form fields
  const [company, setCompany] = useState({
    name: "",
    email: "",
    phone: "",
    website: "",
    address: "",
    city: "",
    state: "",
    zip: "",
  });

  const [branding, setBranding] = useState({
    logoUrl: null as string | null,
    primaryColor: "#f97316",
  });

  const [logoUploading, setLogoUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [notifications, setNotifications] = useState({
    newBooking: true,
    inspectionComplete: true,
    paymentReceived: true,
    reportViewed: false,
    weeklySummary: true,
  });

  // Sync local state when settings load
  useEffect(() => {
    if (settings) {
      setCompany(settings.company);
      setBranding(settings.branding);
      setNotifications(settings.notifications);
    }
  }, [settings]);

  const handleSaveCompany = () => {
    updateMutation.mutate(
      { company },
      {
        onSuccess: () => toast.success("Company settings saved"),
        onError: (error) => toast.error(error instanceof Error ? error.message : "Failed to save"),
      }
    );
  };

  const handleSaveBranding = () => {
    updateMutation.mutate(
      { branding },
      {
        onSuccess: () => toast.success("Branding settings saved"),
        onError: (error) => toast.error(error instanceof Error ? error.message : "Failed to save"),
      }
    );
  };

  const handleNotificationChange = (key: keyof typeof notifications, value: boolean) => {
    const updated = { ...notifications, [key]: value };
    setNotifications(updated);
    updateMutation.mutate(
      { notifications: updated },
      {
        onSuccess: () => toast.success("Notification preferences saved"),
        onError: (error) => toast.error(error instanceof Error ? error.message : "Failed to save"),
      }
    );
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ["image/png", "image/jpeg", "image/gif", "image/webp", "image/svg+xml"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Invalid file type. Allowed: PNG, JPEG, GIF, WebP, SVG");
      return;
    }

    // Validate file size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("File too large. Maximum size is 2MB");
      return;
    }

    setLogoUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/admin/settings/logo", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Upload failed");
      }

      const data = await response.json();
      setBranding({ ...branding, logoUrl: data.logoUrl });
      toast.success("Logo uploaded successfully");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to upload logo");
    } finally {
      setLogoUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleLogoRemove = async () => {
    setLogoUploading(true);
    try {
      const response = await fetch("/api/admin/settings/logo", {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to remove logo");
      }

      setBranding({ ...branding, logoUrl: null });
      toast.success("Logo removed");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to remove logo");
    } finally {
      setLogoUploading(false);
    }
  };


  if (isLoading) {
    return (
      <AdminShell user={mockAdminUser}>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AdminShell>
    );
  }

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
                    <Input
                      id="company-name"
                      value={company.name}
                      onChange={(e) => setCompany({ ...company, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company-email">Email</Label>
                    <Input
                      id="company-email"
                      type="email"
                      value={company.email}
                      onChange={(e) => setCompany({ ...company, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company-phone">Phone</Label>
                    <Input
                      id="company-phone"
                      value={company.phone}
                      onChange={(e) => setCompany({ ...company, phone: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company-website">Website</Label>
                    <Input
                      id="company-website"
                      value={company.website}
                      onChange={(e) => setCompany({ ...company, website: e.target.value })}
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="company-address">Address</Label>
                  <Input
                    id="company-address"
                    value={company.address}
                    onChange={(e) => setCompany({ ...company, address: e.target.value })}
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="company-city">City</Label>
                    <Input
                      id="company-city"
                      value={company.city}
                      onChange={(e) => setCompany({ ...company, city: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company-state">State</Label>
                    <Input
                      id="company-state"
                      value={company.state}
                      onChange={(e) => setCompany({ ...company, state: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company-zip">ZIP Code</Label>
                    <Input
                      id="company-zip"
                      value={company.zip}
                      onChange={(e) => setCompany({ ...company, zip: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSaveCompany} disabled={updateMutation.isPending}>
                    {updateMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </Button>
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
                  Customize your brand color used throughout the app
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 lg:grid-cols-2">
                  {/* Left: Color Selection */}
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">Choose a color</Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        Select a preset or pick a custom color
                      </p>
                    </div>

                    {/* Preset Colors */}
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { color: "#f97316", label: "Orange" },
                        { color: "#3b82f6", label: "Blue" },
                        { color: "#10b981", label: "Green" },
                        { color: "#8b5cf6", label: "Purple" },
                        { color: "#ef4444", label: "Red" },
                        { color: "#06b6d4", label: "Cyan" },
                        { color: "#f59e0b", label: "Amber" },
                        { color: "#64748b", label: "Slate" },
                      ].map((preset) => (
                        <button
                          key={preset.color}
                          type="button"
                          onClick={() => setBranding({ ...branding, primaryColor: preset.color })}
                          className={`group relative flex flex-col items-center gap-1.5 rounded-lg border-2 p-2 transition-all hover:scale-105 ${
                            branding.primaryColor === preset.color
                              ? "border-foreground bg-muted"
                              : "border-transparent hover:border-muted-foreground/20"
                          }`}
                        >
                          <div
                            className="h-8 w-8 rounded-md shadow-sm"
                            style={{ backgroundColor: preset.color }}
                          />
                          <span className="text-[10px] text-muted-foreground">{preset.label}</span>
                        </button>
                      ))}
                    </div>

                    {/* Custom Color */}
                    <div className="rounded-lg border p-3 space-y-2">
                      <Label className="text-xs text-muted-foreground">Custom color</Label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={branding.primaryColor}
                          onChange={(e) => setBranding({ ...branding, primaryColor: e.target.value })}
                          className="h-9 w-9 cursor-pointer rounded border-0 bg-transparent p-0"
                        />
                        <Input
                          value={branding.primaryColor}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (/^#[0-9A-Fa-f]{0,6}$/.test(val)) {
                              setBranding({ ...branding, primaryColor: val });
                            }
                          }}
                          className="w-24 font-mono text-sm"
                          placeholder="#f97316"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs"
                          onClick={() => setBranding({ ...branding, primaryColor: "#f97316" })}
                        >
                          Reset
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Right: Live Preview */}
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">Live preview</Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        See how your color looks in the UI
                      </p>
                    </div>

                    <div className="rounded-lg border bg-muted/30 p-4 space-y-4">
                      {/* Buttons */}
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-muted-foreground">Buttons</p>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            style={{
                              backgroundColor: branding.primaryColor,
                              color: isLightColor(branding.primaryColor) ? "#1e293b" : "#ffffff",
                            }}
                          >
                            Primary
                          </Button>
                          <Button size="sm" variant="outline">
                            Outline
                          </Button>
                          <Button size="sm" variant="ghost">
                            Ghost
                          </Button>
                        </div>
                      </div>

                      {/* Badges & Links */}
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-muted-foreground">Badges & Links</p>
                        <div className="flex items-center gap-3">
                          <span
                            className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                            style={{
                              backgroundColor: `${branding.primaryColor}20`,
                              color: branding.primaryColor,
                            }}
                          >
                            Active
                          </span>
                          <a
                            href="#"
                            className="text-sm underline"
                            style={{ color: branding.primaryColor }}
                            onClick={(e) => e.preventDefault()}
                          >
                            Sample link
                          </a>
                        </div>
                      </div>

                      {/* Mini Sidebar Sample */}
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-muted-foreground">Sidebar</p>
                        <div className="rounded-md border bg-background p-2 w-40">
                          <div className="space-y-1">
                            <div
                              className="flex items-center gap-2 rounded px-2 py-1.5 text-xs font-medium"
                              style={{
                                backgroundColor: `${branding.primaryColor}15`,
                                color: branding.primaryColor,
                              }}
                            >
                              <div
                                className="h-1.5 w-1.5 rounded-full"
                                style={{ backgroundColor: branding.primaryColor }}
                              />
                              Dashboard
                            </div>
                            <div className="flex items-center gap-2 rounded px-2 py-1.5 text-xs text-muted-foreground">
                              <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/30" />
                              Orders
                            </div>
                            <div className="flex items-center gap-2 rounded px-2 py-1.5 text-xs text-muted-foreground">
                              <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/30" />
                              Clients
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator className="my-6" />

                {/* Logo Section */}
                <div className="space-y-2">
                  <Label>Company Logo</Label>
                  <p className="text-xs text-muted-foreground">
                    Upload your company logo. Recommended size: 200x200px. Max 2MB.
                  </p>
                  <div className="flex items-center gap-4">
                    <div className="relative flex h-16 w-16 items-center justify-center rounded-lg border-2 border-dashed bg-muted overflow-hidden group">
                      {branding.logoUrl ? (
                        <>
                          <Image src={branding.logoUrl} alt="Logo" fill className="object-contain p-1" />
                          <button
                            type="button"
                            onClick={handleLogoRemove}
                            disabled={logoUploading}
                            className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-5 w-5 text-white" />
                          </button>
                        </>
                      ) : (
                        <Upload className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml"
                        onChange={handleLogoUpload}
                        className="hidden"
                        id="logo-upload"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={logoUploading}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        {logoUploading ? (
                          <>
                            <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                            Uploading...
                          </>
                        ) : branding.logoUrl ? (
                          "Change Logo"
                        ) : (
                          "Upload Logo"
                        )}
                      </Button>
                      <p className="text-xs text-muted-foreground mt-1">
                        PNG, JPG, GIF, WebP, or SVG
                      </p>
                    </div>
                  </div>
                </div>


                <div className="flex justify-end pt-4">
                  <Button onClick={handleSaveBranding} disabled={updateMutation.isPending}>
                    {updateMutation.isPending ? "Saving..." : "Save Branding"}
                  </Button>
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
                <p className="mt-2 text-xs text-muted-foreground">
                  Payment processing integration coming soon
                </p>
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
                <div className="flex items-center justify-between">
                  <Label htmlFor="new-booking">New booking received</Label>
                  <Switch
                    id="new-booking"
                    checked={notifications.newBooking}
                    onCheckedChange={(checked) => handleNotificationChange("newBooking", checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="inspection-complete">Inspection completed</Label>
                  <Switch
                    id="inspection-complete"
                    checked={notifications.inspectionComplete}
                    onCheckedChange={(checked) => handleNotificationChange("inspectionComplete", checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="payment-received">Payment received</Label>
                  <Switch
                    id="payment-received"
                    checked={notifications.paymentReceived}
                    onCheckedChange={(checked) => handleNotificationChange("paymentReceived", checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="report-viewed">Report viewed by client</Label>
                  <Switch
                    id="report-viewed"
                    checked={notifications.reportViewed}
                    onCheckedChange={(checked) => handleNotificationChange("reportViewed", checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="weekly-summary">Weekly summary</Label>
                  <Switch
                    id="weekly-summary"
                    checked={notifications.weeklySummary}
                    onCheckedChange={(checked) => handleNotificationChange("weeklySummary", checked)}
                  />
                </div>
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
