import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertTriangle, Camera, ClipboardCheck, Home, Users } from "lucide-react";

export default function DesignSystemPreview() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Home className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-xl font-semibold tracking-tight">InspectOS</span>
          </div>
          <nav className="flex items-center gap-4">
            <Button variant="ghost" size="sm">Dashboard</Button>
            <Button variant="ghost" size="sm">Inspections</Button>
            <Button size="sm">New Inspection</Button>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-12">
        {/* Hero Section */}
        <section className="mb-16 text-center">
          <Badge className="mb-4" variant="secondary">Design System Preview</Badge>
          <h1 className="mb-4">InspectOS Design System</h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Apple-inspired refinement with a Slate + Orange palette.
            Built for clarity in the field and elegance in the office.
          </p>
        </section>

        {/* Color Palette */}
        <section className="mb-16">
          <h2 className="mb-6">Color Palette</h2>

          <div className="mb-8">
            <h4 className="mb-4 text-muted-foreground">Orange (Primary / Actions)</h4>
            <div className="grid grid-cols-5 gap-2 sm:grid-cols-11">
              {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map((shade) => (
                <div key={shade} className="text-center">
                  <div
                    className="mb-2 h-12 rounded-lg shadow-card"
                    style={{ background: `var(--orange-${shade})` }}
                  />
                  <span className="text-xs text-muted-foreground">{shade}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="mb-4 text-muted-foreground">Slate (Neutral / Text)</h4>
            <div className="grid grid-cols-5 gap-2 sm:grid-cols-11">
              {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map((shade) => (
                <div key={shade} className="text-center">
                  <div
                    className="mb-2 h-12 rounded-lg shadow-card"
                    style={{ background: `var(--slate-${shade})` }}
                  />
                  <span className="text-xs text-muted-foreground">{shade}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Semantic Colors */}
        <section className="mb-16">
          <h2 className="mb-6">Semantic Colors</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="flex items-center gap-3 pt-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary">
                  <CheckCircle className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <p className="font-medium">Primary</p>
                  <p className="text-sm text-muted-foreground">Actions, CTAs</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 pt-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-full" style={{ background: 'var(--success)' }}>
                  <CheckCircle className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-medium">Success</p>
                  <p className="text-sm text-muted-foreground">Completed, Passed</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 pt-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-full" style={{ background: 'var(--warning)' }}>
                  <AlertTriangle className="h-5 w-5 text-slate-900" />
                </div>
                <div>
                  <p className="font-medium">Warning</p>
                  <p className="text-sm text-muted-foreground">Attention needed</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 pt-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive">
                  <AlertTriangle className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-medium">Destructive</p>
                  <p className="text-sm text-muted-foreground">Errors, Hazards</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Typography */}
        <section className="mb-16">
          <h2 className="mb-6">Typography</h2>
          <Card>
            <CardContent className="space-y-6 pt-6">
              <div>
                <h1>Heading 1 - Page titles</h1>
                <p className="text-sm text-muted-foreground">text-4xl, font-semibold, tracking-tight</p>
              </div>
              <div>
                <h2>Heading 2 - Section titles</h2>
                <p className="text-sm text-muted-foreground">text-3xl, font-semibold, tracking-tight</p>
              </div>
              <div>
                <h3>Heading 3 - Card titles</h3>
                <p className="text-sm text-muted-foreground">text-2xl, font-semibold, tracking-tight</p>
              </div>
              <div>
                <h4>Heading 4 - Subsections</h4>
                <p className="text-sm text-muted-foreground">text-xl, font-semibold</p>
              </div>
              <div>
                <p>Body text - Used for paragraphs and general content. The quick brown fox jumps over the lazy dog.</p>
                <p className="text-sm text-muted-foreground">text-base, leading-relaxed</p>
              </div>
              <div>
                <small>Small text - Used for captions, labels, and metadata</small>
                <p className="text-sm text-muted-foreground">text-sm, text-muted-foreground</p>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Buttons */}
        <section className="mb-16">
          <h2 className="mb-6">Buttons</h2>
          <Card>
            <CardContent className="pt-6">
              <div className="mb-6">
                <h4 className="mb-4 text-muted-foreground">Standard Buttons</h4>
                <div className="flex flex-wrap items-center gap-4">
                  <Button>Primary</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="outline">Outline</Button>
                  <Button variant="ghost">Ghost</Button>
                  <Button variant="destructive">Destructive</Button>
                  <Button variant="link">Link</Button>
                </div>
              </div>
              <div className="mb-6">
                <h4 className="mb-4 text-muted-foreground">Sizes</h4>
                <div className="flex flex-wrap items-center gap-4">
                  <Button size="sm">Small</Button>
                  <Button size="default">Default</Button>
                  <Button size="lg">Large</Button>
                  <Button size="icon"><Camera className="h-4 w-4" /></Button>
                </div>
              </div>
              <div>
                <h4 className="mb-4 text-muted-foreground">Inspector Mode (Larger tap targets)</h4>
                <div className="flex flex-wrap items-center gap-4">
                  <Button className="btn-inspector">
                    <Camera className="mr-2 h-5 w-5" />
                    Take Photo
                  </Button>
                  <Button variant="secondary" className="btn-inspector">
                    <ClipboardCheck className="mr-2 h-5 w-5" />
                    Complete Room
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Cards */}
        <section className="mb-16">
          <h2 className="mb-6">Cards</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <Card className="shadow-card transition-apple hover:shadow-card-hover">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Home className="h-5 w-5 text-primary" />
                  123 Oak Street
                </CardTitle>
                <CardDescription>Scheduled for Jan 15, 2026</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Badge>Full Inspection</Badge>
                  <Badge variant="outline">$425</Badge>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-card transition-apple hover:shadow-card-hover">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  John Smith
                </CardTitle>
                <CardDescription>Homebuyer</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <span className="status-dot status-dot-success" />
                  <span className="text-sm text-muted-foreground">3 inspections completed</span>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-card transition-apple hover:shadow-card-hover">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardCheck className="h-5 w-5 text-primary" />
                  Inspection Report
                </CardTitle>
                <CardDescription>Generated Jan 10, 2026</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">12 defects</Badge>
                  <Badge variant="destructive">2 safety</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Status Indicators */}
        <section className="mb-16">
          <h2 className="mb-6">Status Indicators</h2>
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-6">
                <div className="flex items-center gap-2">
                  <span className="status-dot status-dot-success" />
                  <span>Completed</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="status-dot status-dot-warning" />
                  <span>In Progress</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="status-dot status-dot-danger" />
                  <span>Safety Issue</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="status-dot status-dot-info" />
                  <span>Scheduled</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Badges */}
        <section className="mb-16">
          <h2 className="mb-6">Badges</h2>
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-3">
                <Badge>Default</Badge>
                <Badge variant="secondary">Secondary</Badge>
                <Badge variant="outline">Outline</Badge>
                <Badge variant="destructive">Destructive</Badge>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-8">
        <div className="mx-auto max-w-6xl px-4 text-center">
          <p className="text-sm text-muted-foreground">
            InspectOS Design System - Slate + Orange with Apple-inspired refinement
          </p>
        </div>
      </footer>
    </div>
  );
}
