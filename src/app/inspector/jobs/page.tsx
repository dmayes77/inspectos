"use client";

import { InspectorShell } from "@/components/layout/inspector-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Clock,
  User,
  ChevronRight,
  Camera,
  CheckCircle,
  Plus,
} from "lucide-react";
import Link from "next/link";
import { mockInspections, mockInspector } from "@/lib/mock-data";
import { impactLight } from "@/services/haptics";

function formatTime(date: Date) {
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function getStatusBadge(status: string) {
  switch (status) {
    case "scheduled":
      return <Badge variant="secondary">Scheduled</Badge>;
    case "in_progress":
      return <Badge className="bg-amber-500">In Progress</Badge>;
    case "completed":
      return <Badge className="bg-green-500">Completed</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export default function JobsPage() {
  const today = new Date();
  const todayJobs = mockInspections.filter((job) => {
    return job.scheduledAt.toDateString() === today.toDateString();
  });

  const completedToday = todayJobs.filter(j => j.status === "completed").length;
  const totalToday = todayJobs.length;

  return (
    <InspectorShell
      title="Jobs"
      user={mockInspector}
      headerActions={
        <Button size="sm" asChild>
          <Link href="/inspector/jobs/new">
            <Plus className="mr-2 h-4 w-4" />
            New
          </Link>
        </Button>
      }
    >
      <div className="p-6 max-w-5xl">
        {/* Stats Summary */}
        <div className="mb-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-3xl font-semibold">{totalToday}</p>
                <p className="text-sm text-muted-foreground">Jobs Today</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10">
                <CheckCircle className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-3xl font-semibold">
                  {completedToday}/{totalToday}
                </p>
                <p className="text-sm text-muted-foreground">Completed</p>
              </div>
            </CardContent>
          </Card>
          {mockInspections.length > 0 && (
            <Card className="col-span-2 bg-primary text-primary-foreground">
              <CardContent className="flex items-center justify-between p-5">
                <div>
                  <p className="text-sm font-medium opacity-90">Next Inspection</p>
                  <p className="text-lg font-semibold">{mockInspections[0].property.address}</p>
                  <p className="text-sm opacity-90">{formatTime(mockInspections[0].scheduledAt)}</p>
                </div>
                <Button
                  size="lg"
                  variant="secondary"
                  className="h-12 px-6"
                  asChild
                  onClick={() => impactLight()}
                >
                  <Link href={`/inspector/jobs/${mockInspections[0].id}`}>
                    <Camera className="mr-2 h-5 w-5" />
                    Start
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Job List */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">All Inspections</h2>

          {mockInspections.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                  <Camera className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-xl font-medium">No jobs scheduled</p>
                <p className="text-muted-foreground mb-4">
                  You&apos;re all caught up!
                </p>
                <Button asChild>
                  <Link href="/inspector/jobs/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Schedule Inspection
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3">
              {mockInspections.map((job, index) => (
                <Link
                  key={job.id}
                  href={`/inspector/jobs/${job.id}`}
                  onClick={() => impactLight()}
                >
                  <Card className="transition-all hover:shadow-md hover:border-primary/50">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        {/* Time */}
                        <div className="text-center shrink-0 w-20">
                          <p className="text-lg font-semibold text-primary whitespace-nowrap">
                            {formatTime(job.scheduledAt)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            ~{job.estimatedDuration}h
                          </p>
                        </div>

                        {/* Divider */}
                        <div className="h-10 w-px bg-border shrink-0" />

                        {/* Details */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-mono text-sm text-primary">
                              #{job.id.replace("insp_", "")}
                            </span>
                            <span className="font-medium truncate">
                              {job.property.address}, {job.property.city}, {job.property.state} {job.property.zipCode}
                            </span>
                            {index === 0 && (
                              <Badge variant="outline" className="border-primary text-primary shrink-0">
                                Next
                              </Badge>
                            )}
                            {getStatusBadge(job.status)}
                          </div>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <User className="h-3.5 w-3.5" />
                              {job.client.name}
                            </span>
                            <span>{job.property.sqft.toLocaleString()} sqft</span>
                            <Badge variant="secondary" className="text-xs">
                              {job.services[0]?.name || "Inspection"}
                            </Badge>
                          </div>
                        </div>

                        {/* Chevron */}
                        <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </InspectorShell>
  );
}
