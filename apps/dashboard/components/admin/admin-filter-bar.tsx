"use client";

import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";

type AdminFilterBarProps = {
  children: ReactNode;
  actions?: ReactNode;
  className?: string;
};

export function AdminFilterBar({ children, actions, className = "" }: AdminFilterBarProps) {
  return (
    <Card>
      <CardContent className={`pt-6 ${className}`}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">{children}</div>
          {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
        </div>
      </CardContent>
    </Card>
  );
}
