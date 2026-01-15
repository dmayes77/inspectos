"use client";

import { AppShell } from "@/components/layout/app-shell";
import { useState } from "react";
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
  const [statusFilter, setStatusFilter] = useState<"all" | "scheduled" | "in_progress" | "completed">("all");
  const today = new Date();
  const todayJobs = mockInspections.filter((job) => {
    return job.scheduledAt.toDateString() === today.toDateString();
  });

  const completedToday = todayJobs.filter(j => j.status === "completed").length;
  const totalToday = todayJobs.length;
  const filteredInspections = statusFilter === "all"
    ? mockInspections
    : mockInspections.filter((job) => job.status === statusFilter);

  return (
    <AppShell
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
      <div className="p-4 sm:p-6 max-w-5xl [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {/* Stats Summary */}
        <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{totalToday}</p>
                <p className="text-xs text-muted-foreground sm:text-sm">Jobs Today</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/10">
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-semibold">
                  {completedToday}/{totalToday}
                </p>
                <p className="text-xs text-muted-foreground sm:text-sm">Completed</p>
              </div>
            </CardContent>
          </Card>
          {mockInspections.length > 0 && (
            <Card className="col-span-2 bg-primary text-primary-foreground">
              <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium opacity-90">Next Inspection</p>
                  <p className="text-base font-semibold sm:text-lg">{mockInspections[0].property.address}</p>
                  <p className="text-sm opacity-90">{formatTime(mockInspections[0].scheduledAt)}</p>
                </div>
                <Button
                  size="lg"
                  variant="secondary"
                  className="h-11 w-full px-6 sm:w-auto"
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
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-semibold">All Inspections</h2>
            <div className="flex flex-wrap gap-2">
              {[
                { value: "all", label: "All" },
                { value: "scheduled", label: "Scheduled" },
                { value: "in_progress", label: "In Progress" },
                { value: "completed", label: "Completed" },
              ].map((option) => (
                <Button
                  key={option.value}
                  variant={statusFilter === option.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter(option.value as typeof statusFilter)}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>

          {filteredInspections.length === 0 ? (
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
              {filteredInspections.map((job, index) => (
                <Link
                  key={job.id}
                  href={`/inspector/jobs/${job.id}`}
                  onClick={() => impactLight()}
                >
                  <Card className="transition-all hover:shadow-md hover:border-primary/50">
                    <CardContent className="p-4">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                        {/* Time */}
                        <div className="text-left shrink-0 sm:w-24">
                          <p className="text-lg font-semibold text-primary whitespace-nowrap">
                            {formatTime(job.scheduledAt)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            ~{job.estimatedDuration}h
                          </p>
                        </div>

                        {/* Divider */}
                        <div className="h-px w-full bg-border shrink-0 sm:h-10 sm:w-px" />

                        {/* Details */}
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className="font-mono text-sm text-primary">
                              #{job.id.replace("insp_", "")}
                            </span>
                            <span className="font-medium truncate">
                              {job.property.address}, {job.property.city}, {job.property.state} {job.property.zipCode}
                            </span>
                            {statusFilter === "all" && index === 0 && (
                              <Badge variant="outline" className="border-primary text-primary shrink-0">
                                Next
                              </Badge>
                            )}
                            {getStatusBadge(job.status)}
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
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
                        <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0 self-end sm:self-auto" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
