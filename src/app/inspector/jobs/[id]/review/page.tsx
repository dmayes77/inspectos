"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { InspectorShell } from "@/components/layout/inspector-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle,
  AlertTriangle,
  AlertOctagon,
  Info,
  Wrench,
  Camera,
  FileText,
  Send,
  ChevronDown,
  ChevronUp,
  Home,
  Clock,
  User,
} from "lucide-react";
import {
  getInspectionById,
  getRoomsForInspection,
  mockInspector,
  sampleDefects,
  DefectSeverity,
} from "@/lib/mock-data";
import { impactLight, impactMedium, notificationSuccess } from "@/services/haptics";
import { cn } from "@/lib/utils";

// Mock defects for demonstration
const mockDefectsForReview = [
  { ...sampleDefects[0], id: "def_1", itemId: "item_1", roomId: "room_1", roomName: "Electrical Panel", photos: [] },
  { ...sampleDefects[1], id: "def_2", itemId: "item_2", roomId: "room_2", roomName: "Kitchen", photos: [] },
  { ...sampleDefects[2], id: "def_3", itemId: "item_3", roomId: "room_3", roomName: "Master Bedroom", photos: [] },
  { ...sampleDefects[3], id: "def_4", itemId: "item_4", roomId: "room_4", roomName: "HVAC System", photos: [] },
  { ...sampleDefects[4], id: "def_5", itemId: "item_5", roomId: "room_5", roomName: "Bathroom 2", photos: [] },
  { ...sampleDefects[5], id: "def_6", itemId: "item_6", roomId: "room_6", roomName: "Master Bathroom", photos: [] },
];

type DefectWithRoom = typeof mockDefectsForReview[0];

function getSeverityIcon(severity: DefectSeverity) {
  switch (severity) {
    case "safety":
      return <AlertOctagon className="h-5 w-5 text-red-600" />;
    case "major":
      return <AlertTriangle className="h-5 w-5 text-orange-500" />;
    case "minor":
      return <Info className="h-5 w-5 text-amber-500" />;
    case "maintenance":
      return <Wrench className="h-5 w-5 text-blue-500" />;
  }
}

function getSeverityBadge(severity: DefectSeverity) {
  const styles: Record<DefectSeverity, string> = {
    safety: "bg-red-100 text-red-700 border-red-300",
    major: "bg-orange-100 text-orange-700 border-orange-300",
    minor: "bg-amber-100 text-amber-700 border-amber-300",
    maintenance: "bg-blue-100 text-blue-700 border-blue-300",
  };
  const labels: Record<DefectSeverity, string> = {
    safety: "Safety",
    major: "Major",
    minor: "Minor",
    maintenance: "Maintenance",
  };
  return (
    <Badge variant="outline" className={cn("capitalize", styles[severity])}>
      {labels[severity]}
    </Badge>
  );
}

