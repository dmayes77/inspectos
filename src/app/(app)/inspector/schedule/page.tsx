"use client";

import { useState, useMemo } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { OfflineBanner } from "@/components/ui/offline-banner";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  User,
  Plus,
  Calendar as CalendarIcon,
} from "lucide-react";
import Link from "next/link";
import { mockInspections, mockInspector } from "@/lib/mock-data";
import { impactLight } from "@/services/haptics";
import { cn } from "@/lib/utils";

// Get array of dates for the week view (3 days before, today, 3 days after)
function getWeekDates(centerDate: Date): Date[] {
  const dates: Date[] = [];
  for (let i = -3; i <= 3; i++) {
    const date = new Date(centerDate);
    date.setDate(date.getDate() + i);
    dates.push(date);
  }
  return dates;
}

function formatTime(date: Date) {
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatDayName(date: Date, short = false) {
  return date.toLocaleDateString("en-US", {
    weekday: short ? "short" : "long",
  });
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear()
  );
}

function formatDayLabel(date: Date) {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
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

export default function SchedulePage() {
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [weekCenter, setWeekCenter] = useState<Date>(today);

  const weekDates = useMemo(() => getWeekDates(weekCenter), [weekCenter]);

  // Get inspections for the selected date
  const selectedDateInspections = useMemo(() => {
    return mockInspections
      .filter((insp) => {
        const inspDate = new Date(insp.scheduledAt);
        return (
          inspDate.getDate() === selectedDate.getDate() &&
          inspDate.getMonth() === selectedDate.getMonth() &&
          inspDate.getFullYear() === selectedDate.getFullYear()
        );
      })
      .sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime());
  }, [selectedDate]);

  // Get inspection counts per day for the week
  const inspectionCountsByDate = useMemo(() => {
    const counts: Record<string, number> = {};
    mockInspections.forEach((insp) => {
      const dateKey = new Date(insp.scheduledAt).toDateString();
      counts[dateKey] = (counts[dateKey] || 0) + 1;
    });
    return counts;
  }, []);

  const agendaSections = useMemo(() => {
    const now = new Date();
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    end.setHours(23, 59, 59, 999);

    const inRange = mockInspections.filter((insp) => {
      const date = new Date(insp.scheduledAt);
      return date >= start && date <= end;
    });

    const todayList = inRange.filter((insp) => isSameDay(insp.scheduledAt, start));
    const tomorrow = new Date(start);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowList = inRange.filter((insp) => isSameDay(insp.scheduledAt, tomorrow));
    const restList = inRange.filter(
      (insp) => !isSameDay(insp.scheduledAt, start) && !isSameDay(insp.scheduledAt, tomorrow)
    );

    return {
      today: todayList.sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime()),
      tomorrow: tomorrowList.sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime()),
      upcoming: restList.sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime()),
    };
  }, []);

  const goToPrevWeek = () => {
    impactLight();
    const newCenter = new Date(weekCenter);
    newCenter.setDate(newCenter.getDate() - 7);
    setWeekCenter(newCenter);
  };

  const goToNextWeek = () => {
    impactLight();
    const newCenter = new Date(weekCenter);
    newCenter.setDate(newCenter.getDate() + 7);
    setWeekCenter(newCenter);
  };

  const selectDate = (date: Date) => {
    impactLight();
    setSelectedDate(date);
  };

  const isToday = (date: Date) => {
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date: Date) => {
    return date.toDateString() === selectedDate.toDateString();
  };

  const formatSelectedDateHeader = () => {
    return selectedDate.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <AppShell
      title="Schedule"
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
      <div className="p-4 sm:p-6 max-w-5xl mx-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {/* Agenda View */}
        <div className="space-y-6">
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Today</h2>
              </div>
              <Badge variant="outline" className="text-xs">
                {agendaSections.today.length} {agendaSections.today.length === 1 ? "job" : "jobs"}
              </Badge>
            </div>
            {agendaSections.today.length === 0 ? (
              <Card>
                <CardContent className="p-4 text-sm text-muted-foreground">
                  You&apos;re free today.
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {agendaSections.today.map((job, index) => (
                  <Link
                    key={job.id}
                    href={`/inspector/jobs/${job.id}`}
                    onClick={() => impactLight()}
                    className="block"
                  >
                    <Card className="transition-all hover:shadow-md hover:border-primary/50">
                      <CardContent className="p-4">
                        <div className="flex flex-col gap-3">
                          <div className="flex items-center justify-between">
                            <span className="text-base font-semibold text-primary">{formatTime(job.scheduledAt)}</span>
                            <div className="flex items-center gap-2">
                              {index === 0 && <Badge variant="outline" className="border-primary text-primary">Next</Badge>}
                              {getStatusBadge(job.status)}
                            </div>
                          </div>
                          <div>
                            <p className="font-medium">
                              {job.property.address}, {job.property.city}
                            </p>
                            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
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
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Tomorrow</h2>
              </div>
              <Badge variant="outline" className="text-xs">
                {agendaSections.tomorrow.length} {agendaSections.tomorrow.length === 1 ? "job" : "jobs"}
              </Badge>
            </div>
            {agendaSections.tomorrow.length === 0 ? (
              <Card>
                <CardContent className="p-4 text-sm text-muted-foreground">No inspections scheduled.</CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {agendaSections.tomorrow.map((job) => (
                  <Link
                    key={job.id}
                    href={`/inspector/jobs/${job.id}`}
                    onClick={() => impactLight()}
                    className="block"
                  >
                    <Card className="transition-all hover:shadow-md hover:border-primary/50">
                      <CardContent className="p-4">
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center justify-between">
                            <span className="text-base font-semibold text-primary">{formatTime(job.scheduledAt)}</span>
                            {getStatusBadge(job.status)}
                          </div>
                          <p className="font-medium">
                            {job.property.address}, {job.property.city}
                          </p>
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
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Next 7 Days</h2>
              </div>
              <Badge variant="outline" className="text-xs">
                {agendaSections.upcoming.length} {agendaSections.upcoming.length === 1 ? "job" : "jobs"}
              </Badge>
            </div>
            {agendaSections.upcoming.length === 0 ? (
              <Card>
                <CardContent className="p-4 text-sm text-muted-foreground">No inspections scheduled.</CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {agendaSections.upcoming.map((job) => (
                  <Link
                    key={job.id}
                    href={`/inspector/jobs/${job.id}`}
                    onClick={() => impactLight()}
                    className="block"
                  >
                    <Card className="transition-all hover:shadow-md hover:border-primary/50">
                      <CardContent className="p-4">
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">{formatDayLabel(job.scheduledAt)}</span>
                            <span className="text-sm font-medium text-primary">{formatTime(job.scheduledAt)}</span>
                          </div>
                          <p className="font-medium">
                            {job.property.address}, {job.property.city}
                          </p>
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
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </AppShell>
  );
}
