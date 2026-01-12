"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BookingShell } from "@/components/layout/booking-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Clock } from "lucide-react";

// Mock company data
const mockCompany = {
  name: "Acme Home Inspections",
  slug: "acme-inspections",
  logo: null,
};

// Generate calendar days for a month
function getCalendarDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();

  const days: (number | null)[] = [];

  // Add empty slots for days before the 1st
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(null);
  }

  // Add all days of the month
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  return days;
}

// Mock available time slots
const availableSlots: Record<string, string[]> = {
  // Format: "YYYY-MM-DD": ["time1", "time2", ...]
  // We'll generate some mock availability
};

// Generate mock availability for the next 30 days
const today = new Date();
for (let i = 1; i <= 30; i++) {
  const date = new Date(today);
  date.setDate(today.getDate() + i);
  const dateStr = date.toISOString().split("T")[0];

  // Skip weekends
  if (date.getDay() === 0 || date.getDay() === 6) continue;

  // Random availability
  const slots = [];
  if (Math.random() > 0.3) slots.push("8:00 AM");
  if (Math.random() > 0.3) slots.push("9:00 AM");
  if (Math.random() > 0.4) slots.push("10:00 AM");
  if (Math.random() > 0.5) slots.push("11:00 AM");
  if (Math.random() > 0.3) slots.push("1:00 PM");
  if (Math.random() > 0.4) slots.push("2:00 PM");
  if (Math.random() > 0.5) slots.push("3:00 PM");

  if (slots.length > 0) {
    availableSlots[dateStr] = slots;
  }
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export default function BookSchedulePage({
  params,
}: {
  params: Promise<{ companySlug: string }>;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  const calendarDays = getCalendarDays(currentYear, currentMonth);

  const isDateAvailable = (day: number) => {
    const date = new Date(currentYear, currentMonth, day);
    const dateStr = date.toISOString().split("T")[0];
    return dateStr in availableSlots;
  };

  const isDatePast = (day: number) => {
    const date = new Date(currentYear, currentMonth, day);
    date.setHours(0, 0, 0, 0);
    const todayMidnight = new Date();
    todayMidnight.setHours(0, 0, 0, 0);
    return date <= todayMidnight;
  };

  const handleDateSelect = (day: number) => {
    const date = new Date(currentYear, currentMonth, day);
    const dateStr = date.toISOString().split("T")[0];
    setSelectedDate(dateStr);
    setSelectedTime(null);
  };

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleContinue = () => {
    const service = searchParams.get("service");
    const addons = searchParams.get("addons");
    router.push(
      `/book/${mockCompany.slug}/checkout?service=${service}${addons ? `&addons=${addons}` : ""}&date=${selectedDate}&time=${encodeURIComponent(selectedTime || "")}`
    );
  };

  const handleBack = () => {
    router.back();
  };

  const formatSelectedDate = () => {
    if (!selectedDate) return "";
    const date = new Date(selectedDate + "T12:00:00");
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <BookingShell companyName={mockCompany.name} currentStep={2}>
      <div className="mx-auto max-w-3xl space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">Select Date & Time</h1>
          <p className="mt-2 text-muted-foreground">
            Choose a convenient time for your inspection
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {/* Calendar */}
          <Card>
            <CardContent className="p-6">
              {/* Month Navigation */}
              <div className="mb-4 flex items-center justify-between">
                <Button variant="ghost" size="icon" onClick={handlePrevMonth}>
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <h2 className="text-lg font-semibold">
                  {MONTHS[currentMonth]} {currentYear}
                </h2>
                <Button variant="ghost" size="icon" onClick={handleNextMonth}>
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>

              {/* Day Headers */}
              <div className="mb-2 grid grid-cols-7 text-center text-sm font-medium text-muted-foreground">
                {DAYS.map((day) => (
                  <div key={day} className="py-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day, index) => {
                  if (day === null) {
                    return <div key={`empty-${index}`} className="aspect-square" />;
                  }

                  const dateStr = new Date(currentYear, currentMonth, day)
                    .toISOString()
                    .split("T")[0];
                  const isAvailable = isDateAvailable(day);
                  const isPast = isDatePast(day);
                  const isSelected = selectedDate === dateStr;

                  return (
                    <button
                      key={day}
                      disabled={!isAvailable || isPast}
                      onClick={() => handleDateSelect(day)}
                      className={`aspect-square rounded-lg text-sm font-medium transition-colors ${
                        isSelected
                          ? "bg-primary text-primary-foreground"
                          : isAvailable && !isPast
                          ? "bg-primary/10 text-primary hover:bg-primary/20"
                          : "text-muted-foreground/50"
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <div className="h-3 w-3 rounded bg-primary/10" />
                  <span>Available</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="h-3 w-3 rounded bg-primary" />
                  <span>Selected</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Time Slots */}
          <Card>
            <CardContent className="p-6">
              <h2 className="mb-4 text-lg font-semibold">
                {selectedDate ? (
                  <>Available times for {formatSelectedDate()}</>
                ) : (
                  "Select a date to see available times"
                )}
              </h2>

              {selectedDate && availableSlots[selectedDate] ? (
                <div className="grid grid-cols-2 gap-3">
                  {availableSlots[selectedDate].map((time) => (
                    <Button
                      key={time}
                      variant={selectedTime === time ? "default" : "outline"}
                      className="h-12"
                      onClick={() => setSelectedTime(time)}
                    >
                      <Clock className="mr-2 h-4 w-4" />
                      {time}
                    </Button>
                  ))}
                </div>
              ) : selectedDate ? (
                <p className="text-muted-foreground">
                  No available times for this date. Please select another date.
                </p>
              ) : (
                <div className="flex h-48 items-center justify-center text-muted-foreground">
                  <p>Select a date from the calendar</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={handleBack}>
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back
          </Button>

          <Button
            size="lg"
            disabled={!selectedDate || !selectedTime}
            onClick={handleContinue}
          >
            Continue to Checkout
          </Button>
        </div>
      </div>
    </BookingShell>
  );
}
