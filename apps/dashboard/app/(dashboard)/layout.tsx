import { ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AdminLayoutClient } from "./admin-layout-client";

const ACCESS_COOKIE_NAME = "inspectos_access_token";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_COOKIE_NAME)?.value;

  if (!accessToken) {
    redirect("/login?url=/overview");
  }

  return <AdminLayoutClient>{children}</AdminLayoutClient>;
}
