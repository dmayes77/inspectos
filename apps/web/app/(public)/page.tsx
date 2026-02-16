import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Camera, FileText, Calendar, Smartphone, Shield, Zap, Users, ArrowRight, Star, Play } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-32 pb-20">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-orange-100/40 via-background to-background" />
        <div className="mx-auto max-w-6xl px-4">
          <div className="mx-auto max-w-3xl text-center">
            <Badge color="light" className="mb-6">
              Trusted by 500+ inspection companies
            </Badge>
            <h1 className="mb-6 text-5xl font-semibold tracking-tight sm:text-6xl">
              Home inspections, <span className="text-primary">simplified</span>
            </h1>
            <p className="mb-8 text-xl text-muted-foreground">
              The all-in-one platform for home inspectors. Schedule, inspect, report, and get paid—all from one beautiful app that works offline.
            </p>
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Button size="md" className="h-12 px-8 text-base" asChild>
                <Link href="/register">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" size="md" className="h-12 px-8 text-base">
                <Play className="mr-2 h-4 w-4" />
                Watch Demo
              </Button>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">No credit card required. 30-day free trial.</p>
          </div>

          {/* Hero Image Placeholder */}
          <div className="mt-16 overflow-hidden rounded-xl border border-border bg-card shadow-xl">
            <div className="aspect-video bg-linear-to-br from-slate-100 to-slate-200 flex items-center justify-center">
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                  <Smartphone className="h-8 w-8 text-primary" />
                </div>
                <p className="text-lg font-medium text-slate-600">App Screenshot</p>
                <p className="text-sm text-slate-500">Inspector mobile app in action</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="border-y border-border bg-muted/30 py-12">
        <div className="mx-auto max-w-6xl px-4">
          <p className="mb-8 text-center text-sm font-medium text-muted-foreground">TRUSTED BY INSPECTORS NATIONWIDE</p>
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {[
              { stat: "10,000+", label: "Inspections completed" },
              { stat: "500+", label: "Inspection companies" },
              { stat: "4.9/5", label: "App Store rating" },
              { stat: "99.9%", label: "Uptime reliability" },
            ].map((item) => (
              <div key={item.label} className="text-center">
                <p className="text-3xl font-semibold tracking-tight">{item.stat}</p>
                <p className="text-sm text-muted-foreground">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <Badge color="light" className="mb-4">
              Features
            </Badge>
            <h2 className="mb-4">Everything you need to run your inspection business</h2>
            <p className="text-lg text-muted-foreground">
              From scheduling to payment collection, InspectOS handles it all so you can focus on what you do best.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Camera,
                title: "4-Tap Photo Workflow",
                description: "Capture, annotate, tag, done. The fastest photo workflow in the industry.",
              },
              {
                icon: Smartphone,
                title: "True Offline Mode",
                description: "Complete full inspections with zero connectivity. Syncs when you're back online.",
              },
              {
                icon: FileText,
                title: "Instant Reports",
                description: "Professional PDF reports generated in seconds. Share with clients before you leave.",
              },
              {
                icon: Calendar,
                title: "Smart Scheduling",
                description: "Online booking, automated reminders, and calendar sync. Never double-book again.",
              },
              {
                icon: Users,
                title: "Multi-Inspector Support",
                description: "Assign team members, track progress in real-time, collaborate seamlessly.",
              },
              {
                icon: Zap,
                title: "Integrated Payments",
                description: "Accept cards on-site or online. Get paid faster with automated invoicing.",
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

      {/* How It Works */}
      <section id="how-it-works" className="bg-muted/30 py-24">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <Badge color="light" className="mb-4">
              How It Works
            </Badge>
            <h2 className="mb-4">From booking to payment in 4 simple steps</h2>
          </div>

          <div className="grid gap-8 md:grid-cols-4">
            {[
              {
                step: "1",
                title: "Client Books",
                description: "Clients schedule online through your custom booking page.",
              },
              {
                step: "2",
                title: "You Inspect",
                description: "Use the mobile app to document findings, take photos, and record notes.",
              },
              {
                step: "3",
                title: "Report Delivered",
                description: "Generate and send professional reports instantly.",
              },
              {
                step: "4",
                title: "Get Paid",
                description: "Accept payment on-site or through automated invoicing.",
              },
            ].map((item, index) => (
              <div key={item.step} className="relative text-center">
                {index < 3 && <div className="absolute left-1/2 top-6 hidden h-px w-full bg-border md:block" />}
                <div className="relative mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-semibold text-primary-foreground">
                  {item.step}
                </div>
                <h4 className="mb-2 font-semibold">{item.title}</h4>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <Badge color="light" className="mb-4">
              Testimonials
            </Badge>
            <h2 className="mb-4">Loved by inspectors everywhere</h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                quote:
                  "InspectOS cut my report time in half. I can complete an inspection and have the report in the client's hands before I leave the property.",
                name: "Mike Richardson",
                role: "Richardson Home Inspections",
                rating: 5,
              },
              {
                quote: "The offline mode is a game-changer. I work in rural areas with spotty cell service, and I never worry about losing my work anymore.",
                name: "Sarah Chen",
                role: "Premier Property Inspections",
                rating: 5,
              },
              {
                quote: "Finally, software designed by people who understand inspections. The photo workflow alone saves me 20 minutes per inspection.",
                name: "James Martinez",
                role: "Martinez Inspection Group",
                rating: 5,
              },
            ].map((testimonial) => (
              <Card key={testimonial.name} className="shadow-card">
                <CardContent className="pt-6">
                  <div className="mb-4 flex gap-1">
                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                    ))}
                  </div>
                  <p className="mb-4 text-muted-foreground">&ldquo;{testimonial.quote}&rdquo;</p>
                  <div>
                    <p className="font-semibold">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section id="pricing" className="bg-muted/30 py-24">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <Badge color="light" className="mb-4">
              Pricing
            </Badge>
            <h2 className="mb-4">Simple, transparent pricing</h2>
            <p className="text-lg text-muted-foreground">30-day free trial on all plans. No hidden fees, cancel anytime.</p>
          </div>

          <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-3">
            {[
              {
                name: "Pro",
                price: "$79",
                annual: "$790/yr",
                description: "For solo inspectors",
                features: ["1 inspector", "Unlimited inspections", "Offline mode", "Custom branding", "Voice notes"],
              },
              {
                name: "Team",
                price: "$159",
                annual: "$1,590/yr",
                description: "For growing teams",
                features: ["5 inspectors included", "+$29/mo per additional", "Team scheduling", "Inspector performance", "Priority support"],
                popular: true,
              },
              {
                name: "Business",
                price: "$279",
                annual: "$2,790/yr",
                description: "For inspection firms",
                features: ["15 inspectors included", "+$25/mo per additional", "API access", "Advanced analytics", "Dedicated success manager"],
              },
            ].map((plan) => (
              <Card key={plan.name} className={`relative shadow-card ${plan.popular ? "border-primary ring-1 ring-primary" : ""}`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge>Most Popular</Badge>
                  </div>
                )}
                <CardContent className="pt-8">
                  <h3 className="mb-1 text-lg font-semibold">{plan.name}</h3>
                  <p className="mb-4 text-sm text-muted-foreground">{plan.description}</p>
                  <p className="mb-1">
                    <span className="text-4xl font-semibold tracking-tight">{plan.price}</span>
                    <span className="text-muted-foreground">/month</span>
                  </p>
                  <p className="mb-6 text-sm text-muted-foreground">or {plan.annual} (save 17%)</p>
                  <ul className="mb-6 space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-primary" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button className="w-full" variant={plan.popular ? "primary" : "outline"}>
                    Start 30-Day Trial
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <p className="mx-auto mt-8 max-w-xl text-center text-sm text-muted-foreground">
            All plans include: PDF reports, client portal, online payments, and 0% platform fees.
            <br />
            Credit card required for trial. Cancel anytime before trial ends.
          </p>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="mx-auto max-w-6xl px-4">
          <div className="overflow-hidden rounded-2xl bg-primary px-8 py-16 text-center text-primary-foreground">
            <h2 className="mb-4 text-3xl font-semibold text-white sm:text-4xl">Ready to modernize your inspection business?</h2>
            <p className="mx-auto mb-8 max-w-xl text-lg text-white/80">
              Join 500+ inspection companies already using InspectOS to save time, impress clients, and grow their business.
            </p>
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Button size="md" variant="secondary" className="h-12 px-8 text-base" asChild>
                <Link href="/register">
                  Start Your Free Trial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="md" variant="ghost" className="h-12 px-8 text-base text-white hover:bg-white/10 hover:text-white">
                Schedule a Demo
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
