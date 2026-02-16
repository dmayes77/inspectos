import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Check,
  X,
  Smartphone,
  FileText,
  Calendar,
  Shield,
} from "lucide-react";

const plans = [
  {
    name: "Pro",
    description: "For solo inspectors",
    monthlyPrice: 79,
    annualPrice: 790,
    inspectors: "1 inspector",
    popular: false,
    features: [
      { name: "Unlimited inspections", included: true },
      { name: "Offline mode", included: true },
      { name: "Photo capture & annotation", included: true },
      { name: "PDF reports", included: true },
      { name: "Client booking portal", included: true },
      { name: "Payment collection", included: true },
      { name: "Custom branding", included: true },
      { name: "3 report templates", included: true },
      { name: "Voice notes", included: true },
      { name: "Basic analytics", included: true },
      { name: "Email support", included: true },
      { name: "Team management", included: false },
      { name: "Inspector scheduling", included: false },
      { name: "API access", included: false },
    ],
  },
  {
    name: "Team",
    description: "For growing teams",
    monthlyPrice: 159,
    annualPrice: 1590,
    inspectors: "5 inspectors included",
    additionalSeat: 29,
    popular: true,
    features: [
      { name: "Unlimited inspections", included: true },
      { name: "Offline mode", included: true },
      { name: "Photo capture & annotation", included: true },
      { name: "PDF reports", included: true },
      { name: "Client booking portal", included: true },
      { name: "Payment collection", included: true },
      { name: "Custom branding", included: true },
      { name: "Unlimited report templates", included: true },
      { name: "Voice notes", included: true },
      { name: "Basic analytics", included: true },
      { name: "Priority support", included: true },
      { name: "Team management", included: true },
      { name: "Inspector scheduling", included: true },
      { name: "API access", included: false },
    ],
  },
  {
    name: "Business",
    description: "For inspection firms",
    monthlyPrice: 279,
    annualPrice: 2790,
    inspectors: "15 inspectors included",
    additionalSeat: 25,
    popular: false,
    features: [
      { name: "Unlimited inspections", included: true },
      { name: "Offline mode", included: true },
      { name: "Photo capture & annotation", included: true },
      { name: "PDF reports", included: true },
      { name: "Client booking portal", included: true },
      { name: "Payment collection", included: true },
      { name: "Custom branding", included: true },
      { name: "Unlimited report templates", included: true },
      { name: "Voice notes", included: true },
      { name: "Advanced analytics", included: true },
      { name: "Phone support + CSM", included: true },
      { name: "Team management", included: true },
      { name: "Inspector scheduling", included: true },
      { name: "API access", included: true },
    ],
  },
];

const highlights = [
  {
    icon: Smartphone,
    title: "Offline-First",
    description: "Complete inspections without internet. Syncs when you're back online.",
  },
  {
    icon: FileText,
    title: "Unlimited Reports",
    description: "Generate as many PDF reports as you need. No per-report fees.",
  },
  {
    icon: Calendar,
    title: "30-Day Trial",
    description: "Try any plan free for 30 days. Cancel anytime.",
  },
  {
    icon: Shield,
    title: "0% Platform Fee",
    description: "Keep all your inspection revenue. Only pay Stripe's processing fees.",
  },
];

const faqs = [
  {
    question: "Can I switch plans anytime?",
    answer: "Yes. Upgrades are immediate and prorated. Downgrades take effect at the next billing cycle.",
  },
  {
    question: "Do you charge per report?",
    answer: "No. All paid plans include unlimited reports. Generate as many as you need.",
  },
  {
    question: "Is there a contract?",
    answer: "No long-term contracts. Monthly plans can be canceled anytime. Annual plans are paid upfront with 2 months free.",
  },
  {
    question: "Can I add inspectors mid-cycle?",
    answer: "Yes. Additional seats are prorated for the remainder of your billing period.",
  },
  {
    question: "Do you take a cut of my inspection fees?",
    answer: "No. We charge 0% platform fee. You only pay Stripe's standard processing fees (2.9% + $0.30 per transaction).",
  },
  {
    question: "What happens after the trial?",
    answer: "Your subscription will automatically start after 30 days. You can cancel anytime before then with no charge.",
  },
];

