import { ReactNode } from "react";

export default function AppLayout({ children }: { children: ReactNode }) {
  // App routes currently wrap their own shells (AppShell).
  return <>{children}</>;
}
