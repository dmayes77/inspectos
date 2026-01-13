"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BookingShell } from "@/components/layout/booking-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, Calendar, Clock, CreditCard, Lock } from "lucide-react";

// Mock company data
const mockCompany = {
  name: "Acme Home Inspections",
  slug: "acme-inspections",
  logo: null,
};

// Service lookup
const serviceInfo: Record<string, { name: string; price: number }> = {
  "full-home": { name: "Full Home Inspection", price: 400 },
  "pre-listing": { name: "Pre-Listing Inspection", price: 350 },
  radon: { name: "Radon Testing", price: 150 },
  mold: { name: "Mold Inspection", price: 200 },
  sewer: { name: "Sewer Scope", price: 175 },
};

const STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY",
];

const FOUNDATION_TYPES = [
  "Basement",
  "Crawl Space",
  "Slab",
  "Pier and Beam",
  "Unknown",
];

export default function BookCheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const service = searchParams.get("service") || "";
  const addons = searchParams.get("addons")?.split(",").filter(Boolean) || [];
  const date = searchParams.get("date") || "";
  const time = searchParams.get("time") || "";

  const [isProcessing, setIsProcessing] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    street: "",
    city: "",
    state: "",
    zip: "",
    sqft: "",
    yearBuilt: "",
    foundation: "",
  });

  // Calculate pricing
  const selectedServices = [service, ...addons].filter(Boolean);
  const subtotal = selectedServices.reduce(
    (sum, id) => sum + (serviceInfo[id]?.price || 0),
    0
  );
  const depositAmount = 100;
  const balanceDue = subtotal - depositAmount;

  const formatDate = () => {
    if (!date) return "";
    const d = new Date(date + "T12:00:00");
    return d.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    // Simulate payment processing
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Redirect to confirmed page
    router.push(`/book/${mockCompany.slug}/confirmed?booking=bk_${Date.now()}`);
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <BookingShell companyName={mockCompany.name} currentStep={3}>
      <div className="mx-auto max-w-4xl">
        <form onSubmit={handleSubmit}>
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Main Form */}
            <div className="space-y-6 lg:col-span-2">
              {/* Header */}
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Checkout</h1>
                <p className="mt-2 text-muted-foreground">
                  Complete your booking details
                </p>
              </div>

              {/* Contact Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Your Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      required
                      placeholder="John Smith"
                      value={formData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        required
                        placeholder="john@example.com"
                        value={formData.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        type="tel"
                        required
                        placeholder="(555) 123-4567"
                        value={formData.phone}
                        onChange={(e) => handleInputChange("phone", e.target.value)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Property Address */}
              <Card>
                <CardHeader>
                  <CardTitle>Property Address</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="street">Street Address</Label>
                    <Input
                      id="street"
                      required
                      placeholder="123 Main Street"
                      value={formData.street}
                      onChange={(e) => handleInputChange("street", e.target.value)}
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-6">
                    <div className="space-y-2 sm:col-span-3">
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        required
                        placeholder="Austin"
                        value={formData.city}
                        onChange={(e) => handleInputChange("city", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-1">
                      <Label htmlFor="state">State</Label>
                      <Select
                        value={formData.state}
                        onValueChange={(v) => handleInputChange("state", v)}
                      >
                        <SelectTrigger id="state">
                          <SelectValue placeholder="State" />
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
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="zip">ZIP Code</Label>
                      <Input
                        id="zip"
                        required
                        placeholder="78701"
                        value={formData.zip}
                        onChange={(e) => handleInputChange("zip", e.target.value)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Property Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Property Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="sqft">Square Feet</Label>
                      <Input
                        id="sqft"
                        type="number"
                        placeholder="2,000"
                        value={formData.sqft}
                        onChange={(e) => handleInputChange("sqft", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="yearBuilt">Year Built</Label>
                      <Input
                        id="yearBuilt"
                        type="number"
                        placeholder="1990"
                        value={formData.yearBuilt}
                        onChange={(e) => handleInputChange("yearBuilt", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="foundation">Foundation Type</Label>
                      <Select
                        value={formData.foundation}
                        onValueChange={(v) => handleInputChange("foundation", v)}
                      >
                        <SelectTrigger id="foundation">
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent>
                          {FOUNDATION_TYPES.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payment */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Payment
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="cardNumber">Card Number</Label>
                    <Input
                      id="cardNumber"
                      placeholder="4242 4242 4242 4242"
                      required
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="expiry">Expiration Date</Label>
                      <Input id="expiry" placeholder="MM / YY" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cvc">CVC</Label>
                      <Input id="cvc" placeholder="123" required />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Lock className="h-4 w-4" />
                    <span>Secured by Stripe. We never store your card details.</span>
                  </div>
                </CardContent>
              </Card>

              {/* Back Button (mobile) */}
              <div className="lg:hidden">
                <Button variant="outline" type="button" onClick={handleBack}>
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
              </div>
            </div>

            {/* Order Summary Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Order Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Appointment */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{formatDate()}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>{time}</span>
                      </div>
                    </div>

                    <Separator />

                    {/* Services */}
                    <div className="space-y-2">
                      {selectedServices.map((id) => {
                        const info = serviceInfo[id];
                        if (!info) return null;
                        return (
                          <div key={id} className="flex justify-between text-sm">
                            <span>{info.name}</span>
                            <span>${info.price.toFixed(2)}</span>
                          </div>
                        );
                      })}
                    </div>

                    <Separator />

                    {/* Totals */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Subtotal</span>
                        <span>${subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm font-medium text-primary">
                        <span>Deposit due today</span>
                        <span>${depositAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Balance at inspection</span>
                        <span>${balanceDue.toFixed(2)}</span>
                      </div>
                    </div>

                    <Separator />

                    <Button
                      type="submit"
                      className="w-full"
                      size="lg"
                      disabled={isProcessing}
                    >
                      {isProcessing ? "Processing..." : `Pay $${depositAmount} Deposit`}
                    </Button>

                    <p className="text-center text-xs text-muted-foreground">
                      By completing this booking, you agree to our{" "}
                      <a href="#" className="underline">
                        Terms of Service
                      </a>{" "}
                      and{" "}
                      <a href="#" className="underline">
                        Cancellation Policy
                      </a>
                      .
                    </p>
                  </CardContent>
                </Card>

                {/* Back Button (desktop) */}
                <div className="hidden lg:block">
                  <Button
                    variant="outline"
                    type="button"
                    className="w-full"
                    onClick={handleBack}
                  >
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Back to Schedule
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </BookingShell>
  );
}
