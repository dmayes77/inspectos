"use client";

import { useParams, useRouter } from "next/navigation";
import { InspectorShell } from "@/components/layout/inspector-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  User,
  Phone,
  Mail,
  Home,
  Calendar,
  FileText,
  Navigation,
  Play,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { getInspectionById, mockInspector } from "@/lib/mock-data";
import { impactLight } from "@/services/haptics";

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const inspection = getInspectionById(params.id as string);

  if (!inspection) {
    return (
      <InspectorShell title="Job Not Found" user={mockInspector} showBackButton onBack={() => router.back()}>
        <div className="flex flex-col items-center justify-center p-12">
          <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg font-medium">Inspection not found</p>
          <Button variant="outline" className="mt-4" onClick={() => router.push("/inspector/jobs")}>
            Back to Jobs
          </Button>
        </div>
      </InspectorShell>
    );
  }

  const { property, client, services, scheduledAt, estimatedDuration, status, totalPrice, depositPaid, notes } = inspection;

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const handleStartInspection = () => {
    impactLight();
    router.push(`/inspector/jobs/${inspection.id}/rooms`);
  };

  const handleGetDirections = () => {
    impactLight();
    const address = encodeURIComponent(`${property.address}, ${property.city}, ${property.state} ${property.zipCode}`);
    window.open(`https://maps.apple.com/?daddr=${address}`, "_blank");
  };

  return (
    <InspectorShell
      title={property.address}
      user={mockInspector}
      showBackButton
      onBack={() => router.back()}
    >
      <div className="p-6 max-w-4xl space-y-6">
        {/* Status Banner */}
        {status === "scheduled" && (
          <Card className="bg-primary text-primary-foreground">
            <CardContent className="flex items-center justify-between p-5">
              <div>
                <p className="text-sm font-medium opacity-90">Scheduled for</p>
                <p className="text-xl font-semibold">{formatTime(scheduledAt)}</p>
                <p className="text-sm opacity-90">{formatDate(scheduledAt)}</p>
              </div>
              <Button size="lg" variant="secondary" className="h-14 px-8 text-lg" onClick={handleStartInspection}>
                <Play className="mr-2 h-5 w-5" />
                Start Inspection
              </Button>
            </CardContent>
          </Card>
        )}

        {status === "in_progress" && (
          <Card className="bg-amber-500 text-white">
            <CardContent className="flex items-center justify-between p-5">
              <div>
                <p className="text-sm font-medium opacity-90">In Progress</p>
                <p className="text-lg font-semibold">Continue where you left off</p>
              </div>
              <Button size="lg" variant="secondary" className="h-14 px-8 text-lg" onClick={handleStartInspection}>
                <Play className="mr-2 h-5 w-5" />
                Continue
              </Button>
            </CardContent>
          </Card>
        )}

        {status === "completed" && (
          <Card className="bg-green-600 text-white">
            <CardContent className="flex items-center justify-between p-5">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-8 w-8" />
                <div>
                  <p className="text-lg font-semibold">Inspection Complete</p>
                  <p className="text-sm opacity-90">Report ready for delivery</p>
                </div>
              </div>
              <Button size="lg" variant="secondary" className="h-12 px-6" asChild>
                <Link href={`/inspector/jobs/${inspection.id}/review`}>
                  <FileText className="mr-2 h-5 w-5" />
                  View Report
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Property Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Home className="h-5 w-5 text-primary" />
                Property Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="font-semibold text-lg">{property.address}</p>
                <p className="text-muted-foreground">{property.city}, {property.state} {property.zipCode}</p>
              </div>

              <Button variant="outline" className="w-full h-12" onClick={handleGetDirections}>
                <Navigation className="mr-2 h-5 w-5" />
                Get Directions
              </Button>

              <Separator />

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Type</p>
                  <p className="font-medium capitalize">{property.propertyType.replace("_", " ")}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Year Built</p>
                  <p className="font-medium">{property.yearBuilt}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Square Feet</p>
                  <p className="font-medium">{property.sqft.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Stories</p>
                  <p className="font-medium">{property.stories}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Bedrooms</p>
                  <p className="font-medium">{property.bedrooms}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Bathrooms</p>
                  <p className="font-medium">{property.bathrooms}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Foundation</p>
                  <p className="font-medium capitalize">{property.foundation.replace("_", " ")}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Garage</p>
                  <p className="font-medium capitalize">{property.garage}</p>
                </div>
              </div>

              {property.pool && (
                <Badge variant="secondary">Pool/Spa</Badge>
              )}
            </CardContent>
          </Card>

          {/* Client Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="h-5 w-5 text-primary" />
                Client Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="font-semibold text-lg">{client.name}</p>
              </div>

              <div className="space-y-3">
                <a
                  href={`tel:${client.phone}`}
                  className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted transition-colors"
                  onClick={() => impactLight()}
                >
                  <Phone className="h-5 w-5 text-primary" />
                  <span>{client.phone}</span>
                </a>

                <a
                  href={`mailto:${client.email}`}
                  className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted transition-colors"
                  onClick={() => impactLight()}
                >
                  <Mail className="h-5 w-5 text-primary" />
                  <span>{client.email}</span>
                </a>
              </div>

              {notes && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Notes</p>
                    <p className="text-sm bg-muted p-3 rounded-lg">{notes}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Services */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5 text-primary" />
                Services
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {services.map((service) => (
                <div key={service.id} className="flex items-center justify-between py-2">
                  <span>{service.name}</span>
                  <span className="font-medium">${service.price}</span>
                </div>
              ))}
              <Separator />
              <div className="flex items-center justify-between py-2">
                <span className="font-medium">Total</span>
                <span className="text-lg font-semibold">${totalPrice}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Deposit Paid</span>
                <span>-${depositPaid}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Balance Due</span>
                <span className="font-medium text-primary">${totalPrice - depositPaid}</span>
              </div>
            </CardContent>
          </Card>

          {/* Schedule Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="h-5 w-5 text-primary" />
                Schedule
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-medium">{formatDate(scheduledAt)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Time</p>
                  <p className="font-medium">{formatTime(scheduledAt)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Est. Duration</p>
                  <p className="font-medium">{estimatedDuration} hours</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant={status === "completed" ? "default" : "secondary"} className="capitalize">
                    {status.replace("_", " ")}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </InspectorShell>
  );
}
