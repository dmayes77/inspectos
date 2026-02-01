"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const vendorTypes = ["Pest", "HVAC", "Roof", "Plumbing", "Electrical", "Other"];
const statusOptions = ["active", "inactive", "pending"];

interface VendorFormProps {
  mode: "new" | "edit";
  initialData?: any;
  onSubmit: (data: any) => void | Promise<void>;
  onCancel: () => void;
}

export function VendorForm({ mode, initialData, onSubmit, onCancel }: VendorFormProps) {
  const [form, setForm] = useState(
    initialData || {
      name: "",
      type: "Pest",
      contact: "",
      specialties: "",
      status: "active",
      notes: "",
    },
  );
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (field: string, value: string) => setForm((prev: any) => ({ ...prev, [field]: value }));

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setIsSaving(true);
        await onSubmit(form);
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
            <Label htmlFor="type">Type *</Label>
            <Select value={form.type} onValueChange={(v) => handleChange("type", v)}>
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
            <Label htmlFor="contact">Contact Info *</Label>
            <Input id="contact" value={form.contact} onChange={(e) => handleChange("contact", e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="specialties">Specialties</Label>
            <Input id="specialties" value={form.specialties} onChange={(e) => handleChange("specialties", e.target.value)} />
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
        <Button type="submit" disabled={isSaving}>
          {isSaving ? "Saving..." : mode === "edit" ? "Save Changes" : "Create Vendor"}
        </Button>
      </div>
    </form>
  );
}
