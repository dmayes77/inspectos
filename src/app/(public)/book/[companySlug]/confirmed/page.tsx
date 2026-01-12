"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
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
  Mail,
  Download,
  CalendarPlus,
} from "lucide-react";

// Mock company data
const mockCompany = {
  name: "Acme Home Inspections",
  slug: "acme-inspections",
  logo: null,
};

// Mock booking data - would be fetched based on booking ID
const mockBooking = {
  id: "bk_123456789",
  confirmationNumber: "ACME-2026-0110",
  scheduledAt: new Date("2026-01-15T09:00:00"),
  property: {
    street: "123 Main Street",
    city: "Austin",
    state: "TX",
    zip: "78701",
  },
  services: [
    { name: "Full Home Inspection", price: 400 },
    { name: "Radon Testing", price: 150 },
  ],
  inspector: {
    name: "John Smith",
    phone: "(512) 555-4567",
    email: "john@acmeinspections.com",
  },
  client: {
    name: "David Martinez",
    email: "david@example.com",
    phone: "(555) 123-4567",
  },
  payment: {
    depositPaid: 100,
    balanceDue: 450,
    total: 550,
  },
};

export default function BookConfirmedPage({
  params,
}: {
  params: Promise<{ companySlug: string }>;
}) {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get("booking");

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const handleAddToCalendar = () => {
    // Generate ICS file or open calendar link
    const event = {
      title: `Home Inspection - ${mockBooking.property.street}`,
      start: mockBooking.scheduledAt,
      duration: 180, // 3 hours in minutes
      location: `${mockBooking.property.street}, ${mockBooking.property.city}, ${mockBooking.property.state} ${mockBooking.property.zip}`,
    };

    // For demo, just alert
    alert("Calendar integration would open here");
  };

  const handleDownloadReceipt = () => {
    // Generate and download receipt PDF
    alert("Receipt download would start here");
  };

  return (
    <BookingShell companyName={mockCompany.name}>
      <div className="mx-auto max-w-2xl space-y-8">
        {/* Success Header */}
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle2 className="h-10 w-10 text-emerald-600" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Booking Confirmed!</h1>
          <p className="mt-2 text-muted-foreground">
            Confirmation #{mockBooking.confirmationNumber}
          </p>
        </div>

        {/* Appointment Details */}
        <Card>
          <CardContent className="p-6">
            <h2 className="mb-4 text-lg font-semibold">Appointment Details</h2>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Calendar className="mt-0.5 h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">{formatDate(mockBooking.scheduledAt)}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatTime(mockBooking.scheduledAt)}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">{mockBooking.property.street}</p>
                  <p className="text-sm text-muted-foreground">
                    {mockBooking.property.city}, {mockBooking.property.state}{" "}
                    {mockBooking.property.zip}
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
                    <p className="font-medium">{mockBooking.inspector.name}</p>
                    <div className="mt-1 flex flex-col gap-1 text-sm text-muted-foreground">
                      <a
                        href={`tel:${mockBooking.inspector.phone}`}
                        className="flex items-center gap-1 hover:text-foreground"
                      >
                        <Phone className="h-3 w-3" />
                        {mockBooking.inspector.phone}
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Services & Payment */}
        <Card>
          <CardContent className="p-6">
            <h2 className="mb-4 text-lg font-semibold">Order Summary</h2>

            <div className="space-y-2">
              {mockBooking.services.map((service, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span>{service.name}</span>
                  <span>${service.price.toFixed(2)}</span>
                </div>
              ))}
            </div>

            <Separator className="my-4" />

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Total</span>
                <span className="font-medium">
                  ${mockBooking.payment.total.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm text-emerald-600">
                <span>Deposit paid</span>
                <span>-${mockBooking.payment.depositPaid.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-medium">
                <span>Balance due at inspection</span>
                <span>${mockBooking.payment.balanceDue.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* What's Next */}
        <Card>
          <CardContent className="p-6">
            <h2 className="mb-4 text-lg font-semibold">What&apos;s Next?</h2>

            <ol className="space-y-3 text-sm">
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                  1
                </span>
                <span>
                  <strong>Confirmation email sent</strong> to {mockBooking.client.email}
                </span>
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                  2
                </span>
                <span>
                  <strong>Inspector arrives</strong> at scheduled time (typically within
                  15 minutes)
                </span>
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                  3
                </span>
                <span>
                  <strong>Inspection takes 2-3 hours</strong> depending on property size
                </span>
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                  4
                </span>
                <span>
                  <strong>Report delivered within 24 hours</strong> via email with secure
                  link
                </span>
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                  5
                </span>
                <span>
                  <strong>Pay remaining balance</strong> ($
                  {mockBooking.payment.balanceDue}) when report is delivered
                </span>
              </li>
            </ol>
          </CardContent>
        </Card>

        {/* Actions */}
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

        {/* Help */}
        <p className="text-center text-sm text-muted-foreground">
          Questions? Contact us at{" "}
          <a
            href={`mailto:${mockBooking.inspector.email}`}
            className="text-primary hover:underline"
          >
            {mockBooking.inspector.email}
          </a>{" "}
          or{" "}
          <a
            href={`tel:${mockBooking.inspector.phone}`}
            className="text-primary hover:underline"
          >
            {mockBooking.inspector.phone}
          </a>
        </p>
      </div>
    </BookingShell>
  );
}
