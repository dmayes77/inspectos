"use client";

import { ReactNode } from "react";

type AdminEmptyStateProps = {
  icon?: ReactNode;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
};

export function AdminEmptyState({ icon, title, description, action, className = "" }: AdminEmptyStateProps) {
  return (
    <div className={`rounded-sm border border-dashed p-10 text-center ${className}`}>
      {icon ? <div className="mx-auto mb-3 h-10 w-10 text-muted-foreground">{icon}</div> : null}
      <h3 className="text-lg font-semibold">{title}</h3>
      {description ? <p className="mt-2 text-sm text-muted-foreground">{description}</p> : null}
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}
