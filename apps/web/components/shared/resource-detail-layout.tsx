"use client";

import { ReactNode } from "react";
import { PageHeader } from "@/components/layout/page-header";

export type ResourceDetailLayoutProps = {
  breadcrumb?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  meta?: ReactNode;
  caption?: ReactNode;
  backHref?: string;
  headerActions?: ReactNode;
  main: ReactNode;
  sidebar: ReactNode;
};

export function ResourceDetailLayout({
  breadcrumb,
  title,
  description,
  meta,
  caption,
  backHref,
  headerActions,
  main,
  sidebar,
}: ResourceDetailLayoutProps) {
  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb={breadcrumb}
        title={title}
        description={description}
        meta={meta}
        caption={caption}
        backHref={backHref}
        actions={headerActions}
      />
      <div className="grid gap-4 lg:grid-cols-4">
        <div className="space-y-4 lg:col-span-3">{main}</div>
        <div className="space-y-4 lg:order-1 lg:col-start-4">{sidebar}</div>
      </div>
    </div>
  );
}
