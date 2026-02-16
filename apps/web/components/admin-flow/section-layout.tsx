import { ReactNode } from "react";
import { AdminPageHeader } from "@/layout/admin-page-header";

export type AdminSectionLayoutProps = {
  title: string;
  description?: string;
  children: ReactNode;
  actions?: ReactNode;
  breadcrumb?: ReactNode;
  meta?: ReactNode;
  backHref?: string;
};

export function AdminSectionLayout({
  title,
  description,
  actions,
  breadcrumb,
  meta,
  backHref,
  children,
}: AdminSectionLayoutProps) {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={title}
        description={description}
        actions={actions}
        breadcrumb={breadcrumb}
        meta={meta}
        backHref={backHref}
      />
      {children}
    </div>
  );
}
