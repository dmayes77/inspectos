import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Brain,
  CheckCircle2,
  Database,
  LockKeyhole,
  ShieldCheck,
  Tags,
  Workflow,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.inspectos.com";

export const metadata: Metadata = {
  title: "InspectOS | Home Inspection Business Software for Owners",
  description:
    "InspectOS helps inspection companies replace fragmented tools with one operating system for margin visibility, cost per inspection, referral value, and owner-level decisions.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "InspectOS | Inspection Business Operating System",
    description:
      "One platform to run your inspection company with connected operations, analytics, and owner decision intelligence.",
    url: siteUrl,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "InspectOS | Inspection Business Operating System",
    description:
      "Replace fragmented inspection workflows with one owner-focused operating system.",
  },
};

const softwareSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "InspectOS",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  description:
    "InspectOS is a home inspection business operating system for owners. It unifies operations, cost inputs, margin analytics, and referral source performance.",
  offers: {
    "@type": "AggregateOffer",
    priceCurrency: "USD",
  },
  url: siteUrl,
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Can InspectOS replace multiple tools?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. InspectOS is designed to replace fragmented scheduling, communication context, analytics, and owner reporting workflows with one operating system.",
      },
    },
    {
      "@type": "Question",
      name: "What problem does InspectOS solve for inspection owners?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "InspectOS solves fragmented decision-making by connecting revenue, labor, travel, overhead, and referral source performance in one view.",
      },
    },
    {
      "@type": "Question",
      name: "Is InspectOS only for report writing?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No. InspectOS is for running the business, not only writing reports. It focuses on owner-level operations and profitability decisions.",
      },
    },
    {
      "@type": "Question",
      name: "How does InspectOS handle customer data?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "InspectOS follows a business-level data sovereignty model where customer relationships remain under your control.",
      },
    },
  ],
};

const hiddenBurden = [
  "You are busy, but still unsure which services truly produce profit.",
  "Your team closes jobs, but owner decisions still depend on spreadsheets.",
  "Referral volume looks strong, but quality and margin are inconsistent.",
  "Reporting exists, but operational truth is scattered across tools.",
];

const fragmentedReality = [
  { title: "Scheduling Tool", problem: "Strong calendar, weak margin context." },
  { title: "Report Tool", problem: "Good narratives, poor owner intelligence." },
  { title: "CRM Add-ons", problem: "Contact history without cost visibility." },
  { title: "Spreadsheet Layer", problem: "Manual, delayed, and inconsistent decisions." },
];

const realWorldScenarios = [
  {
    title: "Revenue up, profit down",
    problem: "Inspections increased, but labor and travel costs rose faster than expected.",
    consequence: "By the time finance catches it, a full month of margin has already leaked.",
    solution: "InspectOS shows cost and margin movement at the order level so you can react immediately.",
  },
  {
    title: "High-volume referral, low-value outcomes",
    problem: "A partner sends many jobs, but those jobs carry lower contribution margin.",
    consequence: "The team chases volume while profitable channels are underinvested.",
    solution: "InspectOS ranks referral sources by profitability, not just job count.",
  },
  {
    title: "Unclear service growth strategy",
    problem: "You need to pick services to scale but only have volume and anecdotal feedback.",
    consequence: "Pricing and promotion decisions become guesswork.",
    solution: "InspectOS compares service lines by margin and cost-to-serve so growth choices are defensible.",
  },
  {
    title: "Operational drag from tool sprawl",
    problem: "Staff re-enters data across systems and reconciles conflicting reports.",
    consequence: "Execution slows down while owners still lack one trusted operating view.",
    solution: "InspectOS creates one operating model so teams execute and owners decide from the same truth.",
  },
];

