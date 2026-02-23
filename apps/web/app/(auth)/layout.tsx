import type { ReactNode } from "react";
import { AuthShell } from "@/layout/auth-shell";
import { PublicSurfaceGuard } from "@/components/providers/public-surface-guard";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <AuthShell>
      <PublicSurfaceGuard />
      {children}
    </AuthShell>
  );
}
