"use client";

import { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type PropertyHeaderProps = {
  breadcrumb?: ReactNode;
  address: string;
  addressFull?: string;
  propertyType?: string;
  propertyTypeIcon?: ReactNode;
  createdAtLabel?: string;
  description?: string;
  backHref?: string; // kept for backwards compat, no longer rendered
  actions?: ReactNode;
};

export function PropertyHeader({
  breadcrumb,
  address,
  addressFull,
  propertyType,
  propertyTypeIcon,
  createdAtLabel,
  description,
  actions,
}: PropertyHeaderProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
        {breadcrumb ? <div className="flex items-center gap-2">{breadcrumb}</div> : null}
      </div>

      <div className="flex flex-col gap-2">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl flex items-center gap-3">
            {propertyTypeIcon}
            <span className="truncate">{address}</span>
          </h1>
          {actions ? <div className="flex flex-wrap items-center justify-end gap-2">{actions}</div> : null}
        </div>
        {(addressFull || description) ? (
          <p className="text-sm text-muted-foreground">{addressFull || description}</p>
        ) : null}
        {(propertyType || createdAtLabel) ? (
          <div className="flex flex-wrap items-center gap-2">
            {propertyType ? (
              <Badge variant="outline" className="text-xs px-2 py-0.5 capitalize">
                {propertyType.replace("-", " ")}
              </Badge>
            ) : null}
            {createdAtLabel ? (
              <span className="text-xs text-muted-foreground">Added {createdAtLabel}</span>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
