"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft } from "lucide-react";
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

  useEffect(() => {
    if (client) {
      setForm({
        name: client.name,
        email: client.email,
        phone: client.phone,
        type: client.type,
      });
    }
  }, [client]);

  if (isLoading) {
    return (
      <AppShell user={mockAdminUser}>
        <div className="py-12 text-center text-muted-foreground">Loading client...</div>
      </AppShell>
    );
  }

  if (!client) {
    return (
      <AppShell user={mockAdminUser}>
        <div className="space-y-6">
          <Button variant="ghost" asChild>
            <Link href="/admin/clients">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Clients
            </Link>
          </Button>
          <div className="text-center py-12">
            <h1 className="text-2xl font-semibold mb-2">Client Not Found</h1>
            <p className="text-muted-foreground">The client you are looking for does not exist.</p>
          </div>
        </div>
      </AppShell>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    await updateClient.mutateAsync({
      clientId: client.clientId,
      ...form,
    });

    setIsSaving(false);
    router.push(`/admin/clients/${client.clientId}`);
  };

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <AppShell user={mockAdminUser}>
      <div className="space-y-6 max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" asChild>
            <Link href={`/admin/clients/${client.clientId}`}>
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Client
            </Link>
          </Button>
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
                  value={form.name || ""}
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
                  value={form.email || ""}
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
                  value={form.phone || ""}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  required
                />
              </div>

              {/* Type */}
              <div className="space-y-2">
                <Label htmlFor="type">Client Type *</Label>
                <Select value={form.type || ""} onValueChange={(value) => handleChange("type", value)}>
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
    </AppShell>
  );
}
