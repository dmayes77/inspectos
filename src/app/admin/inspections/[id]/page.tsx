"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AdminShell } from "@/components/layout/admin-shell";
import { AdminPageHeader } from "@/components/layout/admin-page-header";
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

function formatInspectionDateTime(date: string, time: string) {
  const [year, month, day] = date.split("-").map(Number);
  const twelveHourMatch = time.match(/^(\d{1,2}):(\d{2})\s?(AM|PM)$/i);
  const twentyFourHourMatch = time.match(/^([01]?\d|2[0-3]):([0-5]\d)$/);
  if (!year || !month || !day || (!twelveHourMatch && !twentyFourHourMatch)) {
    return `${date} at ${time}`;
  }

  let hours = 0;
  let minutes = 0;
  if (twelveHourMatch) {
    hours = Number(twelveHourMatch[1]);
    minutes = Number(twelveHourMatch[2]);
    const period = twelveHourMatch[3].toUpperCase();

    if (period === "PM" && hours < 12) {
      hours += 12;
    }
    if (period === "AM" && hours === 12) {
      hours = 0;
    }
  } else if (twentyFourHourMatch) {
    hours = Number(twentyFourHourMatch[1]);
    minutes = Number(twentyFourHourMatch[2]);
  }

  const dateTime = new Date(year, month - 1, day, hours, minutes);
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(dateTime);
}

export default function InspectionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const { id } = params as { id: string };
  // Use the same in-memory array as the edit page
  const inspection = inspections.find((i) => i.inspectionId === id);
  const { data: services = [] as Service[] } = useServices();

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
  const formattedDateTime = formatInspectionDateTime(inspection.date, inspection.time);

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

        <AdminPageHeader
          title={
            <div className="flex flex-col gap-3 text-center sm:text-left">
              <div className="flex items-start justify-center gap-2 text-base sm:justify-start sm:text-lg">
                <MapPin className="mt-1 h-5 w-5 shrink-0 text-muted-foreground" />
                <div className="text-center sm:text-left">
                  <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{parts[0]}</h1>
                  <div className="text-sm text-muted-foreground sm:text-base">{parts[1]}</div>
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2 text-sm sm:justify-start">
                <Badge variant="outline">{inspection.inspectionId}</Badge>
                {getStatusBadge(inspection.status)}
              </div>
              <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground sm:flex-row sm:items-center sm:gap-4">
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {formattedDateTime}
                </span>
                <div className="flex flex-wrap items-center justify-center gap-1 sm:justify-start">
                  <ClipboardList className="h-4 w-4" />
                  {inspection.types && inspection.types.length > 0 ? (
                    inspection.types.map((type) => (
                      <Badge key={type} variant="outline">
                        {type}
                      </Badge>
                    ))
                  ) : (
                    <Badge variant="outline">N/A</Badge>
                  )}
                </div>
              </div>
            </div>
          }
          actions={
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
              <Button asChild className="w-full sm:w-auto">
                <Link href={`/admin/inspections/${inspection.inspectionId}/edit`}>
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
                  <p className="font-medium">{inspection.client}</p>
                </div>
              </div>
              <div className="pt-4 border-t">
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
            <CardContent className="flex flex-col gap-4">
              <div className="flex items-start gap-3">
                <User className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Inspector</p>
                  <p className="font-medium">{inspection.inspector}</p>
                </div>
              </div>
              <div className="pt-4 border-t">
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
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <MapPin className="mt-1 h-4 w-4 text-muted-foreground" />
                <span>{inspection.address}</span>
              </div>
              {inspection.sqft ? (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Sqft</span>
                  <span>{inspection.sqft}</span>
                </div>
              ) : null}
              {inspection.yearBuilt ? (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Year Built</span>
                  <span>{inspection.yearBuilt}</span>
                </div>
              ) : null}
              {inspection.propertyType ? (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Type</span>
                  <span>{inspection.propertyType}</span>
                </div>
              ) : null}
              {inspection.bedrooms ? (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Bedrooms</span>
                  <span>{inspection.bedrooms}</span>
                </div>
              ) : null}
              {inspection.bathrooms ? (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Bathrooms</span>
                  <span>{inspection.bathrooms}</span>
                </div>
              ) : null}
              {inspection.stories ? (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Stories</span>
                  <span>{inspection.stories}</span>
                </div>
              ) : null}
              {inspection.foundation ? (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Foundation</span>
                  <span>{inspection.foundation}</span>
                </div>
              ) : null}
              {inspection.garage ? (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Garage</span>
                  <span>{inspection.garage}</span>
                </div>
              ) : null}
              {inspection.pool !== undefined ? (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Pool</span>
                  <span>{inspection.pool ? "Yes" : "No"}</span>
                </div>
              ) : null}
            </CardContent>
          </Card>

          {/* Inspection Details */}
          <Card>
            <CardHeader>
              <CardTitle>Inspection Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <ClipboardList className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Services</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {Array.isArray(inspection.types) && inspection.types.length > 0 && services.length > 0 ? (
                    inspection.types.map((typeId) => {
                      const service = services.find((s) => s.serviceId === typeId);
                      return service ? (
                        <Badge key={typeId} variant="outline">
                          {service.name}
                          {service.isPackage ? <span className="ml-1 text-xs text-muted-foreground">(Package)</span> : null}
                        </Badge>
                      ) : null;
                    })
                  ) : (
                    <Badge variant="outline">N/A</Badge>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Status</span>
                {getStatusBadge(inspection.status)}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Price</span>
                <span className="font-medium text-base">{inspection.price}</span>
              </div>
              {inspection.notes ? (
                <div className="space-y-1 pt-2">
                  <span className="text-muted-foreground">Notes</span>
                  <div>{inspection.notes}</div>
                </div>
              ) : null}
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
