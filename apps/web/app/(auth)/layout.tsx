import type { ReactNode } from "react";
import { AuthShell } from "@/layout/auth-shell";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return <AuthShell>{children}</AuthShell>;
}
