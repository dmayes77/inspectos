"use client";

import { AdminPageHeader } from "@/components/layout/admin-page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { CalendarDays, Plus } from "lucide-react";
import { useSchedule } from "@/hooks/use-schedule";
import { Badge } from "@/components/ui/badge";
import { AdminPageSkeleton } from "@/components/layout/admin-page-skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { formatTime12 } from "@inspectos/shared/utils/dates";

export default function SchedulePage() {
  const { data: scheduleItems = [], isLoading, isError, error } = useSchedule();

  console.log('[SchedulePage] Hook data:', {
    isLoading,
    isError,
    error: error instanceof Error ? error.message : error,
    itemsCount: scheduleItems.length,
    firstItem: scheduleItems[0],
    rawData: scheduleItems
  });

  const initialDate = scheduleItems[0]?.date ?? new Date().toISOString().slice(0, 10);
  const [currentDate, setCurrentDate] = useState(() => new Date(`${initialDate}T00:00:00`));
  const [activeView, setActiveView] = useState<"month" | "week" | "day">("month");
  const inspectors = Array.from(
    new Map(scheduleItems.map((item) => [item.inspectorId, item.inspector])).entries()
  ).map(([inspectorId, inspector]) => ({ inspectorId, inspector }));
  const [activeInspector, setActiveInspector] = useState<string>("all");
  const visibleInspectors = inspectors.filter(
    (inspector) => activeInspector === "all" || inspector.inspectorId === activeInspector
  );
  const reference = new Date(currentDate);
  const dayOfWeek = reference.getDay();
  const mondayOffset = (dayOfWeek + 6) % 7;
  const weekStart = new Date(reference);
  weekStart.setDate(reference.getDate() - mondayOffset);
  const monthStart = new Date(reference.getFullYear(), reference.getMonth(), 1);
  const monthStartDay = (monthStart.getDay() + 6) % 7;
  const monthGridStart = new Date(monthStart);
  monthGridStart.setDate(monthStart.getDate() - monthStartDay);
  const monthDays = Array.from({ length: 42 }, (_, idx) => {
    const date = new Date(monthGridStart);
    date.setDate(monthGridStart.getDate() + idx);
    const dateKey = date.toISOString().slice(0, 10);
    return {
      date,
      dateKey,
      isCurrentMonth: date.getMonth() === reference.getMonth(),
      display: date.getDate(),
      items: scheduleItems.filter((item) => item.date === dateKey),
    };
  });
  const weekDays = Array.from({ length: 7 }, (_, idx) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + idx);
    const dateKey = date.toISOString().slice(0, 10);
    return {
      date,
      dateKey,
      label: date.toLocaleDateString("en-US", { weekday: "short" }),
      display: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      items: scheduleItems.filter((item) => item.date === dateKey),
    };
  });

  const dayKey = reference.toISOString().slice(0, 10);
  const dayItems = scheduleItems.filter((item) => item.date === dayKey);
  const hourSlots = Array.from({ length: 11 }, (_, idx) => 8 + idx);

  const getHourLabel = (hour: number) => formatTime12(`${String(hour).padStart(2, "0")}:00`);

  const getItemsForDay = (dateKey: string) =>
    scheduleItems.filter((item) => item.date === dateKey);

  const toMinutes = (time: string) => {
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m;
  };

  const dayStartMinutes = 8 * 60;
  const slotMinutes = 60;
  const slotHeight = 56;
  const defaultDurationMinutes = 90;
  const totalDayHeight = hourSlots.length * slotHeight;
  const inspectorColors = ["bg-orange-500", "bg-blue-500", "bg-emerald-500", "bg-purple-500"];
  const inspectorMap = new Map(
    inspectors.map((inspector, index) => [inspector.inspectorId, inspectorColors[index % inspectorColors.length]])
  );
  const dayGridTemplate = `80px repeat(${Math.max(visibleInspectors.length, 1)}, minmax(0, 1fr))`;

  const advance = (direction: "prev" | "next") => {
    const delta = direction === "next" ? 1 : -1;
    setCurrentDate((prev) => {
      const next = new Date(prev);
      if (activeView === "month") {
        next.setMonth(prev.getMonth() + delta);
      } else if (activeView === "week") {
        next.setDate(prev.getDate() + delta * 7);
      } else {
        next.setDate(prev.getDate() + delta);
      }
      return next;
    });
  };

  const headerLabel = () => {
    if (activeView === "month") {
      return reference.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    }
    if (activeView === "week") {
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      return `${weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${weekEnd.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
    }
    return reference.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
  };

  // Show loading skeleton while data is being fetched
  if (isLoading) {
    return <AdminPageSkeleton listItems={8} />;
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Schedule"
        description="Plan inspection routes, assign inspectors, and manage availability"
        actions={
          <Button className="sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            New Booking
          </Button>
        }
      />

      <Card>
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Calendar</CardTitle>
            <CardDescription>Google-style calendar with month, week, and day views.</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => advance("prev")}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="min-w-[160px] text-center text-sm font-medium">{headerLabel()}</div>
            <Button variant="outline" size="icon" onClick={() => advance("next")}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {scheduleItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-10 text-center">
              <CalendarDays className="h-10 w-10 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Calendar view coming next</p>
                <p className="text-xs text-muted-foreground">
                  This will show routes, travel time, and inspector availability.
                </p>
              </div>
            </div>
          ) : (
            <Tabs value={activeView} onValueChange={(value) => setActiveView(value as typeof activeView)} className="space-y-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <TabsList className="grid w-full grid-cols-3 md:w-[280px]">
                  <TabsTrigger value="month">Month</TabsTrigger>
                  <TabsTrigger value="week">Week</TabsTrigger>
                  <TabsTrigger value="day">Day</TabsTrigger>
                </TabsList>
                <div className="flex flex-wrap gap-2">
                  <Button
                   
                    variant={activeInspector === "all" ? "default" : "outline"}
                    onClick={() => setActiveInspector("all")}
                  >
                    All inspectors
                  </Button>
                  {inspectors.map((inspector) => (
                    <Button
                      key={inspector.inspectorId}
                     
                      variant={activeInspector === inspector.inspectorId ? "default" : "outline"}
                      onClick={() => setActiveInspector(inspector.inspectorId)}
                    >
                      {inspector.inspector}
                    </Button>
                  ))}
                </div>
              </div>

              <TabsContent value="month">
                <div className="overflow-x-auto">
                  <div className="min-w-[900px]">
                    <div className="grid grid-cols-7 gap-2">
                      {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((label) => (
                        <div key={label} className="text-xs font-semibold text-muted-foreground px-2">
                          {label}
                        </div>
                      ))}
                      {monthDays.map((day) => (
                        <div
                          key={day.dateKey}
                          className={`min-h-[110px] rounded-lg border p-2 text-xs ${
                            day.isCurrentMonth ? "bg-background" : "bg-muted/30 text-muted-foreground"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold">{day.display}</span>
                            {day.items.length > 0 && (
                              <Badge variant="secondary" className="text-[10px]">
                                {day.items.length}
                              </Badge>
                            )}
                          </div>
                          <div className="mt-2 space-y-1">
                            {day.items
                              .filter((item) => activeInspector === "all" || item.inspectorId === activeInspector)
                              .slice(0, 3)
                              .map((item) => (
                                <div key={item.id} className="flex items-center gap-2 truncate rounded bg-muted px-2 py-1">
                                  <span
                                    className={`h-2 w-2 rounded-full ${inspectorMap.get(item.inspectorId) ?? "bg-slate-400"}`}
                                  />
                                  <span className="truncate">{formatTime12(item.time)} · {item.type}</span>
                                </div>
                              ))}
                            {day.items.length > 3 && (
                              <div className="text-[10px] text-muted-foreground">
                                +{day.items.length - 3} more
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="week">
                <div className="overflow-x-auto">
                  <div className="min-w-[1100px]">
                    <div className={`grid grid-cols-[80px_repeat(7,1fr)] rounded-lg border overflow-hidden`}>
                      <div className="bg-muted/30 p-2 text-xs font-semibold text-muted-foreground" />
                      {weekDays.map((day) => (
                        <div key={day.dateKey} className="bg-muted/30 p-2 text-xs font-semibold text-muted-foreground">
                          {day.label} · {day.display}
                        </div>
                      ))}
                      <div className="border-t">
                        <div className="relative" style={{ height: hourSlots.length * slotHeight }}>
                          {hourSlots.map((hour, idx) => (
                            <div
                              key={hour}
                              className="absolute left-0 right-0 border-t px-2 text-[11px] text-muted-foreground"
                              style={{ top: idx * slotHeight }}
                            >
                              <span className="relative -top-2 bg-background pr-2">
                                {getHourLabel(hour)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                      {weekDays.map((day) => (
                        <div key={day.dateKey} className="border-t border-l bg-background">
                          <div className="relative" style={{ height: hourSlots.length * slotHeight }}>
                            {hourSlots.map((_, idx) => (
                              <div
                                key={`${day.dateKey}-grid-${idx}`}
                                className="absolute left-0 right-0 border-t"
                                style={{ top: idx * slotHeight }}
                              />
                            ))}
                            {getItemsForDay(day.dateKey)
                              .filter((item) => activeInspector === "all" || item.inspectorId === activeInspector)
                              .map((item) => {
                              const start = toMinutes(item.time);
                              const top = ((start - dayStartMinutes) / slotMinutes) * slotHeight;
                              const height = ((item.durationMinutes || defaultDurationMinutes) / slotMinutes) * slotHeight;
                              const color = inspectorMap.get(item.inspectorId) ?? "bg-slate-400";
                              return (
                                <Link
                                  key={item.id}
                                  href={`/admin/inspections/${item.id}`}
                                  className="absolute left-2 right-2 rounded-md border border-primary/30 bg-primary/10 px-2 py-1 text-[11px] shadow-sm transition hover:bg-primary/15"
                                  style={{ top, height }}
                                >
                                  <div className="flex items-center gap-2">
                                    <span className={`h-2 w-2 rounded-full ${color}`} />
                                  <p className="font-semibold text-primary">{formatTime12(item.time)}</p>
                                  </div>
                                  <p className="text-muted-foreground">{item.type}</p>
                                  <p className="truncate text-muted-foreground">{item.address}</p>
                                </Link>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="day">
                <div className="overflow-x-auto">
                  <div className="min-w-[900px]">
                    <div className="rounded-lg border overflow-hidden">
                      <div className="grid" style={{ gridTemplateColumns: dayGridTemplate }}>
                        <div className="bg-muted/30 p-2 text-xs font-semibold text-muted-foreground">
                          Time
                        </div>
                        {visibleInspectors.map((inspector) => (
                          <div
                            key={inspector.inspectorId}
                            className="bg-muted/30 p-2 text-xs font-semibold text-muted-foreground"
                          >
                            {inspector.inspector}
                          </div>
                        ))}
                      </div>
                      <div className="grid border-t" style={{ gridTemplateColumns: dayGridTemplate }}>
                        <div className="border-r">
                          <div className="relative" style={{ height: hourSlots.length * slotHeight }}>
                            {hourSlots.map((hour, idx) => (
                              <div
                                key={hour}
                                className="absolute left-0 right-0 border-t px-2 text-[11px] text-muted-foreground"
                                style={{ top: idx * slotHeight }}
                              >
                                <span className="relative -top-2 bg-background pr-2">
                                  {getHourLabel(hour)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                        {visibleInspectors.map((inspector) => (
                          <div key={inspector.inspectorId} className="border-l bg-background">
                            <div className="relative" style={{ height: hourSlots.length * slotHeight }}>
                              {hourSlots.map((_, idx) => (
                                <div
                                  key={`${inspector.inspectorId}-grid-${idx}`}
                                  className="absolute left-0 right-0 border-t"
                                  style={{ top: idx * slotHeight }}
                                />
                              ))}
                              {dayItems
                                .filter((item) => item.inspectorId === inspector.inspectorId)
                                .map((item) => {
                                  const start = toMinutes(item.time);
                                  const rawTop = ((start - dayStartMinutes) / slotMinutes) * slotHeight;
                                  const top = Math.max(0, Math.min(rawTop, totalDayHeight - slotHeight));
                                  const height = Math.min(
                                    ((item.durationMinutes || defaultDurationMinutes) / slotMinutes) * slotHeight,
                                    totalDayHeight - top
                                  );
                                  const color = inspectorMap.get(item.inspectorId) ?? "bg-slate-400";
                                  return (
                                    <Link
                                      key={item.id}
                                      href={`/admin/inspections/${item.id}`}
                                      className="absolute left-2 right-2 rounded-md border border-primary/30 bg-primary/10 px-2 py-1 text-[11px] shadow-sm transition hover:bg-primary/15"
                                      style={{ top, height }}
                                    >
                                      <div className="flex items-center gap-2">
                                        <span className={`h-2 w-2 rounded-full ${color}`} />
                                        <p className="font-semibold text-primary">{formatTime12(item.time)}</p>
                                      </div>
                                      <p className="text-muted-foreground">{item.type}</p>
                                      <p className="truncate text-muted-foreground">{item.address}</p>
                                    </Link>
                                  );
                                })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
