"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { PublicShell } from "@/components/layout/public-shell";

export default function PublicLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isLandingPage = pathname === "/";
  const isPricingPage = pathname === "/pricing";

  return (
    <PublicShell
      fullWidth
      showHeader={!isLandingPage && !isPricingPage}
      showFooter={!isLandingPage && !isPricingPage}
    >
      {children}
    </PublicShell>
  );
}
