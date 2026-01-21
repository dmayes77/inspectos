import type { ReactNode } from "react";
import { BookingShell } from "@/components/layout/booking-shell";

export default function BookingLayout({ children }: { children: ReactNode }) {
  return (
    <BookingShell companyName="InspectOS">
      {children}
    </BookingShell>
  );
}
