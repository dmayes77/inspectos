"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AdminShell } from "@/components/layout/admin-shell";
import { AdminPageHeader } from "@/components/layout/admin-page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft } from "lucide-react";
import { useCreateClient } from "@/hooks/use-clients";
import { mockAdminUser } from "@/lib/constants/mock-users";

const clientTypes = [
  { value: "Homebuyer", label: "Homebuyer" },
  { value: "Real Estate Agent", label: "Real Estate Agent" },
  { value: "Seller", label: "Seller" },
];

export default function NewClientPage() {
  const router = useRouter();
  const createClient = useCreateClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const payload = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      type: formData.get("type") as string,
      inspections: 0,
      lastInspection: "Never",
      totalSpent: 0,
    };

    try {
      const result = await createClient.mutateAsync(payload);
      setIsSubmitting(false);
      router.push(`/admin/clients/${result.clientId}`);
    } catch (err) {
      setIsSubmitting(false);
      console.error("Failed to create client:", err);
    }
  };

  return (
    <AdminShell user={mockAdminUser}>
      <div className="space-y-6 max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" asChild>
            <Link href="/admin/clients">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Clients
            </Link>
          </Button>
        </div>

        <AdminPageHeader
          title="New Client"
          description="Add a new client to your database"
        />

        {/* Create Form */}
        <Card>
          <CardHeader>
            <CardTitle>Client Information</CardTitle>
            <CardDescription>Enter the client details below</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input id="name" name="name" placeholder="John Doe" required />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input id="email" name="email" type="email" placeholder="john@example.com" required />
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone">Phone *</Label>
                <Input id="phone" name="phone" type="tel" placeholder="(512) 555-1234" required />
              </div>

              {/* Type */}
              <div className="space-y-2">
                <Label htmlFor="type">Client Type *</Label>
                <Select name="type" required>
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
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Creating..." : "Create Client"}
                </Button>
                <Button type="button" variant="outline" asChild>
                  <Link href="/admin/clients">Cancel</Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}
