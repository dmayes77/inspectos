"use client";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import type { EventDropArg } from "@fullcalendar/core";
import type { EventResizeDoneArg } from "@fullcalendar/interaction";
import { useMemo } from "react";
import { toast } from "sonner";
import { AdminPageHeader } from "@/components/layout/admin-page-header";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useSchedule } from "@/hooks/use-schedule";
import { useUpdateOrder } from "@/hooks/use-orders";
import { AdminPageSkeleton } from "@/components/layout/admin-page-skeleton";

const INSPECTOR_COLORS = [
  { bg: "#f97316", border: "#ea6a00" }, // orange
  { bg: "#3b82f6", border: "#1d6feb" }, // blue
  { bg: "#10b981", border: "#059669" }, // emerald
  { bg: "#8b5cf6", border: "#7035f2" }, // purple
  { bg: "#ec4899", border: "#d82b86" }, // pink
];

export default function SchedulePage() {
  const { data: scheduleItems = [], isLoading } = useSchedule();
  const updateOrder = useUpdateOrder();

  const inspectorColorMap = useMemo(() => {
    const unique = Array.from(new Set(scheduleItems.map((i) => i.inspectorId)));
    return new Map(unique.map((id, idx) => [id, INSPECTOR_COLORS[idx % INSPECTOR_COLORS.length]]));
  }, [scheduleItems]);

  const events = useMemo(
    () =>
      scheduleItems.map((item) => {
        const start = new Date(`${item.date}T${item.time}`);
        const end = new Date(start.getTime() + (item.durationMinutes || 90) * 60_000);
        const color = inspectorColorMap.get(item.inspectorId) ?? INSPECTOR_COLORS[0];
        return {
          id: item.id,
          title: item.address,
          start,
          end,
          backgroundColor: color.bg,
          borderColor: color.border,
          textColor: "#fff",
          extendedProps: { item },
        };
      }),
    [scheduleItems, inspectorColorMap]
  );

  const handleEventDrop = (arg: EventDropArg) => {
    const start = arg.event.start;
    if (!start) return;
    updateOrder.mutate(
      {
        id: arg.event.id,
        scheduled_date: start.toISOString().slice(0, 10),
        scheduled_time: `${String(start.getHours()).padStart(2, "0")}:${String(start.getMinutes()).padStart(2, "0")}`,
      },
      {
        onError: () => {
          arg.revert();
          toast.error("Failed to update schedule");
        },
      }
    );
  };

  const handleEventResize = (arg: EventResizeDoneArg) => {
    const start = arg.event.start;
    const end = arg.event.end;
    if (!start || !end) return;
    const durationMinutes = Math.round((end.getTime() - start.getTime()) / 60_000);
    updateOrder.mutate(
      { id: arg.event.id, duration_minutes: durationMinutes },
      {
        onError: () => {
          arg.revert();
          toast.error("Failed to update duration");
        },
      }
    );
  };

  if (isLoading) return <AdminPageSkeleton listItems={8} />;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Schedule"
        description="Plan inspection routes, assign inspectors, and manage availability"
        actions={
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Booking
          </Button>
        }
      />

      <div className="rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden">
        <div className="custom-calendar">
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "dayGridMonth,timeGridWeek,timeGridDay",
            }}
            buttonText={{
              today: "Today",
              month: "Month",
              week: "Week",
              day: "Day",
            }}
            events={events}
            editable={true}
            droppable={true}
            selectable={true}
            eventDrop={handleEventDrop}
            eventResize={handleEventResize}
            slotMinTime="06:00:00"
            slotMaxTime="21:00:00"
            allDaySlot={false}
            nowIndicator={true}
            dayMaxEvents={true}
            height="auto"
            slotDuration="00:30:00"
            snapDuration="00:15:00"
            slotLabelInterval="01:00:00"
            firstDay={1}
            eventClick={(arg) => {
              window.location.href = `/admin/orders/${arg.event.id}`;
            }}
            eventContent={(arg) => {
              const color = arg.event.backgroundColor ?? "#f97316";
              return (
                <div className="event-fc-color flex fc-event-main rounded-lg py-2.5 pl-4 pr-3 cursor-pointer">
                  <div
                    className="fc-daygrid-event-dot w-1 h-5 mr-3 rounded-sm border-none shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  {arg.timeText && (
                    <div className="fc-event-time text-xs text-muted-foreground mr-1">{arg.timeText}</div>
                  )}
                  <div className="fc-event-title text-sm font-normal text-foreground truncate">{arg.event.title}</div>
                </div>
              );
            }}
          />
        </div>
      </div>
    </div>
  );
}
