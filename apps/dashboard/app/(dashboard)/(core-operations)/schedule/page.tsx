"use client";

import { useMemo } from "react";
import { AdminPageHeader } from "@/layout/admin-page-header";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useSchedule } from "@/hooks/use-schedule";
import { AdminPageSkeleton } from "@/layout/admin-page-skeleton";
import { AdminCalendar, type CalendarEvent } from "@/components/calendar/admin-calendar";
import { useRouter } from "next/navigation";

export default function SchedulePage() {
  const { data: scheduleItems = [], isLoading } = useSchedule();
  const router = useRouter();

  const events = useMemo<CalendarEvent[]>(
    () =>
      scheduleItems.map((item) => ({
        id: item.id,
        orderNumber: item.orderNumber,
        title: item.address,
        date: item.date,
        time: item.time,
        durationMinutes: item.durationMinutes,
        inspectorId: item.inspectorId,
        inspectorName: item.inspector,
        address: item.address,
      })),
    [scheduleItems]
  );

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

      <AdminCalendar
        events={events}
        onEventClick={(ev) => router.push(`/orders/${ev.orderNumber ?? ev.id}`)}
      />
    </div>
  );
}
