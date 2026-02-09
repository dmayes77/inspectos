"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { AdminShell } from "@/components/layout/admin-shell";
import { ResourceDetailLayout } from "@/components/shared/resource-detail-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Edit, Archive, FileText, User, Calendar, ClipboardList, AlertTriangle, CheckCircle2, XCircle, PenTool, Image as ImageIcon, Mail } from "lucide-react";
import { mockAdminUser } from "@inspectos/shared/constants/mock-users";
import { RecordInformationCard } from "@/components/shared/record-information-card";
import { formatInspectionDateTime } from "@inspectos/shared/utils/formatters";
import { inspectionStatusBadge } from "@/lib/admin/badges";
import { TagAssignmentEditor } from "@/components/tags/tag-assignment-editor";
import {
  useInspectionData,
  getSeverityColor,
  getSeverityLabel,
  calculateCompletionPercentage,
  countFindingsBySeverity,
  groupAnswersBySection,
} from "@/hooks/use-inspection-data";
import { useVendors } from "@/hooks/use-vendors";

function VendorList({ vendorIds }: { vendorIds: string[] }) {
  const { data: vendors = [], isLoading } = useVendors();
  if (isLoading) return <div>Loading vendors...</div>;
  const assignedVendors = vendors.filter((v) => vendorIds.includes(v.id));
  if (assignedVendors.length === 0) return <div className="text-muted-foreground">No vendors found.</div>;
  return (
    <ul className="space-y-2">
      {assignedVendors.map((vendor) => (
        <li key={vendor.id} className="border rounded px-3 py-2">
          <div className="font-medium">{vendor.name}</div>
          {vendor.vendorType && <div className="text-xs text-muted-foreground">Type: {vendor.vendorType}</div>}
          {vendor.phone && <div className="text-xs text-muted-foreground">Phone: {vendor.phone}</div>}
          {vendor.email && <div className="text-xs text-muted-foreground">Email: {vendor.email}</div>}
          {vendor.status && <div className="text-xs text-muted-foreground">Status: {vendor.status}</div>}
        </li>
      ))}
    </ul>
  );
}

