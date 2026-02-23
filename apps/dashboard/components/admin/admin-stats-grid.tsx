"use client";

import { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardDescription, CardTitle } from "@/components/ui/card";

type ColumnCount = 2 | 3 | 4;

export type AdminStatItem = {
  label: string;
  value: ReactNode;
  detail?: ReactNode;
};

type AdminStatsGridProps = {
  items: AdminStatItem[];
  columns?: ColumnCount;
  className?: string;
};

const columnClasses: Record<ColumnCount, string> = {
  2: "md:grid-cols-2",
  3: "md:grid-cols-3",
  4: "md:grid-cols-4",
};

export function AdminStatsGrid({ items, columns = 3, className = "" }: AdminStatsGridProps) {
  return (
    <div className={`grid grid-cols-1 gap-3 ${columnClasses[columns]} ${className}`}>
      {items.map((item) => (
        <Card key={item.label}>
          <CardHeader className="pb-2">
            <CardDescription>{item.label}</CardDescription>
            <CardTitle className="text-2xl">{item.value}</CardTitle>
          </CardHeader>
          {item.detail ? (
            <CardContent className="pt-0 text-sm text-muted-foreground">{item.detail}</CardContent>
          ) : null}
        </Card>
      ))}
    </div>
  );
}
