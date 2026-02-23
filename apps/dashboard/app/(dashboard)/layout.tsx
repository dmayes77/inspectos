import { ReactNode } from "react";
import { AdminLayoutClient } from "./admin-layout-client";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AdminLayoutClient>{children}</AdminLayoutClient>;
}