export default function PricingPage() {
  return (
    <>
      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 pt-32 pb-16 text-center">
        <Badge className="mb-4">Simple, transparent pricing</Badge>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Choose your plan
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
          Start with a 30-day free trial on any plan. No hidden fees, no per-report charges.
          Just straightforward pricing that scales with your business.
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
                  <Badge className="bg-primary px-3 py-1">Most Popular</Badge>
                </div>
              )}
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Price */}
                <div className="text-center">
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-bold">${plan.monthlyPrice}</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    or ${plan.annualPrice}/year (save ~17%)
                  </p>
                </div>

                {/* Inspectors */}
                <div className="rounded-lg bg-muted/50 p-3 text-center">
                  <p className="font-medium">{plan.inspectors}</p>
                  {plan.additionalSeat && (
                    <p className="text-sm text-muted-foreground">
                      +${plan.additionalSeat}/mo per additional
                    </p>
                  )}
                </div>

                {/* CTA */}
                <Button
                  className="w-full"
                  variant={plan.popular ? "primary" : "outline"}
                  size="md"
                  asChild
                >
                  <Link href="/register">Start Free Trial</Link>
                </Button>

                {/* Features */}
                <div className="space-y-3">
                  {plan.features.map((feature) => (
                    <div key={feature.name} className="flex items-center gap-2">
                      {feature.included ? (
                        <Check className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <X className="h-4 w-4 text-muted-foreground/50" />
                      )}
                      <span
                        className={
                          feature.included ? "" : "text-muted-foreground/50"
                        }
                      >
                        {feature.name}
                      </span>
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
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
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

      {/* Comparison */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold tracking-tight">
            Save thousands compared to competitors
          </h2>
          <p className="mt-4 text-muted-foreground">
            InspectOS is designed to scale with your business without breaking the bank.
          </p>
        </div>

        <div className="mx-auto mt-12 max-w-3xl overflow-hidden rounded-lg border">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-6 py-4 text-left font-medium">Company Size</th>
                <th className="px-6 py-4 text-left font-medium">InspectOS</th>
                <th className="px-6 py-4 text-left font-medium">Competitor</th>
                <th className="px-6 py-4 text-left font-medium text-emerald-600">
                  Annual Savings
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              <tr>
                <td className="px-6 py-4">Solo (1 inspector)</td>
                <td className="px-6 py-4 font-medium">$79/mo</td>
                <td className="px-6 py-4 text-muted-foreground">$99/mo</td>
                <td className="px-6 py-4 font-semibold text-emerald-600">$240/yr</td>
              </tr>
              <tr>
                <td className="px-6 py-4">Small (3 inspectors)</td>
                <td className="px-6 py-4 font-medium">$217/mo</td>
                <td className="px-6 py-4 text-muted-foreground">$277/mo</td>
                <td className="px-6 py-4 font-semibold text-emerald-600">$720/yr</td>
              </tr>
              <tr>
                <td className="px-6 py-4">Medium (5 inspectors)</td>
                <td className="px-6 py-4 font-medium">$159/mo</td>
                <td className="px-6 py-4 text-muted-foreground">$455/mo</td>
                <td className="px-6 py-4 font-semibold text-emerald-600">$3,552/yr</td>
              </tr>
              <tr>
                <td className="px-6 py-4">Large (10 inspectors)</td>
                <td className="px-6 py-4 font-medium">$304/mo</td>
                <td className="px-6 py-4 text-muted-foreground">$900/mo</td>
                <td className="px-6 py-4 font-semibold text-emerald-600">$7,152/yr</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          * Based on public pricing from Spectora. InspectOS Team tier includes 5 inspectors.
        </p>
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
          Ready to modernize your inspections?
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
          Start your 30-day free trial today. No credit card required to explore,
          but you&apos;ll need one to activate your trial.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Button size="md" asChild>
            <Link href="/register">Start Free Trial</Link>
          </Button>
          <Button size="md" variant="outline" asChild>
            <Link href="/contact">Contact Sales</Link>
          </Button>
        </div>
      </section>
    </>
  );
}
