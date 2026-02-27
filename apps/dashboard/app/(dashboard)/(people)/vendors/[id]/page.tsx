"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { IdPageLayout } from "@/components/shared/id-page-layout";
import { SaveButton, DeleteButton } from "@/components/shared/action-buttons";
import { useVendor, useDeleteVendor, useUpdateVendor, type Vendor } from "@/hooks/use-vendors";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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

export default function VendorDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const { data: vendor, isLoading } = useVendor(id);
  const updateVendor = useUpdateVendor();
  const { mutate: deleteVendor, isPending: isDeleting } = useDeleteVendor();

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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    if (!vendor) return;
    setForm({
      name: vendor.name ?? "",
      contactPerson: vendor.contactPerson ?? "",
      vendorType: vendor.vendorType ?? "",
      email: vendor.email ?? "",
      phone: vendor.phone ?? "",
      addressLine1: vendor.addressLine1 ?? "",
      addressLine2: vendor.addressLine2 ?? "",
      city: vendor.city ?? "",
      stateRegion: vendor.stateRegion ?? "",
      postalCode: vendor.postalCode ?? "",
      country: vendor.country ?? "",
      notes: vendor.notes ?? "",
      status: vendor.status ?? "active",
    });
  }, [vendor]);

  const handleSave = async () => {
    if (!vendor) return;
    await updateVendor.mutateAsync({
      id: vendor.id,
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
    } as Partial<Vendor> & { id: string });
  };

  const handleDelete = () => {
    if (!vendor) return;
    deleteVendor(vendor.id, {
      onSuccess: () => {
        setDeleteDialogOpen(false);
        router.push("/vendors");
      },
    });
  };

  if (isLoading) {
    return <div className="p-8 text-sm text-muted-foreground">Loading vendor...</div>;
  }

  if (!vendor) {
    return (
      <IdPageLayout
        title="Vendor Not Found"
        description="We couldn't locate this vendor record."
        left={null}
      />
    );
  }

  return (
    <>
      <IdPageLayout
        title={vendor.name}
        description="Manage vendor profile and contact details"
        breadcrumb={
          <>
            <Link href="/vendors" className="text-muted-foreground transition hover:text-foreground">
              Vendors
            </Link>
            <span className="text-muted-foreground">{">"}</span>
            <span className="max-w-[20rem] truncate font-medium">{vendor.name}</span>
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
                <SaveButton className="w-full" onClick={handleSave} isSaving={updateVendor.isPending} />
                <DeleteButton className="w-full" label="Delete Vendor" onClick={() => setDeleteDialogOpen(true)} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Tips</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>Keep vendor contact channels current for scheduling handoffs.</p>
                <p>Use inactive status instead of deleting when record history should remain.</p>
              </CardContent>
            </Card>
          </>
        }
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete vendor?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this vendor? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete Anyway"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
