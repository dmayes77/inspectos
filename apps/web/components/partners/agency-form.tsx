"use client";

import { Dispatch, SetStateAction } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { AgencyStatus } from "@/lib/data/agencies";
import { CompanyLogo } from "@/components/shared/company-logo";

export type AgencyFormValues = {
  name: string;
  logoUrl: string;
  status: AgencyStatus;
  licenseNumber: string;
  email: string;
  phone: string;
  website: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  zipCode: string;
  notes: string;
};

const statusOptions: { label: string; value: AgencyStatus }[] = [
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
];

type AgencyFormProps = {
  form: AgencyFormValues;
  setForm: Dispatch<SetStateAction<AgencyFormValues>>;
};

export function AgencyForm({ form, setForm }: AgencyFormProps) {
  const handleChange = <Field extends keyof AgencyFormValues>(field: Field, value: AgencyFormValues[Field]) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Branding</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <CompanyLogo name={form.name || "Agency"} logoUrl={form.logoUrl} website={form.website} size={64} className="h-16 w-16" />
            <div className="flex-1 space-y-2">
              <Label htmlFor="agency-logo">Logo URL</Label>
              <Input
                id="agency-logo"
                value={form.logoUrl}
                onChange={(event) => handleChange("logoUrl", event.target.value)}
                placeholder="https://img.logo.dev/example.com"
              />
              <p className="text-xs text-muted-foreground">Paste a logo URL from lookup or your brand kit.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Agency Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="agency-name">Agency name *</Label>
            <Input id="agency-name" value={form.name} onChange={(event) => handleChange("name", event.target.value)} placeholder="Sunset Realty" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="agency-status">Status</Label>
            <Select value={form.status} onValueChange={(value: AgencyStatus) => handleChange("status", value)}>
              <SelectTrigger id="agency-status">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="agency-license">License number</Label>
            <Input
              id="agency-license"
              value={form.licenseNumber}
              onChange={(event) => handleChange("licenseNumber", event.target.value)}
              placeholder="LIC-12345"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="agency-email">Email</Label>
            <Input
              id="agency-email"
              type="email"
              value={form.email}
              onChange={(event) => handleChange("email", event.target.value)}
              placeholder="hello@sunsetrealty.com"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="agency-phone">Phone</Label>
            <Input id="agency-phone" value={form.phone} onChange={(event) => handleChange("phone", event.target.value)} placeholder="(555) 123-4567" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="agency-website">Website</Label>
            <Input
              id="agency-website"
              value={form.website}
              onChange={(event) => handleChange("website", event.target.value)}
              placeholder="https://sunsetrealty.com"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Address</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="agency-address-line1">Address line 1</Label>
            <Input
              id="agency-address-line1"
              value={form.addressLine1}
              onChange={(event) => handleChange("addressLine1", event.target.value)}
              placeholder="123 Market St"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="agency-address-line2">Address line 2</Label>
            <Input
              id="agency-address-line2"
              value={form.addressLine2}
              onChange={(event) => handleChange("addressLine2", event.target.value)}
              placeholder="Suite 200"
            />
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="grid gap-2">
              <Label htmlFor="agency-city">City</Label>
              <Input id="agency-city" value={form.city} onChange={(event) => handleChange("city", event.target.value)} placeholder="Austin" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="agency-state">State</Label>
              <Input id="agency-state" value={form.state} onChange={(event) => handleChange("state", event.target.value)} placeholder="TX" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="agency-zip">ZIP</Label>
              <Input id="agency-zip" value={form.zipCode} onChange={(event) => handleChange("zipCode", event.target.value)} placeholder="73301" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            id="agency-notes"
            value={form.notes}
            onChange={(event) => handleChange("notes", event.target.value)}
            placeholder="Key relationship details, expectations, or follow-up items."
            rows={4}
          />
        </CardContent>
      </Card>
    </div>
  );
}