const solutionPillars = [
  {
    icon: BarChart3,
    title: "Profit Intelligence",
    description: "Margin by service, cost per inspection, and trend visibility in one dashboard.",
  },
  {
    icon: Workflow,
    title: "Order-Centric Model",
    description: "Revenue, labor, travel, overhead, and source data connected at the order level.",
  },
  {
    icon: Brain,
    title: "Decision Support",
    description: "Owner-focused insights that drive pricing, staffing, and growth choices.",
  },
  {
    icon: Database,
    title: "Business API Access",
    description: "Controlled integrations with business-level identity and key management.",
  },
  {
    icon: ShieldCheck,
    title: "Data Sovereignty",
    description: "Your customer relationships stay yours, with business-level isolation.",
  },
  {
    icon: Tags,
    title: "Operational Baseline",
    description: "Automations, exports, reminders, and controls included in one platform.",
  },
];

const ownerDecisions = [
  "Which services should we scale next month based on margin, not just volume?",
  "Which referral channels create profitable growth versus hidden drag?",
  "Where are labor and travel costs compressing margin right now?",
  "What pricing changes should we test this quarter by service type?",
  "What should we stop doing because it no longer produces profit?",
  "Where should leadership focus this week to improve outcomes fastest?",
];

const inspectosInPractice = [
  {
    title: "Owner Intelligence Layer",
    details: [
      "Margin by service line with trend context",
      "Cost per inspection with labor/travel/overhead visibility",
      "Referral source value based on contribution quality",
      "Decision-ready summaries for weekly leadership review",
    ],
  },
  {
    title: "Operational Execution Layer",
    details: [
      "Order-centric workflow connecting field and office context",
      "Standardized data flow across scheduling, communication, and fulfillment",
      "Reduced duplicate entry and manual reconciliation",
      "Clear operating picture for teams and owners",
    ],
  },
  {
    title: "Control + Trust Layer",
    details: [
      "Business-level identity and API connectivity",
      "Permission-aware operating controls",
      "Data sovereignty and business isolation model",
      "Unified platform governance instead of tool sprawl",
    ],
  },
];

const industryProblems = [
  {
    problem: "Tool sprawl is treated as normal operating reality.",
    outcome: "Owners spend time reconciling systems instead of improving the business.",
  },
  {
    problem: "Most platforms optimize inspection speed, not profit quality.",
    outcome: "Revenue rises while true margin remains unclear or erodes silently.",
  },
  {
    problem: "Critical decisions depend on delayed spreadsheet workflows.",
    outcome: "Pricing, hiring, and service-mix decisions happen too late.",
  },
  {
    problem: "Data trust has been weakened across the market.",
    outcome: "Owners worry about who truly controls client relationships.",
  },
];

const whyInspectosUnderstands = [
  "Led by real operator experience from within the inspection ecosystem, not outside speculation.",
  "Informed by years of leadership experience in the space and direct exposure to day-to-day owner pain points.",
  "Validated through live conference-floor observation, vendor analysis, and practitioner conversations.",
  "Architected around orders as the business spine connecting revenue, cost, referral quality, and outcomes.",
  "Designed to solve multi-problem operational reality in one system instead of adding another point tool.",
];

