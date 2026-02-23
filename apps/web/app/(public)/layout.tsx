import type { ReactNode } from "react";
import { PublicShell } from "@/layout/public-shell";
import { PublicSurfaceGuard } from "@/components/providers/public-surface-guard";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <PublicShell fullWidth>
      <PublicSurfaceGuard />
      {children}
    </PublicShell>
  );
}
