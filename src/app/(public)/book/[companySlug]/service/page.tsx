"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { BookingShell } from "@/components/layout/booking-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Home, Wind, type LucideIcon } from "lucide-react";
import { getServices } from "@/lib/mock/services";

const mockCompany = {
  name: "Acme Home Inspections",
  slug: "acme-inspections",
  logo: null,
};

const coreMetaByName: Record<
  string,
  { icon: LucideIcon; duration?: string; priceNote?: string; popular?: boolean }
> = {
  "Full Home Inspection": {
    icon: Home,
    duration: "2-3 hours",
    priceNote: "Based on home size",
    popular: true,
  },
  "Pre-Listing Inspection": {
    icon: Home,
    duration: "1.5-2 hours",
    priceNote: "Based on home size",
  },
  "4-Point Inspection": {
    icon: Home,
    duration: "1-2 hours",
  },
  "Wind Mitigation Inspection": {
    icon: Wind,
    duration: "45-60 min",
  },
  "11th Month Warranty Inspection": {
    icon: Home,
    duration: "2-3 hours",
  },
};

export default function BookingCoreServicePage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = (params as { companySlug?: string }).companySlug || mockCompany.slug;

  const services = useMemo(() => {
    return getServices()
      .filter((service) => service.category !== "addon")
      .map((service) => {
        const meta = coreMetaByName[service.name] ?? {
          icon: Home,
        };
        return {
          id: service.serviceId,
          name: service.name,
          description: service.description ?? "",
          icon: meta.icon,
          duration: meta.duration,
          basePrice: service.price ?? 0,
          priceNote: meta.priceNote,
          popular: meta.popular ?? false,
        };
      });
  }, []);

  const [selectedService, setSelectedService] = useState<string | null>(
    searchParams.get("service") || null
  );

  const buildUrl = (path: string) => {
    const nextParams = new URLSearchParams(searchParams.toString());
    if (selectedService) {
      nextParams.set("service", selectedService);
    }
    return `/book/${slug}/${path}?${nextParams.toString()}`;
  };

  const handleContinue = () => {
    router.push(buildUrl("addons"));
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <BookingShell companyName={mockCompany.name} currentStep={3} totalSteps={8}>
      <div className="mx-auto max-w-3xl space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">Choose Inspection Type</h1>
          <p className="mt-2 text-muted-foreground">
            Select the core inspection service that fits your property
          </p>
        </div>

        <div className="space-y-4">
          <div className="grid gap-4">
            {services.map((service) => {
              const Icon = service.icon;
              const isSelected = selectedService === service.id;

              return (
                <Card
                  key={service.id}
                  className={`cursor-pointer transition-all ${
                    isSelected
                      ? "border-primary ring-2 ring-primary ring-offset-2"
                      : "hover:border-primary/50"
                  }`}
                  onClick={() => setSelectedService(service.id)}
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
                      {service.duration && (
                        <p className="text-sm text-muted-foreground">
                          {service.duration}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">${service.basePrice}</p>
                      {service.priceNote && (
                        <p className="text-xs text-muted-foreground">
                          {service.priceNote}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={handleBack}>
            Back
          </Button>
          <Button size="lg" onClick={handleContinue} disabled={!selectedService}>
            Continue
          </Button>
        </div>
      </div>
    </BookingShell>
  );
}
