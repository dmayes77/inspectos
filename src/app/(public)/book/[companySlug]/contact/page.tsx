"use client";

import { useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { BookingShell } from "@/components/layout/booking-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const mockCompany = {
  name: "Acme Home Inspections",
  slug: "acme-inspections",
  logo: null,
};

export default function BookingContactPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = (params as { companySlug?: string }).companySlug || mockCompany.slug;

  const [formData, setFormData] = useState({
    name: searchParams.get("name") || "",
    email: searchParams.get("email") || "",
    phone: searchParams.get("phone") || "",
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const buildUrl = (path: string) => {
    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.set("name", formData.name);
    nextParams.set("email", formData.email);
    nextParams.set("phone", formData.phone);
    return `/book/${slug}/${path}?${nextParams.toString()}`;
  };

  const handleContinue = () => {
    router.push(buildUrl("property"));
  };

  return (
    <BookingShell companyName={mockCompany.name} currentStep={1} totalSteps={8}>
      <div className="mx-auto max-w-3xl space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">Contact Information</h1>
          <p className="mt-2 text-muted-foreground">
            Tell us who to contact about this inspection
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Your Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(event) => handleChange("name", event.target.value)}
                placeholder="Jane Smith"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(event) => handleChange("email", event.target.value)}
                placeholder="jane@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(event) => handleChange("phone", event.target.value)}
                placeholder="(555) 123-4567"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button size="lg" onClick={handleContinue}>
            Continue
          </Button>
        </div>
      </div>
    </BookingShell>
  );
}
