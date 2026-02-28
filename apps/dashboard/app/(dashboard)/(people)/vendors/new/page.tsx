"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { IdPageLayout } from "@/components/shared/id-page-layout";
import { SaveButton } from "@/components/shared/action-buttons";
import { useCreateVendor, type Vendor } from "@/hooks/use-vendors";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

type VendorFormState = {
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
  notes: string;
  status: string;
};

export default function NewVendorPage() {
  const router = useRouter();
  const createVendor = useCreateVendor();

  const [form, setForm] = useState<VendorFormState>({
    name: "",
    contactPerson: "",
    vendorType: "",
    email: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    stateRegion: "",
    postalCode: "",
    country: "",
    notes: "",
    status: "active",
  });

  const handleCreate = async () => {
    if (!form.name.trim()) {
      toast.error("Vendor name is required");
      return;
    }

    await createVendor.mutateAsync({
      name: form.name.trim(),
      contactPerson: form.contactPerson.trim() || undefined,
      vendorType: form.vendorType.trim() || undefined,
      email: form.email.trim() || undefined,
      phone: form.phone.trim() || undefined,
      addressLine1: form.addressLine1.trim() || undefined,
      addressLine2: form.addressLine2.trim() || undefined,
      city: form.city.trim() || undefined,
      stateRegion: form.stateRegion.trim() || undefined,
      postalCode: form.postalCode.trim() || undefined,
      country: form.country.trim() || undefined,
      notes: form.notes.trim() || undefined,
      status: form.status,
    } as Partial<Vendor>);

    router.push("/vendors");
  };

  return (
    <IdPageLayout
      title="Add Vendor"
      description="Create a vendor profile for assignment and dispatch workflows"
      breadcrumb={
        <>
          <Link href="/vendors" className="text-muted-foreground transition hover:text-foreground">
            Vendors
          </Link>
          <span className="text-muted-foreground">{">"}</span>
          <span className="max-w-[20rem] truncate font-medium">New Vendor</span>
        </>
      }
      left={
        <div className="space-y-4">
          <Card className="card-admin">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Vendor Profile</CardTitle>
              <CardDescription>Core business and communication details.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="vendor-name">Vendor Name</Label>
                  <Input
                    id="vendor-name"
                    value={form.name}
                    onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                    placeholder="Preferred vendor name"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="vendor-contact-person">Contact Person</Label>
                  <Input
                    id="vendor-contact-person"
                    value={form.contactPerson}
                    onChange={(event) => setForm((prev) => ({ ...prev, contactPerson: event.target.value }))}
                    placeholder="Primary contact name"
                  />
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="vendor-type">Vendor Type</Label>
                  <Input
                    id="vendor-type"
                    value={form.vendorType}
                    onChange={(event) => setForm((prev) => ({ ...prev, vendorType: event.target.value }))}
                    placeholder="Lab, HVAC, Plumbing..."
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="vendor-email">Email</Label>
                  <Input
                    id="vendor-email"
                    type="email"
                    value={form.email}
                    onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="vendor-phone">Phone</Label>
                  <Input
                    id="vendor-phone"
                    value={form.phone}
                    onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(value) => setForm((prev) => ({ ...prev, status: value }))}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="card-admin">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Address & Notes</CardTitle>
              <CardDescription>Keep address and notes current for dispatching and handoffs.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="vendor-address-line-1">Address Line 1</Label>
                  <Input
                    id="vendor-address-line-1"
                    value={form.addressLine1}
                    onChange={(event) => setForm((prev) => ({ ...prev, addressLine1: event.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="vendor-address-line-2">Address Line 2</Label>
                  <Input
                    id="vendor-address-line-2"
                    value={form.addressLine2}
                    onChange={(event) => setForm((prev) => ({ ...prev, addressLine2: event.target.value }))}
                  />
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <div className="space-y-1.5">
                  <Label htmlFor="vendor-city">City</Label>
                  <Input
                    id="vendor-city"
                    value={form.city}
                    onChange={(event) => setForm((prev) => ({ ...prev, city: event.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="vendor-state-region">State</Label>
                  <Input
                    id="vendor-state-region"
                    value={form.stateRegion}
                    onChange={(event) => setForm((prev) => ({ ...prev, stateRegion: event.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="vendor-postal-code">Postal</Label>
                  <Input
                    id="vendor-postal-code"
                    value={form.postalCode}
                    onChange={(event) => setForm((prev) => ({ ...prev, postalCode: event.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="vendor-country">Country</Label>
                <Input
                  id="vendor-country"
                  value={form.country}
                  onChange={(event) => setForm((prev) => ({ ...prev, country: event.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="vendor-notes">Notes</Label>
                <Input
                  id="vendor-notes"
                  value={form.notes}
                  onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      }
      right={
        <>
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <SaveButton className="w-full" label="Create Vendor" savingLabel="Creating..." onClick={handleCreate} isSaving={createVendor.isPending} />
              <Button type="button" variant="outline" className="w-full" asChild>
                <Link href="/vendors">Cancel</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Tips</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>Use clear vendor type naming to simplify assignment filters.</p>
              <p>Keep contact and dispatch details current for faster scheduling.</p>
            </CardContent>
          </Card>
        </>
      }
    />
  );
}
