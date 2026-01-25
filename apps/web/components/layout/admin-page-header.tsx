import type { ReactNode } from "react";
import { BackButton } from "@/components/ui/back-button";

type AdminPageHeaderProps = {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  breadcrumb?: ReactNode;
  meta?: ReactNode;
  backHref?: string;
};

export function AdminPageHeader({ title, description, actions, breadcrumb, meta, backHref }: AdminPageHeaderProps) {
  return (
    <div className="admin-page-header flex flex-col gap-3">
      {(backHref || breadcrumb) && (
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          {backHref ? <BackButton href={backHref} variant="ghost" size="icon" /> : null}
          {breadcrumb ? <div className="flex items-center gap-2">{breadcrumb}</div> : null}
        </div>
      )}
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
