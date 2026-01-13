import { ReactNode } from "react";
import { AdminShell } from "@/components/layout/admin-shell";

export default function PlatformLayout({ children }: { children: ReactNode }) {
  // AdminShell auto-detects platform admin based on /platform/* route
  return <AdminShell>{children}</AdminShell>;
}
