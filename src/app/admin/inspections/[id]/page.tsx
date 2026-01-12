"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AdminShell } from "@/components/layout/admin-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { ChevronLeft, Edit, Archive, FileText, MapPin, User, Calendar, DollarSign, ClipboardList } from "lucide-react";
import { useServices, type Service } from "@/hooks/use-services";
import { inspections } from "@/lib/mock/inspections";
import type { Inspection } from "@/lib/mock/inspections";
import { getTeamMembers, TeamMember } from "@/lib/mock/team";

const mockUser = {
  name: "Sarah Johnson",
  email: "sarah@acmeinspections.com",
  companyName: "Acme Home Inspections",
};

function getStatusBadge(status: string) {
  switch (status) {
    case "scheduled":
      return <Badge variant="secondary">Scheduled</Badge>;
    case "in_progress":
      return <Badge className="bg-amber-500 hover:bg-amber-500">In Progress</Badge>;
    case "completed":
      return <Badge className="bg-green-500 hover:bg-green-500">Completed</Badge>;
    case "pending_report":
      return <Badge className="bg-blue-500 hover:bg-blue-500">Pending Report</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export default function InspectionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const { id } = params as { id: string };
  // Use the same in-memory array as the edit page
  const inspection = inspections.find((i) => i.inspectionId === id);
  const { data: services = [] as Service[] } = useServices();
  const teamMembers: TeamMember[] = getTeamMembers();

  if (!inspection) {
    return (
      <AdminShell user={mockUser}>
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
    // In production, this would call an API to archive the inspection
    console.log("Archiving inspection:", inspection.inspectionId);
    setArchiveDialogOpen(false);
    router.push("/admin/inspections");
  };

  const handleGenerateReport = () => {
    // In production, this would generate and download the report
    console.log("Generating report for:", inspection.inspectionId);
  };

  const parts = inspection.address.split(", ");
  const isCompleted = inspection.status === "completed";

  return (
    <AdminShell user={mockUser}>
      <div className="space-y-6">
        {/* Back Button */}
        <Button variant="ghost" asChild>
          <Link href="/admin/inspections">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Inspections
          </Link>
        </Button>

        {/* Page Header */}
        <div className="space-y-4">
          <div className="flex items-start gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-semibold">{inspection.inspectionId}</h1>
                {getStatusBadge(inspection.status)}
              </div>
              <div className="flex items-start gap-2 text-lg mb-2">
                <MapPin className="h-5 w-5 text-muted-foreground shrink-0 mt-1" />
                <div>
                  <div>{parts[0]}</div>
                  <div className="text-muted-foreground">{parts[1]}</div>
                </div>
              </div>
              {/* teamMembers is now defined at the top of the component */}
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {inspection.date} at {inspection.time}
                </span>
                <span className="flex items-center gap-1">
                  <ClipboardList className="h-4 w-4" />
                  {inspection.types && inspection.types.length > 0 ? (
                    inspection.types.map((type) => (
                      <Badge key={type} variant="outline" className="ml-1 first:ml-0">
                        {type}
                      </Badge>
                    ))
                  ) : (
                    <Badge variant="outline">N/A</Badge>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button asChild>
              <Link href={`/admin/inspections/${inspection.inspectionId}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </Button>
            <Button variant="outline" onClick={() => setArchiveDialogOpen(true)}>
              <Archive className="mr-2 h-4 w-4" />
              Archive
            </Button>
            <Button variant="outline" onClick={handleGenerateReport} disabled={!isCompleted}>
              <FileText className="mr-2 h-4 w-4" />
              Generate Report
            </Button>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Client Information */}
          <Card>
            <CardHeader>
              <CardTitle>Client Information</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col h-full">
              <div className="flex items-start gap-3 flex-1">
                <User className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
                {/* teamMembers is now defined at the top of the component */}
                <p className="font-medium">{inspection.client}</p>
              </div>
              <div className="pt-4 border-t mt-4">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/admin/clients/${inspection.clientId}`}>View Client Profile</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Inspector Information */}
          <Card>
            <CardHeader>
              <CardTitle>Inspector</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col h-full">
              <div className="flex items-start gap-3 flex-1">
                <User className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
                <div className="flex-1">
                  <p className="font-medium">{inspection.inspector}</p>
                </div>
              </div>
              <div className="pt-4 border-t mt-4">
                <Button variant="outline" size="sm" asChild>
                  <Link
                    href={`/admin/team/${encodeURIComponent(
                      inspection.inspector.replace(/ .*/, "").toLowerCase() === "mike"
                        ? "1000000002"
                        : inspection.inspector.replace(/ .*/, "").toLowerCase() === "james"
                        ? "1000000003"
                        : ""
                    )}`}
                  >
                    View Team Member
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Property Details */}
          <Card>
            <CardHeader>
              <CardTitle>Property Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{inspection.address}</span>
              </div>
              {inspection.sqft && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Sqft:</span>
                  <span>{inspection.sqft}</span>
                </div>
              )}
              {inspection.yearBuilt && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Year Built:</span>
                  <span>{inspection.yearBuilt}</span>
                </div>
              )}
              {inspection.propertyType && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Type:</span>
                  <span>{inspection.propertyType}</span>
                </div>
              )}
              {inspection.bedrooms && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Bedrooms:</span>
                  <span>{inspection.bedrooms}</span>
                </div>
              )}
              {inspection.bathrooms && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Bathrooms:</span>
                  <span>{inspection.bathrooms}</span>
                </div>
              )}
              {inspection.stories && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Stories:</span>
                  <span>{inspection.stories}</span>
                </div>
              )}
              {inspection.foundation && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Foundation:</span>
                  <span>{inspection.foundation}</span>
                </div>
              )}
              {inspection.garage && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Garage:</span>
                  {(() => {
                    const member = teamMembers.find((m: TeamMember) => m.name === inspection.inspector);
                    return <Link href={member ? `/admin/team/${member.teamMemberId}` : "#"}>View Team Member</Link>;
                  })()}
                  <span>{inspection.garage}</span>
                </div>
              )}
              {inspection.pool !== undefined && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Pool:</span>
                  <span>{inspection.pool ? "Yes" : "No"}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Inspection Details */}
          <Card>
            <CardHeader>
              <CardTitle>Inspection Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>
                  {inspection.date} at {inspection.time}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-muted-foreground" />
                <span>Services:</span>
                {Array.isArray(inspection.types) && inspection.types.length > 0 && services.length > 0 ? (
                  inspection.types.map((typeId) => {
                    const service = services.find((s) => s.serviceId === typeId);
                    return service ? (
                      <Badge key={typeId} variant="outline" className="ml-1 first:ml-0">
                        {service.name}
                        {service.isPackage && <span className="ml-1 text-xs text-muted-foreground">(Package)</span>}
                      </Badge>
                    ) : null;
                  })
                ) : (
                  <Badge variant="outline">N/A</Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Status:</span>
                {getStatusBadge(inspection.status)}
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                <span className="font-medium text-lg">{inspection.price}</span>
              </div>
              {inspection.notes && (
                <div className="pt-2">
                  <span className="text-sm text-muted-foreground">Notes:</span>
                  <div className="mt-1">{inspection.notes}</div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Archive Confirmation Dialog */}
        <AlertDialog open={archiveDialogOpen} onOpenChange={setArchiveDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Archive Inspection?</AlertDialogTitle>
              <AlertDialogDescription>
                This will archive inspection {inspection.inspectionId}. Archived inspections can be restored later. This action does not permanently delete the
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
