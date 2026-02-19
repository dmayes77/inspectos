"use client";

import { ReactNode } from "react";
import { AdminShell } from "@/layout/admin-shell";
import { AdminPageHeader } from "@/layout/admin-page-header";
import { ResourceListLayout } from "@/components/shared/resource-list-layout";

type AdminUser = {
  name: string;
  email: string;
  avatarUrl?: string;
  companyName?: string;
};

type AdminResourceHeaderProps = {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  breadcrumb?: ReactNode;
  meta?: ReactNode;
  backHref?: string;
};

type AdminResourcePageProps = {
  user?: AdminUser;
  header: AdminResourceHeaderProps;
  stats?: ReactNode;
  filters?: ReactNode;
  table: ReactNode;
};

export function AdminResourcePage({ user, header, stats, filters, table }: AdminResourcePageProps) {
  return (
    <AdminShell user={user}>
      <ResourceListLayout
        header={<AdminPageHeader {...header} />}
        stats={stats}
        filters={filters}
        table={table}
      />
    </AdminShell>
  );
}
