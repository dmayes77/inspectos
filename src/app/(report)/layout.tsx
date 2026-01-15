import { ReactNode } from "react";
import { ReportShell } from "@/components/layout/report-shell";

export default function ReportLayout({ children }: { children: ReactNode }) {
  return <ReportShell>{children}</ReportShell>;
}