export default function ReviewPage() {
  const params = useParams();
  const router = useRouter();
  const inspectionId = params.id as string;

  const inspection = getInspectionById(inspectionId);
  const rooms = getRoomsForInspection(inspectionId);

  const [summaryNotes, setSummaryNotes] = useState("");
  const [expandedDefects, setExpandedDefects] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!inspection) {
    return (
      <InspectorShell title="Not Found" user={mockInspector} showBackButton onBack={() => router.back()}>
        <div className="flex flex-col items-center justify-center p-12">
          <p className="text-lg font-medium">Inspection not found</p>
          <Button variant="outline" className="mt-4" onClick={() => router.back()}>
            Go Back
          </Button>
        </div>
      </InspectorShell>
    );
  }

  // Calculate statistics
  const totalRooms = rooms.length;
  const completedRooms = rooms.filter(r => r.status === "completed").length;
  const totalItems = rooms.reduce((sum, r) => sum + r.itemsTotal, 0);
  const completedItems = rooms.reduce((sum, r) => sum + r.itemsCompleted, 0);
  const totalPhotos = rooms.reduce((sum, r) => sum + r.photosCount, 0);
  const progressPercent = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  // Group defects by severity
  const defectsBySeverity = mockDefectsForReview.reduce((acc, defect) => {
    if (!acc[defect.severity]) acc[defect.severity] = [];
    acc[defect.severity].push(defect);
    return acc;
  }, {} as Record<DefectSeverity, DefectWithRoom[]>);

  const severityOrder: DefectSeverity[] = ["safety", "major", "minor", "maintenance"];
  const totalDefects = mockDefectsForReview.length;
  const safetyDefects = defectsBySeverity.safety?.length || 0;
  const majorDefects = defectsBySeverity.major?.length || 0;

  const toggleDefect = (defectId: string) => {
    impactLight();
    setExpandedDefects(prev => {
      const next = new Set(prev);
      if (next.has(defectId)) {
        next.delete(defectId);
      } else {
        next.add(defectId);
      }
      return next;
    });
  };

  const handleCompleteInspection = async () => {
    impactMedium();
    setIsSubmitting(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    notificationSuccess();
    setIsSubmitting(false);

    // Navigate back to job details
    router.push(`/jobs/${inspectionId}`);
  };

  return (
    <InspectorShell
      title="Review Inspection"
      user={mockInspector}
      showBackButton
      onBack={() => router.push(`/jobs/${inspectionId}/rooms`)}
    >
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        {/* Property Header */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-start gap-4">
              <div className="shrink-0 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Home className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold">{inspection.property.address}</h2>
                <p className="text-sm text-muted-foreground">
                  {inspection.property.city}, {inspection.property.state} {inspection.property.zipCode}
                </p>
                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    {inspection.client.name}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {inspection.estimatedDuration} hrs
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Progress Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Inspection Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">{progressPercent}%</span>
              <span className="text-sm text-muted-foreground">
                {completedItems} of {totalItems} items
              </span>
            </div>
            <Progress value={progressPercent} className="h-3" />

            <div className="grid grid-cols-3 gap-4 pt-2">
              <div className="text-center">
                <p className="text-2xl font-semibold">{completedRooms}/{totalRooms}</p>
                <p className="text-sm text-muted-foreground">Rooms</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-semibold">{totalPhotos}</p>
                <p className="text-sm text-muted-foreground">Photos</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-semibold">{totalDefects}</p>
                <p className="text-sm text-muted-foreground">Defects</p>
              </div>
            </div>

            {progressPercent < 100 && (
              <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800">
                <AlertTriangle className="h-5 w-5 shrink-0" />
                <p className="text-sm">
                  Some items are not yet inspected. Review incomplete rooms before finalizing.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Defects Summary */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Defects Found</CardTitle>
              <div className="flex items-center gap-2">
                {safetyDefects > 0 && (
                  <Badge variant="destructive">{safetyDefects} Safety</Badge>
                )}
                {majorDefects > 0 && (
                  <Badge className="bg-orange-500">{majorDefects} Major</Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {totalDefects === 0 ? (
              <div className="p-6 text-center text-muted-foreground">
                <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
                <p>No defects recorded</p>
              </div>
            ) : (
              <div className="divide-y">
                {severityOrder.map(severity => {
                  const defects = defectsBySeverity[severity];
                  if (!defects || defects.length === 0) return null;

                  return (
                    <div key={severity}>
                      {defects.map(defect => {
                        const isExpanded = expandedDefects.has(defect.id);
                        return (
                          <div key={defect.id} className="border-b last:border-b-0">
                            <button
                              className="w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors text-left"
                              onClick={() => toggleDefect(defect.id)}
                            >
                              {getSeverityIcon(defect.severity)}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="font-medium">{defect.title}</p>
                                  {getSeverityBadge(defect.severity)}
                                </div>
                                <p className="text-sm text-muted-foreground">{defect.roomName}</p>
                              </div>
                              {isExpanded ? (
                                <ChevronUp className="h-5 w-5 text-muted-foreground" />
                              ) : (
                                <ChevronDown className="h-5 w-5 text-muted-foreground" />
                              )}
                            </button>
                            {isExpanded && (
                              <div className="px-4 pb-4 pl-12 space-y-2">
                                <p className="text-sm">{defect.description}</p>
                                {defect.recommendation && (
                                  <div className="p-3 bg-muted rounded-lg">
                                    <p className="text-sm font-medium">Recommendation</p>
                                    <p className="text-sm text-muted-foreground">{defect.recommendation}</p>
                                  </div>
                                )}
                                {defect.estimatedCost && (
                                  <p className="text-sm">
                                    <span className="text-muted-foreground">Est. repair cost: </span>
                                    <span className="font-medium">${defect.estimatedCost}</span>
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Summary Notes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Inspector Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Add any additional notes or overall observations about this inspection..."
              value={summaryNotes}
              onChange={(e) => setSummaryNotes(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="sticky bottom-0 pt-4 pb-6 bg-gradient-to-t from-background via-background to-transparent">
          <div className="space-y-3">
            <Button
              size="lg"
              className="w-full h-14 text-lg"
              onClick={handleCompleteInspection}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>Processing...</>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-5 w-5" />
                  Complete Inspection
                </>
              )}
            </Button>

            <div className="flex gap-3">
              <Button
                variant="outline"
                size="lg"
                className="flex-1 h-12"
                onClick={() => {
                  impactLight();
                  router.push(`/jobs/${inspectionId}/rooms`);
                }}
              >
                <FileText className="mr-2 h-4 w-4" />
                Continue Editing
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="flex-1 h-12"
                onClick={() => {
                  impactLight();
                  // TODO: Implement preview
                }}
              >
                <Camera className="mr-2 h-4 w-4" />
                Preview Report
              </Button>
            </div>
          </div>
        </div>
      </div>
    </InspectorShell>
  );
}
