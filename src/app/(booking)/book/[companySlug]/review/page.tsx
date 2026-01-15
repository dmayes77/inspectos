"use client";

import { useMemo } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { BookingShell } from "@/components/layout/booking-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getServices } from "@/lib/mock/services";
import { getTeamMemberById } from "@/lib/mock/team";

const mockCompany = {
  name: "Acme Home Inspections",
  slug: "acme-inspections",
  logo: null,
};

export default function BookingReviewPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = (params as { companySlug?: string }).companySlug || mockCompany.slug;

  const serviceId = searchParams.get("service") || "";
  const addonIds = searchParams.get("addons")?.split(",").filter(Boolean) || [];
  const inspectorId = searchParams.get("inspectorId") || "";

  const servicesById = useMemo(() => {
    return Object.fromEntries(
      getServices().map((service) => [
        service.serviceId,
        { name: service.name, price: service.price ?? 0 },
      ])
    );
  }, []);

  const selectedServices = [serviceId, ...addonIds].filter(Boolean);
  const subtotal = selectedServices.reduce(
    (sum, id) => sum + (servicesById[id]?.price || 0),
    0
  );

  const inspector = inspectorId ? getTeamMemberById(inspectorId) : null;
  const propertyStorage = useMemo(() => {
    if (typeof window === "undefined") return null;
    const storageKey = `booking-property:${slug}`;
    const raw = window.sessionStorage.getItem(storageKey);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as Record<string, string>;
    } catch {
      return null;
    }
  }, [slug]);

  const property = useMemo(() => {
    return {
      street: searchParams.get("street") || propertyStorage?.street || "—",
      city: searchParams.get("city") || propertyStorage?.city || "",
      state: searchParams.get("state") || propertyStorage?.state || "",
      zip: searchParams.get("zip") || propertyStorage?.zip || "",
      propertyType: searchParams.get("propertyType") || propertyStorage?.propertyType || "—",
      sqft: searchParams.get("sqft") || propertyStorage?.sqft || "—",
      yearBuilt: searchParams.get("yearBuilt") || propertyStorage?.yearBuilt || "—",
      bedrooms: searchParams.get("bedrooms") || propertyStorage?.bedrooms || "—",
      bathrooms: searchParams.get("bathrooms") || propertyStorage?.bathrooms || "—",
      stories: searchParams.get("stories") || propertyStorage?.stories || "—",
      foundation: searchParams.get("foundation") || propertyStorage?.foundation || "—",
      garage: searchParams.get("garage") || propertyStorage?.garage || "—",
      pool: searchParams.get("pool") || propertyStorage?.pool || "—",
    };
  }, [propertyStorage, searchParams]);

  const buildUrl = (path: string) => {
    const nextParams = new URLSearchParams(searchParams.toString());
    return `/book/${slug}/${path}?${nextParams.toString()}`;
  };

  const handleContinue = () => {
    const clientType = searchParams.get("clientType") || "";
    const skipPayment = clientType === "Real Estate Agent";
    router.push(buildUrl(skipPayment ? "confirmed" : "checkout"));
  };

  const formatAppointment = () => {
    const date = searchParams.get("date");
    const time = searchParams.get("time");
    if (!date || !time) return "—";
    const dateParts = date.split("-").map((part) => Number(part));
    if (dateParts.length !== 3 || dateParts.some((part) => Number.isNaN(part))) {
      return `${date} at ${time}`;
    }
    const [year, month, day] = dateParts;
    const timeMatch = time.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!timeMatch) {
      return `${date} at ${time}`;
    }
    const hours = Number(timeMatch[1]);
    const minutes = Number(timeMatch[2]);
    const meridiem = timeMatch[3].toUpperCase();
    const hour24 =
      meridiem === "PM" ? (hours % 12) + 12 : hours % 12;
    const parsed = new Date(year, month - 1, day, hour24, minutes);
    if (Number.isNaN(parsed.getTime())) {
      return `${date} at ${time}`;
    }
    const currentYear = new Date().getFullYear();
    const includeYear = parsed.getFullYear() !== currentYear;
    const suffix =
      day % 10 === 1 && day % 100 !== 11
        ? "st"
        : day % 10 === 2 && day % 100 !== 12
        ? "nd"
        : day % 10 === 3 && day % 100 !== 13
        ? "rd"
        : "th";
    const datePart = parsed.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      ...(includeYear ? { year: "numeric" } : {}),
    });
    const timePart = parsed.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
    return `${datePart.replace(String(day), `${day}${suffix}`)} at ${timePart}`;
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <BookingShell companyName={mockCompany.name} currentStep={6} totalSteps={8}>
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">Review Your Booking</h1>
          <p className="mt-2 text-muted-foreground">
            Confirm your details before moving to payment
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="font-medium">{searchParams.get("name") || "—"}</p>
                <p className="text-muted-foreground">{searchParams.get("email") || "—"}</p>
                <p className="text-muted-foreground">{searchParams.get("phone") || "—"}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Property Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="font-medium">{property.street}</p>
                <p className="text-muted-foreground">
                  {[property.city, property.state, property.zip]
                    .filter(Boolean)
                    .join(", ") || "—"}
                </p>
                <p className="text-muted-foreground">
                  {property.propertyType} · {property.sqft} sqft · Built {property.yearBuilt}
                </p>
                <p className="text-muted-foreground">
                  {property.bedrooms} bed · {property.bathrooms} bath · {property.stories} stories
                </p>
                <p className="text-muted-foreground">
                  Foundation {property.foundation} · Garage {property.garage} · Pool {property.pool}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Appointment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="font-medium">{formatAppointment()}</p>
                <p className="text-muted-foreground">
                  Inspector: {inspector?.name || "—"}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="h-fit">
            <CardHeader>
              <CardTitle>Service Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="space-y-2">
                {selectedServices.length === 0 && (
                  <p className="text-muted-foreground">No services selected.</p>
                )}
                {selectedServices.map((id) => (
                  <div key={id} className="flex items-center justify-between">
                    <span>{servicesById[id]?.name || "Service"}</span>
                    <span className="font-medium">
                      ${servicesById[id]?.price || 0}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between border-t pt-3 text-base font-semibold">
                <span>Total</span>
                <span>${subtotal}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={handleBack}>
            Back
          </Button>
          <Button size="lg" onClick={handleContinue}>
            Continue to Payment
          </Button>
        </div>
      </div>
    </BookingShell>
  );
}
