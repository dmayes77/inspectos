import type { ReactNode } from "react";
import { AuthShell } from "@/components/layout/auth-shell";
import { BrandingProvider } from "@/components/providers/branding-provider";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <BrandingProvider>
      <AuthShell>{children}</AuthShell>
    </BrandingProvider>
  );
}
