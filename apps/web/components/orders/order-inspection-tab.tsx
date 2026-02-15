"use client";

import { useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, PenTool, Image as ImageIcon, FileText, Edit, ClipboardList, Wrench, User } from "lucide-react";
import { inspectionStatusBadge } from "@/lib/admin/badges";
import {
  useInspectionData,
  getSeverityColor,
  getSeverityLabel,
  calculateCompletionPercentage,
  countFindingsBySeverity,
  groupAnswersBySection,
} from "@/hooks/use-inspection-data";

function severityBorderClass(severity: string) {
  switch (severity) {
    case "safety": return "border-l-red-500";
    case "major": return "border-l-orange-500";
    case "moderate": return "border-l-yellow-500";
    case "minor": return "border-l-blue-400";
    default: return "border-l-border";
  }
}

interface OrderInspectionTabProps {
  orderId: string;
}

export function OrderInspectionTab({ orderId }: OrderInspectionTabProps) {
  const { data: inspectionData, isLoading } = useInspectionData(orderId);

  const stats = useMemo(() => {
    if (!inspectionData) return null;
    const { answers, findings } = inspectionData;
    const sections = inspectionData.inspection.template?.template_sections || [];
    return {
      completionPercentage: calculateCompletionPercentage(answers, sections),
      findingCounts: countFindingsBySeverity(findings),
      totalFindings: findings.length,
      totalSignatures: inspectionData.signatures.length,
      answeredItems: answers.filter((a) => a.value !== null && a.value !== "").length,
      totalItems: sections.reduce((sum, s) => sum + s.template_items.length, 0),
    };
  }, [inspectionData]);

  const groupedAnswers = useMemo(() => {
    if (!inspectionData) return null;
    const sections = inspectionData.inspection.template?.template_sections || [];
    return groupAnswersBySection(inspectionData.answers, sections);
  }, [inspectionData]);

  if (isLoading) {
    return (
      <div className="py-12 text-center text-muted-foreground">Loading inspection data...</div>
    );
  }

  if (!inspectionData) {
    return (
      <Card>
        <CardContent className="py-12 text-center space-y-3">
          <p className="text-muted-foreground">No inspection data found.</p>
          <Button asChild>
            <Link href={`/admin/inspections/new?orderId=${orderId}`}>Add Inspection</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const inspection = inspectionData.inspection;

  return (
    <div className="space-y-4">
      {/* Status + Summary */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="text-base">Inspection Status</CardTitle>
              <CardDescription>Overall completion and findings summary.</CardDescription>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button variant="outline" size="sm" asChild>
                <Link href={`/admin/orders/${orderId}/edit`}>
                  <Edit className="mr-1.5 h-3.5 w-3.5" />
                  Edit
                </Link>
              </Button>
              <Button size="sm" disabled={inspection.status !== "completed" && inspection.status !== "pending_report" && inspection.status !== "delivered"}>
                <FileText className="mr-1.5 h-3.5 w-3.5" />
                Generate Report
              </Button>
              <Button variant="outline" size="sm">
                <ClipboardList className="mr-1.5 h-3.5 w-3.5" />
                Deploy
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-wrap items-center gap-3">
            {inspectionStatusBadge(inspection.status)}
            {stats && (
              <>
                <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {stats.completionPercentage}% complete ({stats.answeredItems}/{stats.totalItems} items)
                </span>
                {stats.totalFindings > 0 && (
                  <span className="inline-flex items-center gap-1.5">
                    {stats.findingCounts.safety > 0 && <Badge className="bg-red-100 text-red-800 border-red-200 text-xs">{stats.findingCounts.safety} safety</Badge>}
                    {stats.findingCounts.major > 0 && <Badge className="bg-orange-100 text-orange-800 border-orange-200 text-xs">{stats.findingCounts.major} major</Badge>}
                    {stats.findingCounts.moderate > 0 && <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 text-xs">{stats.findingCounts.moderate} moderate</Badge>}
                    {stats.findingCounts.minor > 0 && <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-xs">{stats.findingCounts.minor} minor</Badge>}
                  </span>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Services */}
      {inspection.services && inspection.services.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Services</CardTitle>
            <CardDescription>Inspection services assigned to this order.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-0 divide-y">
            {inspection.services.map((svc) => (
              <div key={svc.id} className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
                <div className="flex items-start gap-3 min-w-0">
                  <Wrench className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{svc.name}</p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
                      {svc.inspector && (
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                          <User className="h-3 w-3" />
                          {svc.inspector.full_name ?? svc.inspector.email}
                        </span>
                      )}
                      {svc.duration_minutes && (
                        <span className="text-xs text-muted-foreground">{svc.duration_minutes} min</span>
                      )}
                      {svc.notes && (
                        <span className="text-xs text-muted-foreground italic">{svc.notes}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {svc.price != null && (
                    <span className="text-sm font-medium">${svc.price.toLocaleString()}</span>
                  )}
                  {svc.status && (
                    <Badge variant="outline" className="text-xs capitalize">{svc.status.replace(/_/g, " ")}</Badge>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Answers */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Answers</CardTitle>
          <CardDescription>All answers collected during the inspection, grouped by section.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {groupedAnswers && inspectionData ? (
            Array.from(groupedAnswers.entries()).map(([sectionId, { section, answers }]) => (
              <div key={sectionId}>
                <div className="mb-3">
                  <p className="text-sm font-semibold">{section.name}</p>
                  {section.description && <p className="text-xs text-muted-foreground">{section.description}</p>}
                </div>
                <div className="space-y-0 divide-y">
                  {section.template_items
                    .sort((a, b) => a.sort_order - b.sort_order)
                    .map((item) => {
                      const answer = answers.get(item.id);
                      const hasAnswer = answer && answer.value !== null && answer.value !== "";
                      return (
                        <div key={item.id} className="flex items-start gap-3 py-2.5">
                          <div className="mt-0.5 shrink-0">
                            {hasAnswer
                              ? <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                              : <XCircle className="h-3.5 w-3.5 text-muted-foreground/40" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{item.name}</p>
                            {item.description && <p className="text-xs text-muted-foreground">{item.description}</p>}
                            {hasAnswer && (
                              <div className="mt-1 flex items-center gap-2 flex-wrap">
                                <Badge variant="secondary" className="text-xs">{answer.value}</Badge>
                                {answer.notes && <span className="text-xs text-muted-foreground">{answer.notes}</span>}
                              </div>
                            )}
                          </div>
                          <Badge variant="outline" className="text-xs shrink-0">{item.item_type}</Badge>
                        </div>
                      );
                    })}
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No answers recorded yet. Answers will appear here once the inspection is started.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Findings */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Findings</CardTitle>
          <CardDescription>All issues identified during the inspection.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {inspectionData.findings.length > 0 ? (
            inspectionData.findings.map((finding) => (
              <div
                key={finding.id}
                className={`border border-l-4 rounded-r-lg pl-4 pr-3 py-3 ${severityBorderClass(finding.severity)}`}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <p className="text-sm font-semibold">{finding.title}</p>
                    {finding.location && <p className="text-xs text-muted-foreground">Location: {finding.location}</p>}
                  </div>
                  <Badge className={`${getSeverityColor(finding.severity)} text-xs shrink-0`}>{getSeverityLabel(finding.severity)}</Badge>
                </div>
                {finding.description && <p className="text-sm text-muted-foreground mb-2">{finding.description}</p>}
                {finding.recommendation && (
                  <div className="mb-2">
                    <p className="text-xs font-medium text-muted-foreground mb-0.5">Recommendation</p>
                    <p className="text-sm">{finding.recommendation}</p>
                  </div>
                )}
                {(finding.estimated_cost_min || finding.estimated_cost_max) && (
                  <div className="mb-2">
                    <p className="text-xs font-medium text-muted-foreground mb-0.5">Estimated Cost</p>
                    <p className="text-sm">
                      {finding.estimated_cost_min && `$${finding.estimated_cost_min.toLocaleString()}`}
                      {finding.estimated_cost_min && finding.estimated_cost_max && " – "}
                      {finding.estimated_cost_max && `$${finding.estimated_cost_max.toLocaleString()}`}
                    </p>
                  </div>
                )}
                {finding.media && finding.media.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1.5">Photos</p>
                    <div className="flex gap-2 flex-wrap">
                      {finding.media.map((m) => (
                        <div key={m.id} className="relative w-16 h-16 rounded-md overflow-hidden bg-muted border">
                          <ImageIcon className="absolute inset-0 m-auto h-6 w-6 text-muted-foreground" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No findings recorded. Findings will appear here when issues are documented.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Signatures */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Signatures</CardTitle>
          <CardDescription>All signatures collected for this inspection.</CardDescription>
        </CardHeader>
        <CardContent>
          {inspectionData.signatures.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {inspectionData.signatures.map((sig) => (
                <div key={sig.id} className="rounded-lg border p-3 space-y-2">
                  <div>
                    <p className="text-sm font-medium">{sig.signer_name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{sig.signer_type}</p>
                  </div>
                  <div className="aspect-3/1 bg-muted rounded-md flex items-center justify-center border">
                    {sig.signature_data ? (
                      <Image
                        src={sig.signature_data.startsWith("data:") ? sig.signature_data : `data:image/png;base64,${sig.signature_data}`}
                        alt={`${sig.signer_name}'s signature`}
                        width={300}
                        height={100}
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <PenTool className="h-6 w-6 text-muted-foreground/40" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Signed {new Date(sig.signed_at).toLocaleDateString()} at {new Date(sig.signed_at).toLocaleTimeString()}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No signatures collected yet.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Vendors */}
      {inspection.services && inspection.services.some((s) => s.vendor) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Vendors</CardTitle>
            <CardDescription>Vendors assigned to this inspection.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {inspection.services
                .filter((s) => s.vendor)
                .map((s) => (
                  <li key={s.id} className="border-l-2 border-border pl-3 py-1">
                    <div className="text-sm font-medium">{s.vendor!.name}</div>
                    <div className="text-xs text-muted-foreground space-x-3">
                      {s.vendor!.vendor_type && <span>{s.vendor!.vendor_type}</span>}
                      {s.vendor!.phone && <span>{s.vendor!.phone}</span>}
                      {s.vendor!.email && <span>{s.vendor!.email}</span>}
                    </div>
                  </li>
                ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
