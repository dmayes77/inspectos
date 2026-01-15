"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  ChevronLeft,
  CreditCard,
  Lock,
  MapPin,
  Calendar,
  CheckCircle2,
} from "lucide-react";

// Mock report data
const mockReport = {
  id: "rpt_abc123",
  inspection: {
    date: new Date("2026-01-10T09:00:00"),
    property: {
      street: "123 Main Street",
      city: "Austin",
      state: "TX",
      zip: "78701",
    },
  },
  company: {
    name: "Acme Home Inspections",
    logo: null,
  },
  services: [
    { name: "Full Home Inspection", price: 400 },
    { name: "Radon Testing", price: 150 },
  ],
  payment: {
    total: 550,
    depositPaid: 100,
    balance: 450,
  },
};

export default function ReportPayPage() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    // Simulate payment processing
    await new Promise((resolve) => setTimeout(resolve, 2000));

    setIsProcessing(false);
    setIsComplete(true);
  };

  if (isComplete) {
    return (
      <div className="container py-16">
        <div className="mx-auto max-w-md text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle2 className="h-12 w-12 text-emerald-600" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Payment Complete!</h1>
          <p className="mt-4 text-muted-foreground">
            Thank you for your payment. A receipt has been sent to your email.
          </p>
          <div className="mt-8">
            <Button asChild>
              <Link href={`/report/${mockReport.id}`}>Back to Report</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="mx-auto max-w-2xl">
        {/* Back Link */}
        <Link
          href={`/report/${mockReport.id}`}
          className="mb-6 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          Back to Report
        </Link>

        <div className="grid gap-8 md:grid-cols-5">
          {/* Payment Form */}
          <div className="md:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Pay Balance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      required
                    />
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label htmlFor="cardNumber">Card Number</Label>
                    <Input
                      id="cardNumber"
                      placeholder="4242 4242 4242 4242"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="expiry">Expiration</Label>
                      <Input id="expiry" placeholder="MM / YY" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cvc">CVC</Label>
                      <Input id="cvc" placeholder="123" required />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="name">Name on Card</Label>
                    <Input id="name" placeholder="John Smith" required />
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Lock className="h-4 w-4" />
                    <span>Secured by Stripe. We never store your card details.</span>
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    size="lg"
                    disabled={isProcessing}
                  >
                    {isProcessing
                      ? "Processing..."
                      : `Pay $${mockReport.payment.balance.toFixed(2)}`}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Payment Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Property Info */}
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>
                      {mockReport.inspection.property.street},{" "}
                      {mockReport.inspection.property.city}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>{formatDate(mockReport.inspection.date)}</span>
                  </div>
                </div>

                <Separator />

                {/* Services */}
                <div className="space-y-2">
                  {mockReport.services.map((service, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span>{service.name}</span>
                      <span>${service.price.toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <Separator />

                {/* Totals */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>${mockReport.payment.total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-emerald-600">
                    <span>Deposit paid</span>
                    <span>-${mockReport.payment.depositPaid.toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Balance Due</span>
                    <span>${mockReport.payment.balance.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <p className="mt-4 text-center text-xs text-muted-foreground">
              Payment processed by {mockReport.company.name}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
