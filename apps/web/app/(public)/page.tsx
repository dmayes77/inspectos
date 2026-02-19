import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, BarChart3, Brain, Database, LockKeyhole, MailCheck, ShieldCheck, Workflow, FileDown, Tags, MessageSquareText } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-32 pb-20">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-brand-100/40 via-background to-background" />
        <div className="mx-auto max-w-6xl px-4">
          <div className="mx-auto max-w-3xl text-center">
            <Badge color="light" className="mb-6">
              Profit Over Productivity
            </Badge>
            <h1 className="mb-6 text-5xl font-semibold tracking-tight sm:text-6xl">
              Run your inspection company on <span className="text-primary">operational truth</span>
            </h1>
            <p className="mb-8 text-xl text-muted-foreground">
              InspectOS is the operating system for inspection businesses. Existing tools help complete inspections.
              InspectOS helps owners decide what to price, what to cut, and where profit really comes from.
            </p>
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Button size="md" className="h-12 px-8 text-base" asChild>
                <Link href="/register">
                  Book a Demo
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" size="md" className="h-12 px-8 text-base" asChild>
                <Link href="/pricing">
                  See Pricing
                </Link>
              </Button>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">Category: Inspection Business Operating System</p>
          </div>

          {/* Hero Visual */}
          <div className="mt-16 overflow-hidden rounded-xl border border-border bg-card shadow-xl">
            <div className="grid gap-6 p-6 md:grid-cols-3">
              {[
                { label: "Revenue", value: "$126,400", sub: "last 30 days" },
                { label: "Gross Margin", value: "38.2%", sub: "+4.1% vs prior period" },
                { label: "Top Service by Profit", value: "Pre-Listing", sub: "$312 avg margin / order" },
              ].map((kpi) => (
                <div key={kpi.label} className="rounded-lg border bg-muted/30 p-4 text-left">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{kpi.label}</p>
                  <p className="mt-2 text-2xl font-semibold tracking-tight">{kpi.value}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{kpi.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Category Clarification */}
      <section className="border-y border-border bg-muted/20 py-14">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mx-auto max-w-4xl text-center">
            <Badge color="light" className="mb-4">Built for Owners</Badge>
            <h2 className="mb-4">Built for the owner at the desk, not just the inspector in the field.</h2>
            <p className="text-lg text-muted-foreground">
              Most software optimizes one inspection at a time. InspectOS optimizes the company.
              Existing platforms help complete jobs. InspectOS helps make better decisions.
            </p>
          </div>
        </div>
      </section>

      {/* Fragmentation Problem */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mx-auto mb-12 max-w-3xl text-center">
            <Badge color="light" className="mb-4">The Problem</Badge>
            <h2 className="mb-4">The inspection tech stack is fragmented by default.</h2>
            <p className="text-lg text-muted-foreground">
              One tool for scheduling, another for reports, another for communication, and spreadsheets for profitability.
              You don&apos;t need more tools. You need one source of operational truth.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-5">
            {[
              { icon: Workflow, label: "Scheduling" },
              { icon: MessageSquareText, label: "Reporting" },
              { icon: MailCheck, label: "Comms & Reviews" },
              { icon: FileDown, label: "Exports" },
              { icon: BarChart3, label: "Profit Analytics" },
            ].map((item) => (
              <div key={item.label} className="rounded-lg border p-5 text-center">
                <item.icon className="mx-auto mb-3 h-6 w-6 text-primary" />
                <p className="text-sm font-medium">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Value Pillars */}
      <section id="features" className="bg-muted/20 py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <Badge color="light" className="mb-4">Why InspectOS</Badge>
            <h2 className="mb-4">A decision engine, not a reporting engine.</h2>
            <p className="text-lg text-muted-foreground">
              Revenue dashboards are common. Decision systems are not.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: BarChart3,
                title: "Profit Intelligence",
                description: "See service margin, cost per inspection, and referral value in one owner dashboard.",
              },
              {
                icon: Workflow,
                title: "Order-Centric Operations",
                description: "Orders connect labor, service mix, marketing source, payment, and outcomes.",
              },
              {
                icon: Brain,
                title: "Embedded AI Assist",
                description: "Generate report language and client explanations inside workflow with inspector approval.",
              },
              {
                icon: ShieldCheck,
                title: "Data Sovereignty",
                description: "Your client relationships belong to you. InspectOS does not sell or broker your data.",
              },
              {
                icon: Database,
                title: "Business API Access",
                description: "Connect your stack using Business ID and generated API keys under your control.",
              },
              {
                icon: Tags,
                title: "Baseline Parity Included",
                description: "Automations, tagging, reminders, tracking, and exports are built-in, not bolt-ons.",
              },
            ].map((feature) => (
              <Card key={feature.title} className="shadow-card transition-apple hover:shadow-card-hover">
                <CardContent className="pt-6">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
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

      {/* Comparison */}
      <section id="how-it-works" className="py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mx-auto mb-10 max-w-3xl text-center">
            <Badge color="light" className="mb-4">What&apos;s Different</Badge>
            <h2 className="mb-4">Speed tools get replaced. Decision systems get adopted.</h2>
          </div>

          <div className="overflow-hidden rounded-xl border">
            {[
              {
                left: "Report speed",
                right: "Everyone claims it",
              },
              {
                left: "Scheduling",
                right: "Everyone has it",
              },
              {
                left: "Profit intelligence",
                right: "Where InspectOS leads",
              },
              {
                left: "Owner decision support",
                right: "Core product layer",
              },
            ].map((row) => (
              <div key={row.left} className="grid grid-cols-2 border-b px-5 py-4 last:border-b-0">
                <p className="text-sm font-medium">{row.left}</p>
                <p className="text-sm text-muted-foreground">{row.right}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Data Charter */}
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
                  InspectOS will never sell, market, or broker your customer relationships. Data isolation is enforced at the business level.
                </p>
              </div>
              <Button variant="outline" asChild>
                <Link href="/data-charter">
                  Read Data Charter
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Admission Features */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mx-auto mb-12 max-w-3xl text-center">
            <Badge color="light" className="mb-4">Market Baseline</Badge>
            <h2 className="mb-4">We match what teams expect, then go further.</h2>
            <p className="text-muted-foreground">These are admission features, not our differentiator.</p>
          </div>

          <div className="grid gap-4 md:grid-cols-5">
            {[
              "Email open tracking",
              "Automation triggers",
              "CSV export",
              "Agent tagging",
              "SMS reminders",
            ].map((testimonial) => (
              <Card key={testimonial}>
                <CardContent className="flex items-center gap-2 p-4">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                  <p className="text-sm">{testimonial}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="mx-auto max-w-6xl px-4">
          <div className="overflow-hidden rounded-2xl bg-primary px-8 py-16 text-center text-primary-foreground">
            <h2 className="mb-4 text-3xl font-semibold text-white sm:text-4xl">Stop managing tools. Start managing the business.</h2>
            <p className="mx-auto mb-8 max-w-xl text-lg text-white/80">
              InspectOS gives owners one system to run operations, protect data, and improve margin.
            </p>
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Button size="md" variant="secondary" className="h-12 px-8 text-base" asChild>
                <Link href="/register">
                  Book a Demo
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="md" variant="ghost" className="h-12 px-8 text-base text-white hover:bg-white/10 hover:text-white" asChild>
                <Link href="/pricing">
                  See Pricing
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
