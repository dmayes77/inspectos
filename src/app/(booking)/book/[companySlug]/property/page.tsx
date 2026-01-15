"use client";

import { useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { BookingShell } from "@/components/layout/booking-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FOUNDATION_OPTIONS, GARAGE_OPTIONS, STORY_OPTIONS } from "@/lib/constants/property-options";

const mockCompany = {
  name: "Acme Home Inspections",
  slug: "acme-inspections",
  logo: null,
};

const STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY",
];

const PROPERTY_TYPES = [
  "Single Family",
  "Townhome",
  "Condo",
  "Multi-Family",
  "New Construction",
];

export default function BookingPropertyPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = (params as { companySlug?: string }).companySlug || mockCompany.slug;

  const [formData, setFormData] = useState({
    street: searchParams.get("street") || "",
    city: searchParams.get("city") || "",
    state: searchParams.get("state") || "",
    zip: searchParams.get("zip") || "",
    sqft: searchParams.get("sqft") || "",
    yearBuilt: searchParams.get("yearBuilt") || "",
    propertyType: searchParams.get("propertyType") || "",
    bedrooms: searchParams.get("bedrooms") || "",
    bathrooms: searchParams.get("bathrooms") || "",
    stories: searchParams.get("stories") || "",
    foundation: searchParams.get("foundation") || "",
    garage: searchParams.get("garage") || "",
    pool: searchParams.get("pool") || "",
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleBathroomsChange = (value: string) => {
    const numeric = Number(value);
    if (Number.isNaN(numeric)) {
      handleChange("bathrooms", value);
      return;
    }
    const normalized = numeric > 4 ? Math.round(numeric) : numeric;
    handleChange("bathrooms", String(normalized));
  };

  const buildUrl = (path: string) => {
    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.set("street", formData.street);
    nextParams.set("city", formData.city);
    nextParams.set("state", formData.state);
    nextParams.set("zip", formData.zip);
    nextParams.set("sqft", formData.sqft);
    nextParams.set("yearBuilt", formData.yearBuilt);
    nextParams.set("propertyType", formData.propertyType);
    nextParams.set("bedrooms", formData.bedrooms);
    nextParams.set("bathrooms", formData.bathrooms);
    nextParams.set("stories", formData.stories);
    nextParams.set("foundation", formData.foundation);
    nextParams.set("garage", formData.garage);
    nextParams.set("pool", formData.pool);
    return `/book/${slug}/${path}?${nextParams.toString()}`;
  };

  const handleContinue = () => {
    if (typeof window !== "undefined") {
      const storageKey = `booking-property:${slug}`;
      window.sessionStorage.setItem(storageKey, JSON.stringify(formData));
    }
    router.push(buildUrl("service"));
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <BookingShell companyName={mockCompany.name} currentStep={2} totalSteps={8}>
      <div className="mx-auto max-w-3xl space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">Property Details</h1>
          <p className="mt-2 text-muted-foreground">
            Tell us about the property you&apos;d like inspected
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Property Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="street">Street Address</Label>
              <Input
                id="street"
                value={formData.street}
                onChange={(event) => handleChange("street", event.target.value)}
                placeholder="123 Main Street"
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(event) => handleChange("city", event.target.value)}
                  placeholder="Denver"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Select
                  value={formData.state}
                  onValueChange={(value) => handleChange("state", value)}
                >
                  <SelectTrigger id="state">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATES.map((state) => (
                      <SelectItem key={state} value={state}>
                        {state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="zip">Zip Code</Label>
                <Input
                  id="zip"
                  value={formData.zip}
                  onChange={(event) => handleChange("zip", event.target.value)}
                  placeholder="80202"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="propertyType">Property Type</Label>
                <Select
                  value={formData.propertyType}
                  onValueChange={(value) => handleChange("propertyType", value)}
                >
                  <SelectTrigger id="propertyType">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROPERTY_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="bedrooms">Bedrooms</Label>
                <Input
                  id="bedrooms"
                  type="number"
                  min="1"
                  step="1"
                  value={formData.bedrooms}
                  onChange={(event) => handleChange("bedrooms", event.target.value)}
                  onFocus={() => {
                    if (!formData.bedrooms) {
                      handleChange("bedrooms", "1");
                    }
                  }}
                  placeholder="4"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bathrooms">Bathrooms</Label>
                <Input
                  id="bathrooms"
                  type="number"
                  min="1"
                  step="0.5"
                  value={formData.bathrooms}
                  onChange={(event) => handleBathroomsChange(event.target.value)}
                  onFocus={() => {
                    if (!formData.bathrooms) {
                      handleChange("bathrooms", "1");
                    }
                  }}
                  placeholder="2.5"
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="sqft">Square Feet</Label>
                <Input
                  id="sqft"
                  value={formData.sqft}
                  onChange={(event) => handleChange("sqft", event.target.value)}
                  placeholder="2400"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="yearBuilt">Year Built</Label>
                <Input
                  id="yearBuilt"
                  value={formData.yearBuilt}
                  onChange={(event) => handleChange("yearBuilt", event.target.value)}
                  placeholder="1998"
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="stories">Stories</Label>
                <Select
                  value={formData.stories}
                  onValueChange={(value) => handleChange("stories", value)}
                >
                  <SelectTrigger id="stories">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {STORY_OPTIONS.map((story) => (
                      <SelectItem key={story} value={story}>
                        {story}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="foundation">Foundation</Label>
                <Select
                  value={formData.foundation}
                  onValueChange={(value) => handleChange("foundation", value)}
                >
                  <SelectTrigger id="foundation">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {FOUNDATION_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="garage">Garage</Label>
                <Select
                  value={formData.garage}
                  onValueChange={(value) => handleChange("garage", value)}
                >
                  <SelectTrigger id="garage">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {GARAGE_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="pool">Pool</Label>
                <Select
                  value={formData.pool}
                  onValueChange={(value) => handleChange("pool", value)}
                >
                  <SelectTrigger id="pool">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={handleBack}>
            Back
          </Button>
          <Button size="lg" onClick={handleContinue}>
            Continue
          </Button>
        </div>
      </div>
    </BookingShell>
  );
}
