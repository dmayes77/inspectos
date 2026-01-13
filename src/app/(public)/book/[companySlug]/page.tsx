"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BookingShell } from "@/components/layout/booking-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Home, TestTube, Wind, Droplets, Check } from "lucide-react";

// Mock company data - would be fetched from API
const mockCompany = {
  name: "Acme Home Inspections",
  slug: "acme-inspections",
  logo: null,
};

// Mock services - would be fetched based on company
const services = [
  {
    id: "full-home",
    name: "Full Home Inspection",
    description: "Comprehensive inspection of all systems including roof, foundation, HVAC, electrical, plumbing, and more.",
    icon: Home,
    duration: "2-3 hours",
    basePrice: 400,
    priceNote: "Based on home size",
    isAddon: false,
    popular: true,
  },
  {
    id: "pre-listing",
    name: "Pre-Listing Inspection",
    description: "Seller inspection to identify issues before listing. Get ahead of buyer concerns.",
    icon: Home,
    duration: "1.5-2 hours",
    basePrice: 350,
    priceNote: "Based on home size",
    isAddon: false,
    popular: false,
  },
  {
    id: "radon",
    name: "Radon Testing",
    description: "48-hour continuous radon monitoring with EPA-approved equipment.",
    icon: TestTube,
    duration: "48 hours",
    basePrice: 150,
    priceNote: null,
    isAddon: true,
    popular: false,
  },
  {
    id: "mold",
    name: "Mold Inspection",
    description: "Visual inspection plus air quality sampling for mold spores.",
    icon: Wind,
    duration: "Add 30 min",
    basePrice: 200,
    priceNote: null,
    isAddon: true,
    popular: false,
  },
  {
    id: "sewer",
    name: "Sewer Scope",
    description: "Video camera inspection of main sewer line from house to street.",
    icon: Droplets,
    duration: "Add 30 min",
    basePrice: 175,
    priceNote: null,
    isAddon: true,
    popular: false,
  },
];

export default function BookServicePage() {
  const router = useRouter();
  const [selectedMain, setSelectedMain] = useState<string | null>(null);
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);

  const mainServices = services.filter((s) => !s.isAddon);
  const addonServices = services.filter((s) => s.isAddon);

  const selectedServices = services.filter(
    (s) => s.id === selectedMain || selectedAddons.includes(s.id)
  );
  const totalPrice = selectedServices.reduce((sum, s) => sum + s.basePrice, 0);

  const handleAddonToggle = (id: string) => {
    setSelectedAddons((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  };

  const handleContinue = () => {
    // Store selections in URL params or state
    const addons = selectedAddons.join(",");
    router.push(
      `/book/${mockCompany.slug}/schedule?service=${selectedMain}${addons ? `&addons=${addons}` : ""}`
    );
  };

  return (
    <BookingShell companyName={mockCompany.name} currentStep={1}>
      <div className="mx-auto max-w-3xl space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">Book Your Inspection</h1>
          <p className="mt-2 text-muted-foreground">
            Select the services you need for your property
          </p>
        </div>

        {/* Main Services */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Inspection Type</h2>
          <div className="grid gap-4">
            {mainServices.map((service) => {
              const Icon = service.icon;
              const isSelected = selectedMain === service.id;

              return (
                <Card
                  key={service.id}
                  className={`cursor-pointer transition-all ${
                    isSelected
                      ? "border-primary ring-2 ring-primary ring-offset-2"
                      : "hover:border-primary/50"
                  }`}
                  onClick={() => setSelectedMain(service.id)}
                >
                  <CardContent className="flex items-start gap-4 p-6">
                    <div
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${
                        isSelected ? "bg-primary text-primary-foreground" : "bg-slate-100"
                      }`}
                    >
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{service.name}</h3>
                        {service.popular && (
                          <Badge className="bg-primary">Most Popular</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {service.description}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {service.duration}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">${service.basePrice}</p>
                      {service.priceNote && (
                        <p className="text-xs text-muted-foreground">
                          {service.priceNote}
                        </p>
                      )}
                    </div>
                    <div
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${
                        isSelected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-slate-300"
                      }`}
                    >
                      {isSelected && <Check className="h-4 w-4" />}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Add-on Services */}
        {selectedMain && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Add-on Services</h2>
            <div className="grid gap-3">
              {addonServices.map((service) => {
                const Icon = service.icon;
                const isSelected = selectedAddons.includes(service.id);

                return (
                  <Card
                    key={service.id}
                    className={`cursor-pointer transition-all ${
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "hover:border-primary/50"
                    }`}
                    onClick={() => handleAddonToggle(service.id)}
                  >
                    <CardContent className="flex items-center gap-4 p-4">
                      <Checkbox
                        checked={isSelected}
                        className="h-5 w-5"
                        onCheckedChange={() => handleAddonToggle(service.id)}
                      />
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                          isSelected ? "bg-primary/10 text-primary" : "bg-slate-100"
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium">{service.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {service.description}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">+${service.basePrice}</p>
                        <p className="text-xs text-muted-foreground">
                          {service.duration}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Summary & Continue */}
        {selectedMain && (
          <Card className="sticky bottom-4 border-2 border-primary bg-white shadow-lg">
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="text-sm text-muted-foreground">
                  {selectedServices.length} service{selectedServices.length > 1 ? "s" : ""} selected
                </p>
                <p className="text-2xl font-bold">
                  ${totalPrice}
                  <span className="text-sm font-normal text-muted-foreground">
                    {" "}estimated
                  </span>
                </p>
              </div>
              <Button size="lg" onClick={handleContinue}>
                Continue to Scheduling
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </BookingShell>
  );
}
