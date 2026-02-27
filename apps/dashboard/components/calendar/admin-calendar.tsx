"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Plus, Clock, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

const INSPECTOR_COLORS = [
  { bg: "bg-orange-400", dot: "bg-orange-400", text: "text-orange-600 dark:text-orange-400", light: "bg-orange-50 dark:bg-orange-500/10" },
  { bg: "bg-brand-500",   dot: "bg-brand-500",   text: "text-brand-600 dark:text-brand-400",   light: "bg-brand-50 dark:bg-brand-500/10"   },
  { bg: "bg-emerald-500",dot: "bg-emerald-500",text: "text-emerald-600 dark:text-emerald-400",light: "bg-emerald-50 dark:bg-emerald-500/10"},
  { bg: "bg-purple-500", dot: "bg-purple-500", text: "text-purple-600 dark:text-purple-400", light: "bg-purple-50 dark:bg-purple-500/10" },
  { bg: "bg-pink-500",   dot: "bg-pink-500",   text: "text-pink-600 dark:text-pink-400",   light: "bg-pink-50 dark:bg-pink-500/10"   },
];

export interface CalendarEvent {
  id: string;
  orderNumber?: string;
  title: string;
  date: string; // "YYYY-MM-DD"
  time?: string; // "HH:MM"
  durationMinutes?: number;
  inspectorId?: string;
  inspectorName?: string;
  address?: string;
}

