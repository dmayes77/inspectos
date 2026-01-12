// src/components/shared/crud-table.tsx
import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";

export type CrudTableProps<T> = {
  title: string;
  description?: string;
  columns: any;
  data: T[];
  searchKey?: string;
  searchPlaceholder?: string;
  onAdd?: () => void;
  actions?: React.ReactNode;
};

export function CrudTable<T>({ title, description, columns, data, searchKey = "name", searchPlaceholder = "Search...", onAdd, actions }: CrudTableProps<T>) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </div>
        {onAdd && (
          <Button onClick={onAdd} type="button" variant="default">
            Add
          </Button>
        )}
        {actions}
      </CardHeader>
      <CardContent>
        <DataTable columns={columns} data={data} searchKey={searchKey} searchPlaceholder={searchPlaceholder} />
      </CardContent>
    </Card>
  );
}
