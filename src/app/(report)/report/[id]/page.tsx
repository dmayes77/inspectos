"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Download,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Calendar,
  MapPin,
  User,
  Camera,
  CreditCard,
  FileText,
} from "lucide-react";

// Mock report data - would be fetched based on ID and validated with token
const mockReport = {
  id: "rpt_abc123",
  status: "DELIVERED",
  inspection: {
    date: new Date("2026-01-10T09:00:00"),
    property: {
      street: "123 Main Street",
      city: "Austin",
      state: "TX",
      zip: "78701",
    },
    inspector: {
      name: "John Smith",
      license: "TX-12345",
    },
  },
  company: {
    name: "Acme Home Inspections",
    logo: null,
  },
  summary: {
    safetyIssues: 3,
    defects: 8,
    monitored: 5,
    satisfactory: 42,
  },
  findings: {
    safety: [
      {
        id: "1",
        system: "HVAC",
        title: "Gas leak detected at furnace connection",
        severity: "safety",
        description: "Active gas leak detected at the flexible connector to the furnace. Immediate repair required.",
        recommendation: "Contact licensed HVAC technician immediately. Do not use furnace until repaired.",
        estimatedCost: "$200-400",
        photos: ["/placeholder-photo-1.jpg"],
      },
      {
        id: "2",
        system: "Electrical",
        title: "Double-tapped breaker in main panel",
        severity: "safety",
        description: "Two circuits connected to a single breaker designed for one circuit. Fire hazard.",
        recommendation: "Have licensed electrician install additional breaker or tandem breaker.",
        estimatedCost: "$150-300",
        photos: ["/placeholder-photo-2.jpg"],
      },
      {
        id: "3",
        system: "Roof",
        title: "Missing kick-out flashing at chimney",
        severity: "safety",
        description: "Water intrusion risk at chimney-roof junction. Can lead to structural damage.",
        recommendation: "Install kick-out flashing to direct water away from wall.",
        estimatedCost: "$150-250",
        photos: ["/placeholder-photo-3.jpg"],
      },
    ],
    defects: [
      {
        id: "4",
        system: "Roof",
        title: "Worn shingles on north slope",
        severity: "defect",
        description: "Shingles showing significant granule loss and curling. Approximately 5 years remaining life.",
        recommendation: "Plan for roof replacement within 3-5 years. Monitor for leaks.",
        estimatedCost: "$8,000-12,000",
        photos: ["/placeholder-photo-4.jpg"],
      },
      {
        id: "5",
        system: "Plumbing",
        title: "Slow drain in master bathroom",
        severity: "defect",
        description: "Sink drain taking longer than normal to empty. Possible partial blockage.",
        recommendation: "Have drain cleaned or snaked by plumber.",
        estimatedCost: "$100-200",
        photos: [],
      },
    ],
    monitored: [
      {
        id: "6",
        system: "Foundation",
        title: "Minor settling crack in garage slab",
        severity: "monitor",
        description: "Hairline crack in garage floor, appears stable. Common in homes of this age.",
        recommendation: "Monitor for changes. Mark ends with tape to track movement.",
        estimatedCost: "N/A",
        photos: ["/placeholder-photo-5.jpg"],
      },
    ],
  },
  systems: [
    { name: "Roof", status: "defect", items: 3 },
    { name: "Exterior", status: "satisfactory", items: 8 },
    { name: "Electrical", status: "safety", items: 6 },
    { name: "HVAC", status: "safety", items: 4 },
    { name: "Plumbing", status: "defect", items: 5 },
    { name: "Interior", status: "satisfactory", items: 12 },
    { name: "Foundation", status: "monitor", items: 4 },
    { name: "Attic", status: "satisfactory", items: 3 },
  ],
  payment: {
    total: 550,
    paid: 100,
    balance: 450,
    isPaid: false,
  },
};

function SeverityBadge({ severity }: { severity: string }) {
  switch (severity) {
    case "safety":
      return (
        <Badge className="bg-red-500 hover:bg-red-500">
          <AlertTriangle className="mr-1 h-3 w-3" />
          Safety Issue
        </Badge>
      );
    case "defect":
      return (
        <Badge className="bg-amber-500 hover:bg-amber-500">
          <AlertCircle className="mr-1 h-3 w-3" />
          Defect
        </Badge>
      );
    case "monitor":
      return (
        <Badge variant="secondary">
          <FileText className="mr-1 h-3 w-3" />
          Monitor
        </Badge>
      );
    default:
      return (
        <Badge variant="outline">
          <CheckCircle2 className="mr-1 h-3 w-3" />
          Satisfactory
        </Badge>
      );
  }
}

function SystemStatusIcon({ status }: { status: string }) {
  switch (status) {
    case "safety":
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
    case "defect":
      return <AlertCircle className="h-4 w-4 text-amber-500" />;
    case "monitor":
      return <FileText className="h-4 w-4 text-slate-500" />;
    default:
      return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
  }
}

