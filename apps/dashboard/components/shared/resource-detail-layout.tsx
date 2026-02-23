"use client";

import { ReactNode } from "react";
import { AdminPageHeader } from "@/layout/admin-page-header";

export type ResourceDetailLayoutProps = {
  title: ReactNode;
  description?: ReactNode;
  meta?: ReactNode;
  headerActions?: ReactNode;
  children?: ReactNode;
  // Legacy props — sidebar is no longer rendered, main is kept as fallback
  main?: ReactNode;
  sidebar?: ReactNode;
  breadcrumb?: ReactNode;
  caption?: ReactNode;
  backHref?: string;
};

export function ResourceDetailLayout({
  title,
  description,
  meta,
  headerActions,
  children,
  main,
}: ResourceDetailLayoutProps) {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={title}
        description={description}
        meta={meta}
        actions={headerActions}
      />
      <div className="space-y-6">{children ?? main}</div>
    </div>
  );
}
