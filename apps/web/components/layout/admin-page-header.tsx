import type { ReactNode } from "react";

type AdminPageHeaderProps = {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  breadcrumb?: ReactNode; // kept for backwards compat, no longer rendered
  meta?: ReactNode;
  backHref?: string;
};

export function AdminPageHeader({ title, description, actions, meta }: AdminPageHeaderProps) {
  return (
    <div className="admin-page-header flex flex-col gap-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {description ? <p className="text-muted-foreground">{description}</p> : null}
          {meta ? <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">{meta}</div> : null}
        </div>
        {actions ? <div className="flex w-full flex-col items-stretch gap-2 sm:w-auto sm:flex-row sm:items-center">{actions}</div> : null}
      </div>
    </div>
  );
}
