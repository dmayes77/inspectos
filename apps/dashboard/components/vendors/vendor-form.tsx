"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Vendor } from "@/hooks/use-vendors";
import { SaveButton } from "@/components/shared/action-buttons";

const vendorTypes = ["Pest", "HVAC", "Roof", "Plumbing", "Electrical", "Other"];
const statusOptions = ["active", "inactive"] as const;

interface VendorFormData {
  name: string;
  contactPerson: string;
  vendorType: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  stateRegion: string;
  postalCode: string;
  country: string;
  status: string;
  notes: string;
}

interface VendorFormProps {
  mode: "new" | "edit";
  initialData?: Partial<Vendor>;
  onSubmit: (data: Partial<Vendor>) => void | Promise<void>;
  onCancel: () => void;
}

export function VendorForm({ mode, initialData, onSubmit, onCancel }: VendorFormProps) {
  const [form, setForm] = useState<VendorFormData>(
    {
      name: initialData?.name ?? "",
      contactPerson: initialData?.contactPerson ?? "",
      vendorType: initialData?.vendorType ?? "Pest",
      email: initialData?.email ?? "",
      phone: initialData?.phone ?? "",
      addressLine1: initialData?.addressLine1 ?? "",
      addressLine2: initialData?.addressLine2 ?? "",
      city: initialData?.city ?? "",
      stateRegion: initialData?.stateRegion ?? "",
      postalCode: initialData?.postalCode ?? "",
      country: initialData?.country ?? "",
      status: initialData?.status ?? "active",
      notes: initialData?.notes ?? "",
    }
  );
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (field: keyof VendorFormData, value: string) => setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setIsSaving(true);
        await onSubmit({
          name: form.name,
          contactPerson: form.contactPerson,
          vendorType: form.vendorType,
          email: form.email,
          phone: form.phone,
          addressLine1: form.addressLine1,
          addressLine2: form.addressLine2,
          city: form.city,
          stateRegion: form.stateRegion,
          postalCode: form.postalCode,
          country: form.country,
          status: form.status,
          notes: form.notes,
        });
        setIsSaving(false);
      }}
      className="space-y-6 max-w-xl mx-auto"
    >
      <Card>
        <CardHeader>
          <CardTitle>{mode === "edit" ? "Edit Vendor" : "Add Vendor"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input id="name" value={form.name} onChange={(e) => handleChange("name", e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="vendor-contact-person">Contact Person</Label>
            <Input
              id="vendor-contact-person"
              value={form.contactPerson}
              onChange={(e) => handleChange("contactPerson", e.target.value)}
              placeholder="Primary contact name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="type">Type *</Label>
            <Select value={form.vendorType} onValueChange={(v) => handleChange("vendorType", v)}>
              <SelectTrigger id="type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {vendorTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="vendor-email">Email</Label>
            <Input id="vendor-email" type="email" value={form.email} onChange={(e) => handleChange("email", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="vendor-phone">Phone</Label>
            <Input id="vendor-phone" value={form.phone} onChange={(e) => handleChange("phone", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="vendor-address-1">Address Line 1</Label>
            <Input id="vendor-address-1" value={form.addressLine1} onChange={(e) => handleChange("addressLine1", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="vendor-address-2">Address Line 2</Label>
            <Input id="vendor-address-2" value={form.addressLine2} onChange={(e) => handleChange("addressLine2", e.target.value)} />
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="vendor-city">City</Label>
              <Input id="vendor-city" value={form.city} onChange={(e) => handleChange("city", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vendor-state-region">State</Label>
              <Input id="vendor-state-region" value={form.stateRegion} onChange={(e) => handleChange("stateRegion", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vendor-postal-code">Postal</Label>
              <Input id="vendor-postal-code" value={form.postalCode} onChange={(e) => handleChange("postalCode", e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="vendor-country">Country</Label>
            <Input id="vendor-country" value={form.country} onChange={(e) => handleChange("country", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Status *</Label>
            <Select value={form.status} onValueChange={(v) => handleChange("status", v)}>
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" value={form.notes} onChange={(e) => handleChange("notes", e.target.value)} rows={3} />
          </div>
        </CardContent>
      </Card>
      <div className="flex items-center justify-between">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <SaveButton type="submit" isSaving={isSaving} label={mode === "edit" ? "Save Changes" : "Create Vendor"} />
      </div>
    </form>
  );
}
