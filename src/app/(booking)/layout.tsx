import { ReactNode } from "react";

export default function BookingLayout({ children }: { children: ReactNode }) {
  // Booking steps provide their own BookingShell because they need company data.
  return <>{children}</>;
}
