"use client";

import { ReactNode } from "react";
import { BackButton } from "@/components/ui/back-button";

type PageHeaderProps = {
  breadcrumb?: ReactNode;
  title: ReactNode;
  description?: string;
  meta?: ReactNode;
  backHref?: string;
  actions?: ReactNode;
};

export function PageHeader({
  breadcrumb,
  title,
  description,
  meta,
  backHref,
  actions,
}: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
        {backHref ? (
          <BackButton href={backHref} variant="ghost" size="icon" />
        ) : null}
        {breadcrumb ? <div className="flex items-center gap-2">{breadcrumb}</div> : null}
      </div>

      <div className="flex flex-col gap-2">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
          {actions ? <div className="flex flex-wrap items-center justify-end gap-2">{actions}</div> : null}
        </div>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
        {meta ? <div className="flex flex-wrap items-center gap-2">{meta}</div> : null}
      </div>
    </div>
  );
}
