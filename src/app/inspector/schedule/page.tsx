"use client";

import { useState, useMemo } from "react";
import { AppShell } from "@/components/layout/app-shell";
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
      <div className="p-6 max-w-5xl mx-auto">
        {/* Week Navigation */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Button
              variant="outline"
              size="icon"
              onClick={goToPrevWeek}
              className="shrink-0"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>

            {/* Week Days Strip */}
            <div className="flex-1">
              <div className="flex gap-2">
                {weekDates.map((date, index) => {
                  const dateKey = date.toDateString();
                  const count = inspectionCountsByDate[dateKey] || 0;
                  const isTodayDate = isToday(date);
                  const isSelectedDate = isSelected(date);

                  return (
                    <button
                      key={index}
                      onClick={() => selectDate(date)}
                      className={cn(
                        "flex-1 flex flex-col items-center justify-center p-3 rounded-lg transition-all",
                        isSelectedDate
                          ? "bg-primary text-primary-foreground shadow-lg scale-105"
                          : isTodayDate
                            ? "bg-primary/10 text-primary font-semibold border-2 border-primary"
                            : "bg-card border hover:bg-muted hover:border-primary/50"
                      )}
                    >
                      <span className="text-xs font-medium mb-1">
                        {formatDayName(date, true)}
                      </span>
                      <span
                        className={cn(
                          "text-2xl font-bold mb-1",
                          isSelectedDate
                            ? "text-primary-foreground"
                            : isTodayDate
                              ? "text-primary"
                              : "text-foreground"
                        )}
                      >
                        {date.getDate()}
                      </span>
                      {count > 0 && (
                        <Badge
                          variant={isSelectedDate ? "secondary" : "outline"}
                          className={cn(
                            "text-xs px-2 h-5",
                            isSelectedDate && "bg-primary-foreground/20 text-primary-foreground"
                          )}
                        >
                          {count} {count === 1 ? "job" : "jobs"}
                        </Badge>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={goToNextWeek}
              className="shrink-0"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Selected Date Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-xl font-semibold">{formatSelectedDateHeader()}</h2>
          </div>
          {selectedDateInspections.length > 0 && (
            <Badge variant="outline" className="text-sm">
              {selectedDateInspections.length}{" "}
              {selectedDateInspections.length === 1 ? "Inspection" : "Inspections"}
            </Badge>
          )}
        </div>

        {/* Timeline/Agenda */}
        {selectedDateInspections.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <CalendarIcon className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-xl font-medium mb-1">No inspections scheduled</p>
              <p className="text-muted-foreground mb-4">
                {isToday(selectedDate) ? "You're free today!" : "This day is available"}
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
          <div className="space-y-4">
            {selectedDateInspections.map((job, index) => (
              <Link
                key={job.id}
                href={`/inspector/jobs/${job.id}`}
                onClick={() => impactLight()}
                className="block"
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
                            {job.property.address}, {job.property.city}, {job.property.state}{" "}
                            {job.property.zipCode}
                          </span>
                          {index === 0 && isToday(selectedDate) && (
                            <Badge
                              variant="outline"
                              className="border-primary text-primary shrink-0"
                            >
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
    </AppShell>
  );
}
