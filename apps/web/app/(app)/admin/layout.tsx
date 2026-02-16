import { ReactNode } from "react";
import { AdminShell } from "@/layout/admin-shell";
import { mockAdminUser } from "@inspectos/shared/constants/mock-users";
import { BrandColorProvider } from "@/context/brand-color";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AdminShell user={mockAdminUser}>
      <BrandColorProvider />
      {children}
    </AdminShell>
  );
}