const faqItems = [
  {
    q: "Can InspectOS replace multiple tools we currently use?",
    a: "Yes. That is the core strategy: one operating system instead of fragmented apps and spreadsheet reconciliation.",
  },
  {
    q: "How does InspectOS help owners who are used to the old way?",
    a: "It surfaces the hidden burden first: margin leaks, low-value referrals, and delayed decisions. Then it provides one place to act.",
  },
  {
    q: "Is InspectOS only for writing reports faster?",
    a: "No. InspectOS is built to run the business with connected operational and financial signals.",
  },
  {
    q: "What about customer data trust?",
    a: "InspectOS follows a data sovereignty approach where your client relationships are not sold or brokered.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      <section className="relative overflow-hidden pt-32 pb-20">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-brand-100/40 via-background to-background" />
        <div className="mx-auto max-w-6xl px-4">
          <div className="mx-auto max-w-4xl text-center">
            <Badge color="light" className="mb-6">One Operating System</Badge>
            <h1 className="mb-6 text-5xl font-semibold tracking-tight sm:text-6xl">
              If your business runs on fragmented tools, you are carrying hidden cost.
            </h1>
            <p className="mx-auto mb-8 max-w-3xl text-xl text-muted-foreground">
              InspectOS helps inspection companies see the burden they have normalized, then replace it with one platform
              for operational truth, profit decisions, and scalable growth.
            </p>
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Button size="md" className="h-12 px-8 text-base" asChild>
                <Link href="/register">
                  Book a Demo
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" size="md" className="h-12 px-8 text-base" asChild>
                <Link href="/pricing">See Pricing</Link>
              </Button>
            </div>
          </div>

          <div className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {hiddenBurden.map((item) => (
              <Card key={item}>
                <CardContent className="flex items-start gap-2 p-5">
                  <XCircle className="mt-0.5 h-4 w-4 text-destructive" />
                  <p className="text-sm text-muted-foreground">{item}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-muted/20 py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mx-auto mb-10 max-w-3xl text-center">
            <Badge color="light" className="mb-4">The Real Problem</Badge>
            <h2 className="mb-4">Most inspection software solves tasks. Owners need decisions.</h2>
            <p className="text-lg text-muted-foreground">
              Many teams have been operating this way so long that fragmentation feels normal. It is not. It is expensive,
              slow, and strategically dangerous.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {fragmentedReality.map((item) => (
              <Card key={item.title}>
                <CardContent className="p-5">
                  <h3 className="text-base font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{item.problem}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mx-auto mt-10 max-w-4xl rounded-sm border bg-card p-6 text-center">
            <p className="text-sm text-muted-foreground">
              InspectOS is not another add-on. It is the platform that replaces the fragmented operating model.
              One system for execution context and owner-level decisions.
            </p>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mx-auto mb-12 max-w-3xl text-center">
            <Badge color="light" className="mb-4">Real-World Examples</Badge>
            <h2 className="mb-4">The frustration is real. The solution is specific.</h2>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {realWorldScenarios.map((item) => (
              <Card key={item.title}>
                <CardContent className="space-y-4 p-6">
                  <h3 className="text-lg font-semibold">{item.title}</h3>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">What happens now</p>
                    <p className="mt-1 text-sm text-muted-foreground">{item.problem}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Why it hurts</p>
                    <p className="mt-1 text-sm text-muted-foreground">{item.consequence}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-primary">How InspectOS fixes it</p>
                    <p className="mt-1 text-sm text-muted-foreground">{item.solution}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-10 text-center">
            <Button asChild>
              <Link href="/register">
                Walk Through My Scenario
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section id="features" className="border-y border-border bg-muted/20 py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mx-auto mb-12 max-w-3xl text-center">
            <Badge color="light" className="mb-4">Why InspectOS Is The Solution</Badge>
            <h2 className="mb-4">One data model. One owner dashboard. One place to decide.</h2>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {solutionPillars.map((feature) => (
              <Card key={feature.title} className="shadow-card transition-apple hover:shadow-card-hover">
                <CardContent className="pt-6">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-sm bg-primary/10">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mx-auto mb-12 max-w-3xl text-center">
            <Badge color="light" className="mb-4">Owner Decision Hub</Badge>
            <h2 className="mb-4">What you can decide faster when operations are unified</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {ownerDecisions.map((item) => (
              <Card key={item}>
                <CardContent className="p-5">
                  <p className="text-sm text-muted-foreground">{item}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button asChild>
              <Link href="/register">
                See The Decision Hub
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/pricing">Compare Plans</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-muted/20 py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mx-auto mb-12 max-w-3xl text-center">
            <Badge color="light" className="mb-4">What InspectOS Includes</Badge>
            <h2 className="mb-4">Detailed capabilities that solve the actual business problem.</h2>
            <p className="text-lg text-muted-foreground">
              InspectOS is not one feature. It is a full operating system built to replace fragmentation and give owners
              one place to run the company with confidence.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {inspectosInPractice.map((pillar) => (
              <Card key={pillar.title}>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold">{pillar.title}</h3>
                  <div className="mt-4 space-y-2">
                    {pillar.details.map((detail) => (
                      <div key={detail} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
                        <span>{detail}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mx-auto mb-12 max-w-3xl text-center">
            <Badge color="light" className="mb-4">Fragmented Industry Reality</Badge>
            <h2 className="mb-4">The industry is fragmented by default. That is the core problem.</h2>
            <p className="text-lg text-muted-foreground">
              When businesses are forced into disconnected systems, leaders get activity data but miss operational truth.
              InspectOS exists to remove that structural burden.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {industryProblems.map((item) => (
              <Card key={item.problem}>
                <CardContent className="p-6">
                  <p className="text-sm font-semibold">{item.problem}</p>
                  <p className="mt-2 text-sm text-muted-foreground">{item.outcome}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-muted/20 py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mx-auto mb-12 max-w-3xl text-center">
            <Badge color="light" className="mb-4">Why We Understand This Market</Badge>
            <h2 className="mb-4">Built from direct industry signal, not assumptions.</h2>
            <p className="text-lg text-muted-foreground">
              InspectOS direction is grounded in operator-level experience and leadership from inside the industry,
              then validated through active market research and translated into a platform that solves multiple business problems in one place.
            </p>
          </div>

          <Card className="mx-auto max-w-4xl border-primary/20">
            <CardContent className="p-6">
              <div className="space-y-3">
                {whyInspectosUnderstands.map((item) => (
                  <div key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="mx-auto mt-6 max-w-4xl">
            <CardContent className="p-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Operator Perspective</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Our field leadership perspective reinforces a core truth: inspection companies are not struggling because
                they lack effort, they are struggling because their operating stack is fragmented. We are invested in
                improving how the industry operates, and InspectOS is built to remove that burden with one system for
                execution and owner decisions.
              </p>
            </CardContent>
          </Card>

          <div className="mt-10 text-center">
            <Button asChild>
              <Link href="/register">
                See How InspectOS Solves Your Workflow
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="bg-muted/20 py-20">
        <div className="mx-auto max-w-6xl px-4">
          <Card className="border-primary/20">
            <CardContent className="flex flex-col items-start gap-4 p-8 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-primary">
                  <LockKeyhole className="h-4 w-4" />
                  Data Sovereignty
                </p>
                <h3 className="text-2xl font-semibold tracking-tight">Your clients belong to you.</h3>
                <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                  InspectOS enforces business-level isolation and does not sell, market, or broker customer relationships.
                </p>
              </div>
              <Button variant="outline" asChild>
                <Link href="/data-charter">Read Data Charter</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mx-auto mb-10 max-w-3xl text-center">
            <Badge color="light" className="mb-4">FAQ</Badge>
            <h2 className="mb-4">Questions owners ask before consolidating tools</h2>
          </div>
          <div className="mx-auto grid max-w-5xl gap-4 md:grid-cols-2">
            {faqItems.map((item) => (
              <Card key={item.q}>
                <CardContent className="p-6">
                  <h3 className="text-base font-semibold">{item.q}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{item.a}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24">
        <div className="mx-auto max-w-6xl px-4">
          <div className="overflow-hidden rounded-sm bg-primary px-8 py-16 text-center text-primary-foreground">
            <h2 className="mb-4 text-3xl font-semibold text-white sm:text-4xl">
              If you are not solving fragmentation, fragmentation keeps solving you.
            </h2>
            <p className="mx-auto mb-8 max-w-3xl text-lg text-white/85">
              InspectOS helps inspection companies see the real burden, fix it, and run the business from one system.
            </p>
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Button size="md" variant="secondary" className="h-12 px-8 text-base" asChild>
                <Link href="/register">
                  Book Your Demo
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="md" variant="ghost" className="h-12 px-8 text-base text-white hover:bg-white/10 hover:text-white" asChild>
                <Link href="/pricing">See Pricing</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
