"use client";

import { ReactNode } from "react";

type PageHeaderProps = {
  breadcrumb?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  meta?: ReactNode;
  caption?: ReactNode;
  backHref?: string;
  actions?: ReactNode;
};

export function PageHeader({ title, description, meta, caption, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
          {actions ? <div className="flex flex-wrap items-center justify-end gap-2">{actions}</div> : null}
        </div>
        {caption ? <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{caption}</p> : null}
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
        {meta ? <div className="flex flex-wrap items-center gap-2">{meta}</div> : null}
      </div>
    </div>
  );
}
