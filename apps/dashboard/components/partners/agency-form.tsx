"use client";

import { Dispatch, SetStateAction } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { AgencyStatus } from "@/hooks/use-agencies";
import { CompanyLogo } from "@/components/shared/company-logo";

export type AgencyFormValues = {
  name: string;
  logoUrl: string;
  status: AgencyStatus;
  licenseNumber: string;
  phone: string;
  website: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  zipCode: string;
  notes: string;
};

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
          <CardTitle>Agency Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-4">
              <CompanyLogo name={form.name || "Agency"} logoUrl={form.logoUrl} website={form.website} size={64} className="h-16 w-16" />
              <div className="grid flex-1 gap-2">
                <Label htmlFor="agency-name">Agency name *</Label>
                <Input id="agency-name" value={form.name} onChange={(event) => handleChange("name", event.target.value)} placeholder="Sunset Realty" required />
              </div>
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="agency-phone">Phone number</Label>
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
          <div className="grid gap-2">
            <Label htmlFor="agency-logo-url">Logo URL</Label>
            <Input
              id="agency-logo-url"
              value={form.logoUrl}
              onChange={(event) => handleChange("logoUrl", event.target.value)}
              placeholder="https://img.logo.dev/example.com?token=pk_..."
            />
          </div>
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
