import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Check,
  BarChart3,
  Brain,
  Calendar,
  Shield,
} from "lucide-react";

const plans = [
  {
    name: "Growth",
    description: "For owner-led companies",
    monthlyPrice: 499,
    inspectors: "Up to 5 inspectors",
    includedInspectors: "First inspector included",
    additionalSeat: 99,
    seatCapNote: "Additional seats up to 5 total",
    popular: false,
    features: [
      "Unlimited inspections and reports",
      "Order-centric operations dashboard",
      "Baseline automations + reminders",
      "Business ID + API key access",
      "Core performance analytics",
      "Priority email support",
    ],
  },
  {
    name: "Team",
    description: "For scaling operations",
    monthlyPrice: 799,
    inspectors: "Up to 15 inspectors",
    includedInspectors: "First 5 inspectors included",
    additionalSeat: 79,
    seatCapNote: "Additional seats up to 15 total",
    popular: true,
    features: [
      "Everything in Growth",
      "Advanced team management and controls",
      "Expanded workflow automations",
      "Service line performance analytics",
      "Referral and channel performance views",
      "Priority implementation support",
    ],
  },
  {
    name: "Firm",
    description: "For multi-team and multi-office firms",
    monthlyPrice: null,
    inspectors: "Custom inspector capacity",
    includedInspectors: "Pricing requires consultation",
    additionalSeat: null,
    seatCapNote: "Business audit required for scoped proposal",
    popular: false,
    features: [
      "Everything in Team",
      "Custom implementation and onboarding",
      "Business audit + operating model review",
      "Advanced analytics and advisory cadence",
      "Dedicated success and solutions lead",
      "Custom integration planning",
    ],
  },
];

const highlights = [
  {
    icon: BarChart3,
    title: "Profit Intelligence",
    description: "Move from revenue snapshots to margin-aware operating decisions.",
  },
  {
    icon: Brain,
    title: "Decision Engine",
    description: "Understand service performance, pricing leverage, and cost-to-serve.",
  },
  {
    icon: Calendar,
    title: "Implementation-Led",
    description: "Every account is onboarded against your operating model, not generic templates.",
  },
  {
    icon: Shield,
    title: "Data Sovereignty",
    description: "Business-level isolation and ownership-first architecture by design.",
  },
];

const faqs = [
  {
    question: "Can I move between Growth and Team?",
    answer: "Yes. We can upgrade or downgrade as your inspector count changes, with prorated billing on plan transitions.",
  },
  {
    question: "How are inspector seats counted?",
    answer: "Growth supports up to 5 inspectors (first included). Team supports up to 15 inspectors (first 5 included).",
  },
  {
    question: "Why is Firm pricing custom?",
    answer: "Firm plans include a consultation and business audit so pricing matches process complexity, team structure, and integration scope.",
  },
  {
    question: "Do you offer annual pricing?",
    answer: "Not at this time. Plans are billed monthly.",
  },
  {
    question: "Is this a report writer replacement play?",
    answer: "No. InspectOS is positioned as inspection business infrastructure focused on operational truth and owner decision support.",
  },
  {
    question: "Can we bring our own workflows and data?",
    answer: "Yes. Team and Firm onboarding includes migration planning and operating model alignment.",
  },
];

export default function PricingPage() {
  return (
    <>
      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 pt-32 pb-16 text-center">
        <Badge className="mb-4">Premium Pricing</Badge>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Pricing aligned to business impact
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
          InspectOS is built for owner-level decisions, not commodity reporting features.
          Choose the tier that matches your team size and operating complexity.
        </p>
      </section>

      {/* Pricing Cards */}
      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-3">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`relative ${
                plan.popular ? "border-2 border-primary shadow-lg" : ""
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge variant="solid" color="primary" className="px-3 py-1">Most Popular</Badge>
                </div>
              )}
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Price */}
                <div className="text-center">
                  {plan.monthlyPrice ? (
                    <>
                      <div className="flex items-baseline justify-center gap-1">
                        <span className="text-4xl font-bold">${plan.monthlyPrice}</span>
                        <span className="text-muted-foreground">/month</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="text-4xl font-bold tracking-tight">Custom</div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Consultation + business audit required
                      </p>
                    </>
                  )}
                </div>

                {/* Inspectors */}
                <div className="rounded-sm bg-muted/50 p-3 text-center">
                  <p className="font-medium">{plan.inspectors}</p>
                  <p className="text-sm text-muted-foreground">{plan.includedInspectors}</p>
                  {plan.additionalSeat && (
                    <p className="text-sm text-muted-foreground">
                      +${plan.additionalSeat}/mo per additional
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">{plan.seatCapNote}</p>
                </div>

                {/* CTA */}
                <Button
                  className="w-full"
                  variant={plan.popular ? "primary" : "outline"}
                  size="md"
                  asChild
                >
                  <Link href={plan.name === "Firm" ? "/register?intent=consultation" : "/register"}>
                    {plan.name === "Firm" ? "Schedule Consultation" : "Book Demo"}
                  </Link>
                </Button>

                {/* Features */}
                <div className="space-y-3">
                  {plan.features.map((feature) => (
                    <div key={feature} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-emerald-500" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Highlights */}
      <section className="border-y bg-muted/30 py-16">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid gap-8 md:grid-cols-4">
            {highlights.map((highlight) => {
              const Icon = highlight.icon;
              return (
                <div key={highlight.title} className="text-center">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-sm bg-primary/10">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold">{highlight.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {highlight.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Profit Impact */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold tracking-tight">
            Profit impact at a glance
          </h2>
          <p className="mt-4 text-muted-foreground">
            InspectOS is priced for outcome. Teams adopt it to improve margin decisions and operating clarity.
          </p>
        </div>

        <div className="mx-auto mt-12 grid max-w-4xl gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="p-6">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Service Margin Visibility</p>
              <p className="mt-2 text-3xl font-bold tracking-tight">100%</p>
              <p className="mt-2 text-sm text-muted-foreground">See profitable vs. unprofitable service lines in one operating view.</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Pricing Decision Cycle</p>
              <p className="mt-2 text-3xl font-bold tracking-tight">&lt; 1 day</p>
              <p className="mt-2 text-sm text-muted-foreground">Move from guesswork to same-day pricing decisions backed by order data.</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Tool Consolidation</p>
              <p className="mt-2 text-3xl font-bold tracking-tight">3+</p>
              <p className="mt-2 text-sm text-muted-foreground">Replace fragmented workflows with one operating system for inspection teams.</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t bg-muted/30 py-16">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-center text-3xl font-bold tracking-tight">
              Frequently Asked Questions
            </h2>

            <div className="mt-12 space-y-6">
              {faqs.map((faq, index) => (
                <Card key={index}>
                  <CardContent className="p-6">
                    <h3 className="font-semibold">{faq.question}</h3>
                    <p className="mt-2 text-muted-foreground">{faq.answer}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 py-16 text-center">
        <h2 className="text-3xl font-bold tracking-tight">
          Ready to run your company on operational truth?
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
          Start with a consultation to align plan, capacity, and implementation path.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Button size="md" asChild>
            <Link href="/register?intent=consultation">Schedule Consultation</Link>
          </Button>
          <Button size="md" variant="outline" asChild>
            <Link href="/register">Book Demo</Link>
          </Button>
        </div>
      </section>
    </>
  );
}
