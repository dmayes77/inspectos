"use client";

import { ReactNode } from "react";

type ResourceListLayoutProps = {
  header: ReactNode;
  stats?: ReactNode;
  filters?: ReactNode;
  table: ReactNode;
};

export function ResourceListLayout({ header, stats, filters, table }: ResourceListLayoutProps) {
  return (
    <div className="space-y-6">
      {header}
      {stats}
      {filters}
      {table}
    </div>
  );
}