export default function ReportPage() {
  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <>
      {/* Report Header */}
      <div className="border-b bg-white">
        <div className="container py-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-xl font-bold text-primary-foreground">
                {mockReport.company.name.charAt(0)}
              </div>
              <div>
                <h1 className="text-xl font-semibold">Inspection Report</h1>
                <p className="text-sm text-muted-foreground">
                  {mockReport.inspection.property.street},{" "}
                  {mockReport.inspection.property.city},{" "}
                  {mockReport.inspection.property.state}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </Button>
              {!mockReport.payment.isPaid && (
                <Button asChild>
                  <Link href={`/report/${mockReport.id}/pay`}>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Pay ${mockReport.payment.balance}
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container py-8">
        <div className="grid gap-8 lg:grid-cols-4">
          {/* Sidebar - Systems Overview */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Systems Inspected</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 pt-0">
                {mockReport.systems.map((system) => (
                  <button
                    key={system.name}
                    className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm hover:bg-muted"
                  >
                    <div className="flex items-center gap-2">
                      <SystemStatusIcon status={system.status} />
                      <span>{system.name}</span>
                    </div>
                    <span className="text-muted-foreground">{system.items}</span>
                  </button>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="space-y-6 lg:col-span-3">
            {/* Inspection Info */}
            <Card>
              <CardContent className="flex flex-wrap gap-6 p-6">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{formatDate(mockReport.inspection.date)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {mockReport.inspection.property.street},{" "}
                    {mockReport.inspection.property.city},{" "}
                    {mockReport.inspection.property.state}{" "}
                    {mockReport.inspection.property.zip}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {mockReport.inspection.inspector.name} (License #
                    {mockReport.inspection.inspector.license})
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Summary Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Summary of Findings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center">
                    <div className="text-3xl font-bold text-red-600">
                      {mockReport.summary.safetyIssues}
                    </div>
                    <div className="mt-1 text-sm font-medium text-red-700">
                      Safety Issues
                    </div>
                  </div>
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-center">
                    <div className="text-3xl font-bold text-amber-600">
                      {mockReport.summary.defects}
                    </div>
                    <div className="mt-1 text-sm font-medium text-amber-700">
                      Defects
                    </div>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-center">
                    <div className="text-3xl font-bold text-slate-600">
                      {mockReport.summary.monitored}
                    </div>
                    <div className="mt-1 text-sm font-medium text-slate-700">
                      Monitor
                    </div>
                  </div>
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-center">
                    <div className="text-3xl font-bold text-emerald-600">
                      {mockReport.summary.satisfactory}
                    </div>
                    <div className="mt-1 text-sm font-medium text-emerald-700">
                      Satisfactory
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Safety Issues (Priority) */}
            {mockReport.findings.safety.length > 0 && (
              <Card className="border-red-200">
                <CardHeader className="bg-red-50">
                  <CardTitle className="flex items-center gap-2 text-red-700">
                    <AlertTriangle className="h-5 w-5" />
                    Safety Issues ({mockReport.findings.safety.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="divide-y p-0">
                  {mockReport.findings.safety.map((finding) => (
                    <div key={finding.id} className="p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{finding.system}</Badge>
                            <SeverityBadge severity={finding.severity} />
                          </div>
                          <h3 className="text-lg font-semibold">{finding.title}</h3>
                          <p className="text-muted-foreground">{finding.description}</p>
                          <div className="rounded-lg bg-slate-50 p-3">
                            <p className="text-sm">
                              <strong>Recommendation:</strong> {finding.recommendation}
                            </p>
                            {finding.estimatedCost && (
                              <p className="mt-1 text-sm">
                                <strong>Estimated Cost:</strong> {finding.estimatedCost}
                              </p>
                            )}
                          </div>
                        </div>
                        {finding.photos.length > 0 && (
                          <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                            <Camera className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Defects */}
            {mockReport.findings.defects.length > 0 && (
              <Card className="border-amber-200">
                <CardHeader className="bg-amber-50">
                  <CardTitle className="flex items-center gap-2 text-amber-700">
                    <AlertCircle className="h-5 w-5" />
                    Defects ({mockReport.findings.defects.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="divide-y p-0">
                  {mockReport.findings.defects.map((finding) => (
                    <div key={finding.id} className="p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{finding.system}</Badge>
                            <SeverityBadge severity={finding.severity} />
                          </div>
                          <h3 className="text-lg font-semibold">{finding.title}</h3>
                          <p className="text-muted-foreground">{finding.description}</p>
                          <div className="rounded-lg bg-slate-50 p-3">
                            <p className="text-sm">
                              <strong>Recommendation:</strong> {finding.recommendation}
                            </p>
                            {finding.estimatedCost && (
                              <p className="mt-1 text-sm">
                                <strong>Estimated Cost:</strong> {finding.estimatedCost}
                              </p>
                            )}
                          </div>
                        </div>
                        {finding.photos.length > 0 && (
                          <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                            <Camera className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Items to Monitor */}
            {mockReport.findings.monitored.length > 0 && (
              <Card>
                <CardHeader className="bg-slate-50">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Items to Monitor ({mockReport.findings.monitored.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="divide-y p-0">
                  {mockReport.findings.monitored.map((finding) => (
                    <div key={finding.id} className="p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{finding.system}</Badge>
                            <SeverityBadge severity={finding.severity} />
                          </div>
                          <h3 className="text-lg font-semibold">{finding.title}</h3>
                          <p className="text-muted-foreground">{finding.description}</p>
                          <div className="rounded-lg bg-slate-50 p-3">
                            <p className="text-sm">
                              <strong>Recommendation:</strong> {finding.recommendation}
                            </p>
                          </div>
                        </div>
                        {finding.photos.length > 0 && (
                          <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                            <Camera className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Balance Due */}
            {!mockReport.payment.isPaid && (
              <Card className="border-primary">
                <CardContent className="flex items-center justify-between p-6">
                  <div>
                    <p className="text-sm text-muted-foreground">Balance Due</p>
                    <p className="text-2xl font-bold">
                      ${mockReport.payment.balance.toFixed(2)}
                    </p>
                  </div>
                  <Button size="lg" asChild>
                    <Link href={`/report/${mockReport.id}/pay`}>
                      Pay Now
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t bg-white py-6">
        <div className="container text-center text-sm text-muted-foreground">
          <p>
            Report generated by{" "}
            <Link href="/" className="font-medium text-foreground hover:underline">
              InspectOS
            </Link>{" "}
            · © {new Date().getFullYear()} {mockReport.company.name}
          </p>
        </div>
      </footer>
    </>
  );
}
