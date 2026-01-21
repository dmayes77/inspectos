"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { AdminShell } from "@/components/layout/admin-shell";
import { AdminPageHeader } from "@/components/layout/admin-page-header";
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
import {
  ChevronLeft,
  Edit,
  Archive,
  FileText,
  MapPin,
  User,
  Calendar,
  ClipboardList,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  PenTool,
  Image as ImageIcon,
} from "lucide-react";
import { mockAdminUser } from "@/lib/constants/mock-users";
import { formatInspectionDateTime } from "@/lib/utils/formatters";
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

export default function InspectionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const { id } = params as { id: string };

  // New inspection data fetch (answers, findings, signatures)
  const { data: inspectionData, isLoading: dataLoading } = useInspectionData(id);

  const isLoading = dataLoading;

  // Calculate stats from inspection data
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

  // Group answers by section
  const groupedAnswers = useMemo(() => {
    if (!inspectionData) return null;
    const sections = inspectionData.inspection.template?.template_sections || [];
    return groupAnswersBySection(inspectionData.answers, sections);
  }, [inspectionData]);

  if (isLoading) {
    return (
      <AdminShell user={mockAdminUser}>
        <div className="py-12 text-center text-muted-foreground">Loading inspection...</div>
      </AdminShell>
    );
  }

  const inspection = inspectionData?.inspection;

  if (!inspection) {
    return (
      <AdminShell user={mockAdminUser}>
        <div className="space-y-6">
          <Button variant="ghost" asChild>
            <Link href="/admin/inspections">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Inspections
            </Link>
          </Button>
          <div className="text-center py-12">
            <h1 className="text-2xl font-semibold mb-2">Inspection Not Found</h1>
            <p className="text-muted-foreground">The inspection you are looking for does not exist.</p>
          </div>
        </div>
      </AdminShell>
    );
  }

  const handleArchive = () => {
    // TODO: Implement API call to archive inspection
    setArchiveDialogOpen(false);
    router.push("/admin/inspections");
  };

  const handleGenerateReport = () => {
    // TODO: Implement report generation
  };

  const isCompleted = inspection.status === "completed";
  const scheduledDate = inspection.job?.scheduled_date || "";
  const scheduledTime = inspection.job?.scheduled_time || "";
  const formattedDateTime = scheduledDate ? formatInspectionDateTime(scheduledDate, scheduledTime) : "Unscheduled";
  const property = inspection.job?.property;
  const client = inspection.job?.client;
  const inspectorName = inspection.inspector?.full_name || inspection.inspector?.email || "Unassigned";
  const address = property
    ? [property.address_line1, property.address_line2, `${property.city}, ${property.state} ${property.zip_code}`]
        .filter(Boolean)
        .join(", ")
    : "Property unavailable";

  return (
    <AdminShell user={mockAdminUser}>
      <div className="space-y-6">
        {/* Back Button */}
        <Button variant="ghost" asChild>
          <Link href="/admin/inspections">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Inspections
          </Link>
        </Button>

        <AdminPageHeader
          title={
            <div className="flex flex-col gap-3 text-center sm:text-left">
              <div className="flex flex-wrap items-start justify-center gap-2 text-base sm:justify-start sm:text-lg">
                <MapPin className="mt-1 h-5 w-5 shrink-0 text-muted-foreground" />
                <div className="text-center sm:text-left">
                  <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                    <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{address}</h1>
                    {inspectionStatusBadge(inspection.status)}
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground sm:flex-row sm:items-center sm:gap-6">
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {formattedDateTime}
                </span>
                {stats && (
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4" />
                    {stats.completionPercentage}% Complete
                  </span>
                )}
              </div>
            </div>
          }
          actions={
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
              <Button asChild className="w-full sm:w-auto">
                <Link href={`/admin/inspections/${inspection.id}/edit`}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Link>
              </Button>
              <Button variant="outline" className="w-full sm:w-auto" onClick={() => setArchiveDialogOpen(true)}>
                <Archive className="mr-2 h-4 w-4" />
                Archive
              </Button>
              <Button variant="outline" className="w-full sm:w-auto" onClick={handleGenerateReport} disabled={!isCompleted}>
                <FileText className="mr-2 h-4 w-4" />
                Generate Report
              </Button>
            </div>
          }
        />

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="answers">
              Answers {stats && `(${stats.answeredItems}/${stats.totalItems})`}
            </TabsTrigger>
            <TabsTrigger value="findings">
              Findings {stats && stats.totalFindings > 0 && `(${stats.totalFindings})`}
            </TabsTrigger>
            <TabsTrigger value="signatures">
              Signatures {stats && stats.totalSignatures > 0 && `(${stats.totalSignatures})`}
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Stats Cards */}
            {stats && (
              <div className="grid gap-4 md:grid-cols-4">
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-muted-foreground">Completion</span>
                    </div>
                    <div className="mt-2">
                      <Progress value={stats.completionPercentage} className="h-2" />
                      <p className="mt-1 text-sm font-medium">{stats.completionPercentage}%</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-orange-600" />
                      <span className="text-sm text-muted-foreground">Findings</span>
                    </div>
                    <p className="mt-2 text-2xl font-bold">{stats.totalFindings}</p>
                    <div className="mt-1 flex gap-2 text-xs">
                      {stats.findingCounts.safety && (
                        <span className="text-red-600">{stats.findingCounts.safety} safety</span>
                      )}
                      {stats.findingCounts.major && (
                        <span className="text-orange-600">{stats.findingCounts.major} major</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2">
                      <ClipboardList className="h-4 w-4 text-blue-600" />
                      <span className="text-sm text-muted-foreground">Answers</span>
                    </div>
                    <p className="mt-2 text-2xl font-bold">
                      {stats.answeredItems}/{stats.totalItems}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2">
                      <PenTool className="h-4 w-4 text-purple-600" />
                      <span className="text-sm text-muted-foreground">Signatures</span>
                    </div>
                    <p className="mt-2 text-2xl font-bold">{stats.totalSignatures}</p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Details Grid */}
            <div className="grid gap-4 md:grid-cols-2 md:gap-6">
              {/* Client Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Client Information</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <div className="flex items-start gap-3">
                    <User className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
                    <div>
                      <p className="text-sm text-muted-foreground">Client</p>
                      <p className="font-medium">{client?.name || "Unknown client"}</p>
                    </div>
                  </div>
                  <div className="pt-4 border-t">
                    {client?.id ? (
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/admin/clients/${client.id}`}>View Client Profile</Link>
                      </Button>
                    ) : null}
                  </div>
                </CardContent>
              </Card>

              {/* Inspector Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Inspector</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <div className="flex items-start gap-3">
                    <User className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">Inspector</p>
                      <p className="font-medium">{inspectorName}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tags */}
              <Card>
                <CardHeader>
                  <CardTitle>Inspection Tags</CardTitle>
                </CardHeader>
                <CardContent>
                  <TagAssignmentEditor scope="inspection" entityId={inspection.id} />
                </CardContent>
              </Card>

              {/* Property Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Property Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {property?.square_feet && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Sqft</span>
                      <span>{property.square_feet.toLocaleString()}</span>
                    </div>
                  )}
                  {property?.year_built && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Year Built</span>
                      <span>{property.year_built}</span>
                    </div>
                  )}
                  {property?.property_type && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Type</span>
                      <span className="capitalize">{property.property_type}</span>
                    </div>
                  )}
                  {inspection.notes && (
                    <div className="pt-3 border-t">
                      <p className="text-muted-foreground mb-1">Notes</p>
                      <p>{inspection.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Answers Tab */}
          <TabsContent value="answers" className="space-y-4">
            {groupedAnswers && inspectionData ? (
              Array.from(groupedAnswers.entries()).map(([sectionId, { section, answers }]) => (
                <Card key={sectionId}>
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
                                {hasAnswer ? (
                                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                                ) : (
                                  <XCircle className="h-4 w-4 text-gray-300" />
                                )}
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
          </TabsContent>

          {/* Findings Tab */}
          <TabsContent value="findings" className="space-y-4">
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
          </TabsContent>

          {/* Signatures Tab */}
          <TabsContent value="signatures" className="space-y-4">
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
                        Signed: {new Date(sig.signed_at).toLocaleDateString()} at{" "}
                        {new Date(sig.signed_at).toLocaleTimeString()}
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
          </TabsContent>
        </Tabs>

        {/* Archive Confirmation Dialog */}
        <AlertDialog open={archiveDialogOpen} onOpenChange={setArchiveDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Archive Inspection?</AlertDialogTitle>
              <AlertDialogDescription>
                This will archive this inspection. Archived inspections can be restored later. This action does not permanently delete the
                inspection.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleArchive}>Archive</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminShell>
  );
}
