import { ReactNode } from "react";
import { AdminShell } from "@/components/layout/admin-shell";
import { mockAdminUser } from "@inspectos/shared/constants/mock-users";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AdminShell user={mockAdminUser}>{children}</AdminShell>;
}
