import type { ReactNode } from "react";
import { BookingShell } from "@/layout/booking-shell";
import { BrandingProvider } from "@/components/providers/branding-provider";

export default function BookingLayout({ children }: { children: ReactNode }) {
  return (
    <BrandingProvider>
      <BookingShell companyName="InspectOS">{children}</BookingShell>
    </BrandingProvider>
  );
}
