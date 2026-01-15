"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { BookingShell } from "@/components/layout/booking-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock } from "lucide-react";
import { getServices } from "@/lib/mock/services";

const mockCompany = {
  name: "Acme Home Inspections",
  slug: "acme-inspections",
  logo: null,
};

export default function BookingPaymentPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = (params as { companySlug?: string }).companySlug || mockCompany.slug;

  const serviceId = searchParams.get("service") || "";
  const addonIds = searchParams.get("addons")?.split(",").filter(Boolean) || [];

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

  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsProcessing(true);
    await new Promise((resolve) => setTimeout(resolve, 1200));
    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.set("booking", `bk_${Date.now()}`);
    router.push(`/book/${slug}/confirmed?${nextParams.toString()}`);
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <BookingShell companyName={mockCompany.name} currentStep={7} totalSteps={8}>
      <div className="mx-auto max-w-3xl space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">Payment</h1>
          <p className="mt-2 text-muted-foreground">
            This is a mock payment step until Stripe is connected
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Payment Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cardNumber">Card Number</Label>
                <Input id="cardNumber" placeholder="4242 4242 4242 4242" />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="expiry">Expiration</Label>
                  <Input id="expiry" placeholder="MM/YY" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cvc">CVC</Label>
                  <Input id="cvc" placeholder="123" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="zip">Billing Zip</Label>
                <Input id="zip" placeholder="90210" />
              </div>

              <div className="flex items-center justify-between border-t pt-4 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Lock className="h-4 w-4" />
                  Secure mock checkout
                </div>
                <div className="text-base font-semibold">Total: ${subtotal}</div>
              </div>

              <div className="flex items-center justify-between">
                <Button type="button" variant="outline" onClick={handleBack}>
                  Back
                </Button>
                <Button type="submit" size="lg" disabled={isProcessing}>
                  {isProcessing ? "Processing..." : "Complete Booking"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </BookingShell>
  );
}
