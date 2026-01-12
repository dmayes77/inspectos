import { ReactNode } from "react";
import { PlatformAdminShell } from "@/components/layout/platform-admin-shell";

export default function PlatformLayout({ children }: { children: ReactNode }) {
  return <PlatformAdminShell>{children}</PlatformAdminShell>;
}