export default function InspectionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const { id } = params as { id: string };

  // New inspection data fetch (answers, findings, signatures)
  const { data: inspectionData, isLoading: dataLoading } = useInspectionData(id);

  const isLoading = dataLoading;

  const stats = useMemo(() => {
    if (!inspectionData) return null;
    const { answers, findings, signatures } = inspectionData;
    const sections = inspectionData.inspection.template?.template_sections || [];
    return {
      completionPercentage: calculateCompletionPercentage(answers, sections),
      findingCounts: countFindingsBySeverity(findings),
      totalFindings: findings.length,
      totalSignatures: signatures.length,
      answeredItems: answers.filter((a) => a.value !== null && a.value !== "").length,
      totalItems: sections.reduce((sum, s) => sum + s.template_items.length, 0),
    };
  }, [inspectionData]);

  const groupedAnswers = useMemo(() => {
    if (!inspectionData) return null;
    const sections = inspectionData.inspection.template?.template_sections || [];
    return groupAnswersBySection(inspectionData.answers, sections);
  }, [inspectionData]);

  // Handler functions - defined BEFORE useMemos that reference them
  const handleArchive = () => {
    // TODO: Implement API call to archive inspection
    setArchiveDialogOpen(false);
    router.push("/admin/inspections");
  };

  const handleGenerateReport = () => {
    // TODO: Implement report generation
  };

  // Pre-compute all derived values before any conditional returns
  const inspection = inspectionData?.inspection;
  const isCompleted = inspection?.status === "completed";
  const scheduledDate = inspection?.order?.scheduled_date || "";
  const scheduledTime = "";
  const formattedDateTime = scheduledDate ? formatInspectionDateTime(scheduledDate, scheduledTime) : "Unscheduled";
  const property = inspection?.order?.property;
  const client = inspection?.order?.client;
  const linkedOrderId = inspection?.order?.id ?? null;
  const clientEmail = client?.email ?? null;
  const inspectorName = inspection?.inspector?.full_name || inspection?.inspector?.email || "Unassigned";
  const address = property
    ? [property.address_line1, property.address_line2, `${property.city}, ${property.state} ${property.zip_code}`].filter(Boolean).join(", ")
    : "Property unavailable";

  // ALL hooks must be called before any conditional returns
  const breadcrumbContent = useMemo(
    () => (
      <>
        <Link href="/admin/overview" className="hover:text-foreground">
          Overview
        </Link>
        <span className="text-muted-foreground">/</span>
        <Link href="/admin/inspections" className="hover:text-foreground">
          Inspections
        </Link>
        {inspection && (
          <>
            <span className="text-muted-foreground">/</span>
            <span>{address}</span>
          </>
        )}
      </>
    ),
    [inspection, address]
  );

  const metaContent = useMemo(
    () => {
      if (!inspection) return null;
      return (
        <>
          {inspectionStatusBadge(inspection.status)}
          <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="h-4 w-4" />
            {formattedDateTime}
          </span>
          {stats && (
            <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
              <CheckCircle2 className="h-4 w-4" />
              {stats.completionPercentage}% Complete
            </span>
          )}
        </>
      );
    },
    [inspection, formattedDateTime, stats]
  );

  // Memoize main content to prevent unnecessary rerenders
  const mainContent = useMemo(
    () => {
      if (!inspection) return null;
      return (
        <>
          <Card>
              <CardHeader>
                <CardTitle>Inspection Summary</CardTitle>
                <CardDescription>Property, client, schedule, and inspector details.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Property</p>
                  <p className="font-medium">{address}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Client</p>
                  <p className="font-medium">{client?.name || "No client assigned"}</p>
                  {client?.email && <p className="text-sm text-muted-foreground">{client.email}</p>}
                  {client?.phone && <p className="text-sm text-muted-foreground">{client.phone}</p>}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Scheduled</p>
                  <p className="font-medium">{formattedDateTime}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Inspector</p>
                  <p className="font-medium">{inspectorName}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground mb-1">Status</p>
                  {inspectionStatusBadge(inspection.status)}
                </div>
                {stats && (
                  <div className="col-span-2 flex gap-4 mt-2 pt-3 border-t">
                    <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4" />
                      {stats.completionPercentage}% Complete
                    </span>
                    {stats.totalFindings > 0 && (
                      <>
                        {stats.findingCounts.safety > 0 && <span className="text-red-600 text-xs">{stats.findingCounts.safety} safety</span>}
                        {stats.findingCounts.major > 0 && <span className="text-orange-600 text-xs">{stats.findingCounts.major} major</span>}
                      </>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Answers Section */}
            <Card>
              <CardHeader>
                <CardTitle>Answers</CardTitle>
                <CardDescription>All answers collected during the inspection, grouped by section.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {groupedAnswers && inspectionData ? (
                  Array.from(groupedAnswers.entries()).map(([sectionId, { section, answers }]) => (
                    <Card key={sectionId} className="border border-muted">
                      <CardHeader>
                        <CardTitle>{section.name}</CardTitle>
                        {section.description && <CardDescription>{section.description}</CardDescription>}
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {section.template_items
                            .sort((a, b) => a.sort_order - b.sort_order)
                            .map((item) => {
                              const answer = answers.get(item.id);
                              const hasAnswer = answer && answer.value !== null && answer.value !== "";
                              return (
                                <div key={item.id} className="flex items-start gap-3 py-2 border-b last:border-0">
                                  <div className="mt-0.5">
                                    {hasAnswer ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4 text-gray-300" />}
                                  </div>
                                  <div className="flex-1">
                                    <p className="font-medium">{item.name}</p>
                                    {item.description && <p className="text-sm text-muted-foreground">{item.description}</p>}
                                    {hasAnswer && (
                                      <div className="mt-1">
                                        <Badge variant="secondary">{answer.value}</Badge>
                                        {answer.notes && <p className="mt-1 text-sm text-muted-foreground">{answer.notes}</p>}
                                      </div>
                                    )}
                                  </div>
                                  <Badge variant="outline" className="text-xs">
                                    {item.item_type}
                                  </Badge>
                                </div>
                              );
                            })}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Card>
                    <CardContent className="py-12 text-center text-muted-foreground">
                      No answers recorded yet. Answers will appear here once the inspection is started.
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>

            {/* Findings Section */}
            <Card>
              <CardHeader>
                <CardTitle>Findings</CardTitle>
                <CardDescription>All findings/issues identified during the inspection.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {inspectionData && inspectionData.findings.length > 0 ? (
                  inspectionData.findings.map((finding) => (
                    <Card key={finding.id} className={`border ${getSeverityColor(finding.severity)}`}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle>{finding.title}</CardTitle>
                            {finding.location && <CardDescription>Location: {finding.location}</CardDescription>}
                          </div>
                          <Badge className={getSeverityColor(finding.severity)}>{getSeverityLabel(finding.severity)}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {finding.description && <p>{finding.description}</p>}
                        {finding.recommendation && (
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Recommendation</p>
                            <p>{finding.recommendation}</p>
                          </div>
                        )}
                        {(finding.estimated_cost_min || finding.estimated_cost_max) && (
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Estimated Cost</p>
                            <p>
                              {finding.estimated_cost_min && `$${finding.estimated_cost_min.toLocaleString()}`}
                              {finding.estimated_cost_min && finding.estimated_cost_max && " - "}
                              {finding.estimated_cost_max && `$${finding.estimated_cost_max.toLocaleString()}`}
                            </p>
                          </div>
                        )}
                        {finding.media && finding.media.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-muted-foreground mb-2">Photos</p>
                            <div className="flex gap-2 flex-wrap">
                              {finding.media.map((m) => (
                                <div key={m.id} className="relative w-20 h-20 rounded overflow-hidden bg-muted">
                                  <ImageIcon className="absolute inset-0 m-auto h-8 w-8 text-muted-foreground" />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Card>
                    <CardContent className="py-12 text-center text-muted-foreground">
                      No findings recorded. Findings will appear here when issues are documented during the inspection.
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>

            {/* Signatures Section */}
            <Card>
              <CardHeader>
                <CardTitle>Signatures</CardTitle>
                <CardDescription>All signatures collected for this inspection.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {inspectionData && inspectionData.signatures.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    {inspectionData.signatures.map((sig) => (
                      <Card key={sig.id}>
                        <CardHeader>
                          <CardTitle>{sig.signer_name}</CardTitle>
                          <CardDescription className="capitalize">{sig.signer_type}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="aspect-3/1 bg-muted rounded-lg flex items-center justify-center border">
                            {sig.signature_data ? (
                              <Image
                                src={sig.signature_data.startsWith("data:") ? sig.signature_data : `data:image/png;base64,${sig.signature_data}`}
                                alt={`${sig.signer_name}'s signature`}
                                width={300}
                                height={100}
                                className="h-full w-full object-contain"
                              />
                            ) : (
                              <PenTool className="h-8 w-8 text-muted-foreground" />
                            )}
                          </div>
                          <p className="mt-2 text-sm text-muted-foreground">
                            Signed: {new Date(sig.signed_at).toLocaleDateString()} at {new Date(sig.signed_at).toLocaleTimeString()}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="py-12 text-center text-muted-foreground">
                      No signatures collected yet. Signatures will appear here when the inspection is completed.
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>

            {/* Vendors Section */}
            <Card>
              <CardHeader>
                <CardTitle>Vendors</CardTitle>
                <CardDescription>Vendors assigned to this inspection.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {inspection.vendorIds && inspection.vendorIds.length > 0 ? (
                  <VendorList vendorIds={inspection.vendorIds} />
                ) : (
                  <div className="text-muted-foreground">No vendors assigned.</div>
                )}
              </CardContent>
            </Card>
          </>
      );
    },
    [inspection, inspectionData, stats, groupedAnswers, address, client, formattedDateTime, inspectorName]
  );

  // Memoize sidebar content to prevent unnecessary rerenders
  const sidebarContent = useMemo(
    () => {
      if (!inspection) return null;
      return (
        <>
            <Card id="quick-actions-card">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Handle common follow-ups without leaving this page.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href={`/admin/inspections/${inspection.id}/edit`}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Inspection
                  </Link>
                </Button>

                <Button variant="outline" className="w-full justify-start" onClick={handleGenerateReport} disabled={!isCompleted}>
                  <FileText className="mr-2 h-4 w-4" />
                  Generate Report
                </Button>

                {linkedOrderId ? (
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <Link href={`/admin/orders/${linkedOrderId}`}>
                      <FileText className="mr-2 h-4 w-4" />
                      View Linked Order
                    </Link>
                  </Button>
                ) : (
                  <Button variant="outline" className="w-full justify-start" disabled>
                    <FileText className="mr-2 h-4 w-4" />
                    No Linked Order
                  </Button>
                )}

                {client?.id ? (
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <Link href={`/admin/contacts/${client.id}`}>
                      <User className="mr-2 h-4 w-4" />
                      Open Client Profile
                    </Link>
                  </Button>
                ) : (
                  <Button variant="outline" className="w-full justify-start" disabled>
                    <User className="mr-2 h-4 w-4" />
                    Client Not Linked
                  </Button>
                )}

                {clientEmail ? (
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <a href={`mailto:${clientEmail}`}>
                      <Mail className="mr-2 h-4 w-4" />
                      Email Client
                    </a>
                  </Button>
                ) : (
                  <Button variant="outline" className="w-full justify-start" disabled>
                    <Mail className="mr-2 h-4 w-4" />
                    No Client Email
                  </Button>
                )}

                <Button
                  variant="default"
                  className="w-full justify-start"
                  onClick={() => {
                    /* TODO: Implement deploy logic */
                  }}
                >
                  <ClipboardList className="mr-2 h-4 w-4" />
                  Deploy to Inspector
                </Button>
                <Button variant="destructive" className="w-full justify-start" onClick={() => setArchiveDialogOpen(true)}>
                  <Archive className="mr-2 h-4 w-4" />
                  Archive Inspection
                </Button>
              </CardContent>
            </Card>

            <RecordInformationCard createdAt={inspection.created_at} updatedAt={inspection.updated_at} />
          </>
      );
    },
    [inspection, linkedOrderId, client, clientEmail, isCompleted, handleGenerateReport, handleArchive]
  );

  // Early returns after all hooks
  if (isLoading) {
    return (
      <AdminShell user={mockAdminUser}>
        <div className="py-12 text-center text-muted-foreground">Loading inspection...</div>
      </AdminShell>
    );
  }

  if (!inspection) {
    return (
      <AdminShell user={mockAdminUser}>
        <div className="space-y-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link href="/admin/overview" className="hover:text-foreground">
              Overview
            </Link>
            <span>/</span>
            <Link href="/admin/inspections" className="hover:text-foreground">
              Inspections
            </Link>
          </div>
          <div>
            <h1 className="text-2xl font-semibold">Inspection Not Found</h1>
            <p className="text-muted-foreground mt-2">The inspection you are looking for does not exist.</p>
          </div>
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell user={mockAdminUser}>
      <ResourceDetailLayout
        breadcrumb={breadcrumbContent}
        title="Inspection Details"
        description={address}
        meta={metaContent}
        backHref="/admin/inspections"
        main={mainContent}
        sidebar={sidebarContent}
      />

      {/* Archive Confirmation Dialog */}
        <AlertDialog open={archiveDialogOpen} onOpenChange={setArchiveDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Archive Inspection?</AlertDialogTitle>
              <AlertDialogDescription>
                This will archive this inspection. Archived inspections can be restored later. This action does not permanently delete the inspection.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleArchive}>Archive</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
    </AdminShell>
  );
}
