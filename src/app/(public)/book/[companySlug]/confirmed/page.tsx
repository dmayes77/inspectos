"use client";

import { useEffect, useMemo } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { BookingShell } from "@/components/layout/booking-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle2,
  Calendar,
  MapPin,
  User,
  Phone,
  Download,
  CalendarPlus,
} from "lucide-react";
import { getServices } from "@/lib/mock/services";
import { addInspection } from "@/lib/mock/inspections";
import { addClient, getClients, updateClient } from "@/lib/mock/clients";
import { getTeamMemberById } from "@/lib/mock/team";

const mockCompany = {
  name: "Acme Home Inspections",
  slug: "acme-inspections",
  logo: null,
};

export default function BookConfirmedPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = (params as { companySlug?: string }).companySlug || mockCompany.slug;

  const bookingId = searchParams.get("booking") || `bk_${slug}`;
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
  const total = selectedServices.reduce(
    (sum, id) => sum + (servicesById[id]?.price || 0),
    0
  );

  const inspectionDate = searchParams.get("date") || "";
  const inspectionTime = searchParams.get("time") || "";
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

  const clientName = searchParams.get("name") || "";
  const clientEmail = searchParams.get("email") || "";
  const clientPhone = searchParams.get("phone") || "";

  const propertyStreet = searchParams.get("street") || propertyStorage?.street || "";
  const propertyCity = searchParams.get("city") || propertyStorage?.city || "";
  const propertyState = searchParams.get("state") || propertyStorage?.state || "";
  const propertyZip = searchParams.get("zip") || propertyStorage?.zip || "";
  const propertyType = searchParams.get("propertyType") || propertyStorage?.propertyType || "";
  const sqft = Number(searchParams.get("sqft") || propertyStorage?.sqft || 0) || undefined;
  const yearBuilt = Number(searchParams.get("yearBuilt") || propertyStorage?.yearBuilt || 0) || undefined;
  const bedrooms = Number(searchParams.get("bedrooms") || propertyStorage?.bedrooms || 0) || undefined;
  const bathrooms = Number(searchParams.get("bathrooms") || propertyStorage?.bathrooms || 0) || undefined;
  const stories = searchParams.get("stories") || propertyStorage?.stories || undefined;
  const foundation = searchParams.get("foundation") || propertyStorage?.foundation || undefined;
  const garage = searchParams.get("garage") || propertyStorage?.garage || undefined;
  const poolParam = searchParams.get("pool") || propertyStorage?.pool;
  const pool = poolParam === "yes" ? true : poolParam === "no" ? false : undefined;

  const formattedAddress = [propertyStreet, propertyCity, propertyState, propertyZip]
    .filter(Boolean)
    .join(", ");

  useEffect(() => {
    if (!bookingId) return;
    const key = `booking-created:${bookingId}`;
    if (typeof window === "undefined") return;
    if (window.sessionStorage.getItem(key)) return;

    const existing = getClients(true).find((client) => client.email === clientEmail);
    const client = existing
      ? updateClient(existing.clientId, {
          inspections: existing.inspections + 1,
          lastInspection: inspectionDate,
          totalSpent: existing.totalSpent + total,
        })
      : addClient({
          name: clientName || "New Client",
          email: clientEmail || "",
          phone: clientPhone || "",
          type: "Homebuyer",
          inspections: 1,
          lastInspection: inspectionDate,
          totalSpent: total,
        });

    addInspection({
      address: formattedAddress,
      client: clientName,
      clientId: client?.clientId || "",
      inspector: inspector?.name || "",
      inspectorId: inspector?.teamMemberId || "",
      date: inspectionDate,
      time: inspectionTime,
      types: selectedServices
        .map((id) => servicesById[id]?.name || "")
        .filter(Boolean),
      status: "scheduled",
      price: total,
      sqft,
      yearBuilt,
      propertyType,
      bedrooms,
      bathrooms,
      stories,
      foundation,
      garage,
      pool,
    });

    window.sessionStorage.setItem(key, "true");
  }, [
    bookingId,
    clientEmail,
    clientName,
    clientPhone,
    formattedAddress,
    inspectionDate,
    inspectionTime,
    inspector,
    propertyType,
    bedrooms,
    bathrooms,
    stories,
    foundation,
    garage,
    pool,
    servicesById,
    selectedServices,
    sqft,
    total,
    yearBuilt,
  ]);

  const handleAddToCalendar = () => {
    alert("Calendar integration would open here");
  };

  const handleDownloadReceipt = () => {
    alert("Receipt download would start here");
  };

  const formatAppointment = () => {
    if (!inspectionDate || !inspectionTime) return "—";
    const dateParts = inspectionDate.split("-").map((part) => Number(part));
    if (dateParts.length !== 3 || dateParts.some((part) => Number.isNaN(part))) {
      return `${inspectionDate} at ${inspectionTime}`;
    }
    const [year, month, day] = dateParts;
    const timeMatch = inspectionTime.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!timeMatch) {
      return `${inspectionDate} at ${inspectionTime}`;
    }
    const hours = Number(timeMatch[1]);
    const minutes = Number(timeMatch[2]);
    const meridiem = timeMatch[3].toUpperCase();
    const hour24 = meridiem === "PM" ? (hours % 12) + 12 : hours % 12;
    const parsed = new Date(year, month - 1, day, hour24, minutes);
    if (Number.isNaN(parsed.getTime())) {
      return `${inspectionDate} at ${inspectionTime}`;
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

  return (
    <BookingShell companyName={mockCompany.name} currentStep={8} totalSteps={8}>
      <div className="mx-auto max-w-2xl space-y-8">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle2 className="h-10 w-10 text-emerald-600" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Booking Confirmed!</h1>
          <p className="mt-2 text-muted-foreground">Confirmation #{bookingId}</p>
        </div>

        <Card>
          <CardContent className="p-6">
            <h2 className="mb-4 text-lg font-semibold">Appointment Details</h2>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Calendar className="mt-0.5 h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">{formatAppointment()}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">{propertyStreet || "—"}</p>
                  <p className="text-sm text-muted-foreground">
                    {[propertyCity, propertyState, propertyZip].filter(Boolean).join(", ") || "—"}
                  </p>
                </div>
              </div>

              <Separator />

              <div>
                <p className="mb-2 text-sm font-medium text-muted-foreground">
                  Your Inspector
                </p>
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{inspector?.name || "Assigned Soon"}</p>
                    {inspector?.phone && (
                      <div className="mt-1 flex flex-col gap-1 text-sm text-muted-foreground">
                        <a
                          href={`tel:${inspector.phone}`}
                          className="flex items-center gap-1 hover:text-foreground"
                        >
                          <Phone className="h-3 w-3" />
                          {inspector.phone}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h2 className="mb-4 text-lg font-semibold">Order Summary</h2>

            <div className="space-y-2">
              {selectedServices.map((id) => (
                <div key={id} className="flex justify-between text-sm">
                  <span>{servicesById[id]?.name || "Service"}</span>
                  <span>${(servicesById[id]?.price || 0).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <Separator className="my-4" />

            <div className="flex justify-between text-base font-semibold">
              <span>Total Paid</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h2 className="mb-4 text-lg font-semibold">What&apos;s Next?</h2>

            <ol className="space-y-3 text-sm">
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                  1
                </span>
                <span>
                  <strong>Confirmation email sent</strong> to {clientEmail || "your inbox"}
                </span>
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                  2
                </span>
                <span>
                  <strong>Inspector arrives</strong> at the scheduled time
                </span>
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                  3
                </span>
                <span>
                  <strong>Report delivered within 24 hours</strong> via email
                </span>
              </li>
            </ol>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button className="flex-1" onClick={handleAddToCalendar}>
            <CalendarPlus className="mr-2 h-4 w-4" />
            Add to Calendar
          </Button>
          <Button variant="outline" className="flex-1" onClick={handleDownloadReceipt}>
            <Download className="mr-2 h-4 w-4" />
            Download Receipt
          </Button>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Questions? Contact us at{" "}
          <a href={`mailto:${clientEmail}`} className="text-primary hover:underline">
            {clientEmail || "support@inspectos.com"}
          </a>
        </p>
      </div>
    </BookingShell>
  );
}