interface AdminCalendarProps {
  events: CalendarEvent[];
  onEventClick?: (event: CalendarEvent) => void;
  onAddEvent?: () => void;
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function formatTime(time?: string): string {
  if (!time) return "";
  const [h, m] = time.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${period}`;
}

export function AdminCalendar({ events, onEventClick, onAddEvent }: AdminCalendarProps) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(
    `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`
  );

  // Inspector → color index map
  const colorMap = useMemo(() => {
    const ids = Array.from(new Set(events.map((e) => e.inspectorId ?? "default")));
    return new Map(ids.map((id, i) => [id, INSPECTOR_COLORS[i % INSPECTOR_COLORS.length]]));
  }, [events]);

  // Events keyed by "YYYY-MM-DD"
  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const ev of events) {
      const list = map.get(ev.date) ?? [];
      list.push(ev);
      map.set(ev.date, list);
    }
    return map;
  }, [events]);

  // Selected day events
  const selectedEvents = selectedDate ? (eventsByDate.get(selectedDate) ?? []) : [];

  // Upcoming events (from today, next 30 days)
  const upcomingEvents = useMemo(() => {
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    return events
      .filter((e) => e.date >= todayStr)
      .sort((a, b) => {
        const dateCompare = a.date.localeCompare(b.date);
        if (dateCompare !== 0) return dateCompare;
        return (a.time ?? "").localeCompare(b.time ?? "");
      })
      .slice(0, 10);
  }, [events]);

  // Calendar grid
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const totalCells = Math.ceil((firstDayOfWeek + daysInMonth) / 7) * 7;

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const cells = Array.from({ length: totalCells }, (_, i) => {
    const dayNum = i - firstDayOfWeek + 1;
    if (dayNum < 1 || dayNum > daysInMonth) return null;
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
    const dayEvents = eventsByDate.get(dateStr) ?? [];
    return { dayNum, dateStr, dayEvents };
  });

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-6">
      {/* ── Month grid ── */}
      <div className="rounded-md border border-border bg-card shadow-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={prevMonth}
              className="flex h-9 w-9 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-muted transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <h2 className="text-base font-semibold text-foreground min-w-[160px] text-center">
              {MONTH_NAMES[month]} {year}
            </h2>
            <button
              type="button"
              onClick={nextMonth}
              className="flex h-9 w-9 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-muted transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => { setYear(today.getFullYear()); setMonth(today.getMonth()); setSelectedDate(todayStr); }}
              className="h-9 rounded-md border border-border px-3.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              Today
            </button>
            {onAddEvent && (
              <Button size="sm" onClick={onAddEvent} className="gap-1.5">
                <Plus className="h-3.5 w-3.5" />
                Add Event
              </Button>
            )}
          </div>
        </div>

        {/* Day-name row */}
        <div className="grid grid-cols-7 border-b border-border bg-muted/40">
          {DAY_NAMES.map((d) => (
            <div key={d} className="py-3 text-center text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 divide-x divide-y divide-border">
          {cells.map((cell, idx) => {
            if (!cell) {
              return <div key={`empty-${idx}`} className="h-[100px] bg-muted/20" />;
            }
            const { dayNum, dateStr, dayEvents } = cell;
            const isToday = dateStr === todayStr;
            const isSelected = dateStr === selectedDate;
            const visible = dayEvents.slice(0, 3);
            const overflow = dayEvents.length - visible.length;

            return (
              <div
                key={dateStr}
                onClick={() => setSelectedDate(dateStr)}
                className={cn(
                  "h-[100px] p-2 cursor-pointer transition-colors hover:bg-muted/40",
                  isSelected && !isToday && "bg-brand-50 dark:bg-brand-500/5"
                )}
              >
                <span
                  className={cn(
                    "inline-flex h-7 w-7 items-center justify-center rounded-md text-sm font-medium mb-1",
                    isToday
                      ? "bg-brand-500 text-white"
                      : "text-foreground hover:bg-muted"
                  )}
                >
                  {dayNum}
                </span>

                <div className="flex flex-col gap-0.5">
                  {visible.map((ev) => {
                    const c = colorMap.get(ev.inspectorId ?? "default") ?? INSPECTOR_COLORS[0];
                    return (
                      <div
                        key={ev.id}
                        onClick={(e) => { e.stopPropagation(); onEventClick?.(ev); }}
                        className={cn(
                          "flex items-center gap-1.5 rounded-md px-1.5 py-0.5 text-xs font-medium truncate cursor-pointer",
                          c.light, c.text
                        )}
                      >
                        <span className={cn("h-1.5 w-1.5 rounded-md shrink-0", c.dot)} />
                        <span className="truncate">{ev.title}</span>
                      </div>
                    );
                  })}
                  {overflow > 0 && (
                    <span className="pl-1 text-[11px] font-medium text-muted-foreground">
                      +{overflow} more
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className="flex flex-col gap-5">
        {/* Selected day */}
        {selectedDate && (
          <div className="rounded-md border border-border bg-card shadow-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {new Date(selectedDate + "T00:00:00").toLocaleDateString("en-US", {
                    weekday: "long", month: "long", day: "numeric",
                  })}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {selectedEvents.length === 0
                    ? "No events"
                    : `${selectedEvents.length} inspection${selectedEvents.length === 1 ? "" : "s"}`}
                </p>
              </div>
            </div>

            {selectedEvents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center px-5">
                <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center mb-3">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">No inspections scheduled</p>
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {selectedEvents.map((ev) => {
                  const c = colorMap.get(ev.inspectorId ?? "default") ?? INSPECTOR_COLORS[0];
                  return (
                    <li
                      key={ev.id}
                      onClick={() => onEventClick?.(ev)}
                      className="flex items-start gap-3 px-5 py-3.5 hover:bg-muted/40 cursor-pointer transition-colors"
                    >
                      <div className={cn("mt-0.5 h-2.5 w-2.5 rounded-md shrink-0", c.bg)} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate">{ev.title}</p>
                        {ev.time && (
                          <div className="flex items-center gap-1 mt-0.5">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">{formatTime(ev.time)}</span>
                            {ev.durationMinutes && (
                              <span className="text-xs text-muted-foreground">· {ev.durationMinutes} min</span>
                            )}
                          </div>
                        )}
                        {ev.inspectorName && (
                          <p className="text-xs text-muted-foreground mt-0.5">{ev.inspectorName}</p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}

        {/* Upcoming events */}
        <div className="rounded-md border border-border bg-card shadow-sm">
          <div className="px-5 py-4 border-b border-border">
            <p className="text-sm font-semibold text-foreground">Upcoming</p>
            <p className="text-xs text-muted-foreground mt-0.5">Next inspections</p>
          </div>

          {upcomingEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center px-5">
              <p className="text-sm text-muted-foreground">No upcoming inspections</p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {upcomingEvents.map((ev) => {
                const c = colorMap.get(ev.inspectorId ?? "default") ?? INSPECTOR_COLORS[0];
                const evDate = new Date(ev.date + "T00:00:00");
                return (
                  <li
                    key={ev.id}
                    onClick={() => onEventClick?.(ev)}
                    className="flex items-start gap-3 px-5 py-3.5 hover:bg-muted/40 cursor-pointer transition-colors"
                  >
                    <div className={cn("mt-0.5 h-2.5 w-2.5 rounded-md shrink-0", c.bg)} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">{ev.title}</p>
                      <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                        <span className="text-xs text-muted-foreground">
                          {evDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </span>
                        {ev.time && (
                          <>
                            <span className="text-xs text-muted-foreground">·</span>
                            <span className="text-xs text-muted-foreground">{formatTime(ev.time)}</span>
                          </>
                        )}
                      </div>
                      {ev.address && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
                          <span className="text-xs text-muted-foreground truncate">{ev.address}</span>
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
