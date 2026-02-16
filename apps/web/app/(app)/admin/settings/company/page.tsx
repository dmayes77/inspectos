"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";
import { useSettings, useUpdateSettings } from "@/hooks/use-settings";
import { toast } from "sonner";

export default function CompanySettingsPage() {
  const { data: settings, isLoading } = useSettings();
  const updateMutation = useUpdateSettings();

  const [company, setCompany] = useState({
    name: "", email: "", phone: "", website: "",
    address: "", city: "", state: "", zip: "",
  });

  useEffect(() => {
    if (settings) setCompany(settings.company);
  }, [settings]);

  const handleSave = () => {
    updateMutation.mutate(
      { company },
      {
        onSuccess: () => toast.success("Company settings saved"),
        onError: (error) => toast.error(error instanceof Error ? error.message : "Failed to save"),
      }
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Company Information</CardTitle>
          <CardDescription>Update your company details and contact information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="company-name">Company Name</Label>
              <Input id="company-name" value={company.name} onChange={(e) => setCompany({ ...company, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company-email">Email</Label>
              <Input id="company-email" type="email" value={company.email} onChange={(e) => setCompany({ ...company, email: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company-phone">Phone</Label>
              <Input id="company-phone" value={company.phone} onChange={(e) => setCompany({ ...company, phone: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company-website">Website</Label>
              <Input id="company-website" value={company.website} onChange={(e) => setCompany({ ...company, website: e.target.value })} />
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="company-address">Street Address</Label>
            <Input id="company-address" value={company.address} onChange={(e) => setCompany({ ...company, address: e.target.value })} />
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="company-city">City</Label>
              <Input id="company-city" value={company.city} onChange={(e) => setCompany({ ...company, city: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company-state">State</Label>
              <Input id="company-state" value={company.state} onChange={(e) => setCompany({ ...company, state: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company-zip">ZIP Code</Label>
              <Input id="company-zip" value={company.zip} onChange={(e) => setCompany({ ...company, zip: e.target.value })} />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button onClick={handleSave} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : "Save Changes"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
