"use client";

import { ReactNode } from "react";
import { PageHeader } from "@/layout/page-header";

export type IdPageLayoutProps = {
  title: ReactNode;
  description?: ReactNode;
  meta?: ReactNode;
  headerActions?: ReactNode;
  breadcrumb?: ReactNode;
  left?: ReactNode;
  right?: ReactNode;
  children?: ReactNode;
  leftClassName?: string;
  rightClassName?: string;
};

export function IdPageLayout({
  title,
  description,
  meta,
  headerActions,
  breadcrumb,
  left,
  right,
  children,
  leftClassName = "space-y-4",
  rightClassName = "space-y-4 lg:sticky lg:top-20 lg:self-start",
}: IdPageLayoutProps) {
  const hasRightRail = Boolean(right);

  return (
    <div className="space-y-6">
      {breadcrumb ? <div className="hidden lg:flex fixed right-8 top-20 z-20 items-center gap-2 text-sm">{breadcrumb}</div> : null}

      <div className={hasRightRail ? "grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,1fr)]" : "space-y-4"}>
        <div className={leftClassName}>
          <PageHeader title={title} description={description} meta={meta} actions={headerActions} />
          {left ?? children}
        </div>
        {hasRightRail ? <div className={rightClassName}>{right}</div> : null}
      </div>
    </div>
  );
}
