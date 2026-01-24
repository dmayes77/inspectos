"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AdminShell } from "@/components/layout/admin-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/ui/back-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useClientById, useUpdateClient, type Client } from "@/hooks/use-clients";
import { mockAdminUser } from "@/lib/constants/mock-users";

const clientTypes = [
  { value: "Homebuyer", label: "Homebuyer" },
  { value: "Real Estate Agent", label: "Real Estate Agent" },
  { value: "Seller", label: "Seller" },
];

export default function EditClientPage() {
  const params = useParams();
  const router = useRouter();
  const { id } = params as { id: string };

  const { data: client, isLoading } = useClientById(id);
  const updateClient = useUpdateClient();

  const [form, setForm] = useState<Partial<Client>>({});
  const [isSaving, setIsSaving] = useState(false);

  const nameValue = form.name ?? client?.name ?? "";
  const emailValue = form.email ?? client?.email ?? "";
  const phoneValue = form.phone ?? client?.phone ?? "";
  const typeValue = form.type ?? client?.type ?? "";

  if (isLoading) {
    return (
      <AdminShell user={mockAdminUser}>
        <div className="py-12 text-center text-muted-foreground">Loading client...</div>
      </AdminShell>
    );
  }

  if (!client) {
    return (
      <AdminShell user={mockAdminUser}>
        <div className="space-y-6">
          <BackButton href="/admin/clients" label="Back to Clients" variant="ghost" />
          <div className="text-center py-12">
            <h1 className="text-2xl font-semibold mb-2">Client Not Found</h1>
            <p className="text-muted-foreground">The client you are looking for does not exist.</p>
          </div>
        </div>
      </AdminShell>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    await updateClient.mutateAsync({
      clientId: client.clientId,
      name: nameValue,
      email: emailValue,
      phone: phoneValue,
      type: typeValue,
    });

    setIsSaving(false);
    router.push(`/admin/clients/${client.clientId}`);
  };

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <AdminShell user={mockAdminUser}>
      <div className="space-y-6 max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <BackButton href={`/admin/clients/${client.clientId}`} label="Back to Client" variant="ghost" />
        </div>

        {/* Edit Form */}
        <Card>
          <CardHeader>
            <CardTitle>Edit Client</CardTitle>
            <CardDescription>Update client information</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={nameValue}
                  onChange={(e) => handleChange("name", e.target.value)}
                  required
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={emailValue}
                  onChange={(e) => handleChange("email", e.target.value)}
                  required
                />
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone">Phone *</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phoneValue}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  required
                />
              </div>

              {/* Type */}
              <div className="space-y-2">
                <Label htmlFor="type">Client Type *</Label>
                <Select value={typeValue} onValueChange={(value) => handleChange("type", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {clientTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4">
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
                <Button type="button" variant="outline" asChild>
                  <Link href={`/admin/clients/${client.clientId}`}>Cancel</Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}
