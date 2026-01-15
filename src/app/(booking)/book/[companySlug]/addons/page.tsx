"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { BookingShell } from "@/components/layout/booking-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Droplets, TestTube, Wind, type LucideIcon } from "lucide-react";
import { getServices } from "@/lib/mock/services";

const mockCompany = {
  name: "Acme Home Inspections",
  slug: "acme-inspections",
  logo: null,
};

const addonMetaByName: Record<string, { icon: LucideIcon; duration?: string }> = {
  "Radon Test": { icon: TestTube, duration: "48 hours" },
  "Mold Inspection": { icon: Wind, duration: "Add 30 min" },
  "Termite Inspection": { icon: Droplets, duration: "Add 30 min" },
  "Pool/Spa Inspection": { icon: Droplets, duration: "Add 30 min" },
  "Sewer Scope": { icon: Droplets, duration: "Add 30 min" },
  "Infrared Thermal Imaging": { icon: TestTube, duration: "Add 45 min" },
  "Well Water Testing": { icon: TestTube, duration: "Add 30 min" },
  "Septic System Inspection": { icon: Droplets, duration: "1-2 hours" },
};

export default function BookingAddonsPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = (params as { companySlug?: string }).companySlug || mockCompany.slug;

  const addons = useMemo(() => {
    return getServices()
      .filter((service) => service.category === "addon")
      .map((service) => {
        const meta = addonMetaByName[service.name] ?? {
          icon: Droplets,
        };
        return {
          id: service.serviceId,
          name: service.name,
          description: service.description ?? "",
          icon: meta.icon,
          duration: meta.duration,
          basePrice: service.price ?? 0,
        };
      });
  }, []);

  const initialAddons = searchParams.get("addons")?.split(",").filter(Boolean) || [];
  const [selectedAddons, setSelectedAddons] = useState<string[]>(initialAddons);

  const handleAddonToggle = (id: string) => {
    setSelectedAddons((prev) =>
      prev.includes(id) ? prev.filter((addon) => addon !== id) : [...prev, id]
    );
  };

  const buildUrl = (path: string) => {
    const nextParams = new URLSearchParams(searchParams.toString());
    if (selectedAddons.length > 0) {
      nextParams.set("addons", selectedAddons.join(","));
    } else {
      nextParams.delete("addons");
    }
    return `/book/${slug}/${path}?${nextParams.toString()}`;
  };

  const handleContinue = () => {
    router.push(buildUrl("schedule"));
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <BookingShell companyName={mockCompany.name} currentStep={4} totalSteps={8}>
      <div className="mx-auto max-w-3xl space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">Enhancements</h1>
          <p className="mt-2 text-muted-foreground">
            Add optional services to enhance your inspection
          </p>
        </div>

        <div className="grid gap-3">
          {addons.map((service) => {
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
                    {service.duration && (
                      <p className="text-xs text-muted-foreground">
                        {service.duration}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

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
