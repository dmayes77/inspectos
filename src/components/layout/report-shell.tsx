"use client";

import { ReactNode } from "react";

interface ReportShellProps {
  children: ReactNode;
}

/**
 * ReportShell - Focused shell for client-facing inspection reports.
 *
 * Provides a neutral, distraction-free wrapper so report pages
 * can fully control their own header/footer content.
 */
export function ReportShell({ children }: ReportShellProps) {
  return (
    <div className="min-h-dvh bg-slate-50 safe-area-inset-top safe-area-inset-bottom safe-area-inset-left safe-area-inset-right">
      <main className="min-h-dvh">{children}</main>
    </div>
  );
}
