"use client";

import { ReactNode, useState } from "react";
import { ColumnDef, Table } from "@tanstack/react-table";
import { DataTable, ColumnVisibilityDropdown } from "@/components/ui/data-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ModernDataTableProps<TData, TValue> {
  // Required props
  columns: ColumnDef<TData, TValue>[];
  data: TData[];

  // Card styling
  title?: ReactNode;
  description?: ReactNode;

  // Filter controls (search, dropdowns, etc.)
  filterControls?: ReactNode;
  headerActions?: ReactNode;

  // Empty state
  emptyState?: ReactNode;

  // Loading state
  isLoading?: boolean;
  loadingState?: ReactNode;

  // Show/hide column visibility toggle
  showColumnVisibility?: boolean;

  // Table instance callback
  onTableReady?: (table: Table<TData>) => void;
}

/**
 * ModernDataTable - A clean, reusable table component with consistent styling
 *
 * Features:
 * - Clean card-based layout
 * - Flexible filter controls slot
 * - Built-in column visibility toggle
 * - Custom empty states
 * - Equal column spacing (no explicit sizes)
 * - No row selection checkboxes
 * - No density toggle
 *
 * @example
 * ```tsx
 * <ModernDataTable
 *   columns={columns}
 *   data={filteredData}
 *   title="All Clients"
 *   description={`${filteredData.length} of ${totalData.length} clients`}
 *   filterControls={
 *     <>
 *       <SearchInput />
 *       <TypeFilter />
 *       <SortDropdown />
 *     </>
 *   }
 *   emptyState={<CustomEmptyState />}
 * />
 * ```
 */
export function ModernDataTable<TData, TValue>({
  columns,
  data,
  title,
  description,
  filterControls,
  headerActions,
  emptyState,
  isLoading = false,
  loadingState,
  showColumnVisibility = true,
  onTableReady,
}: ModernDataTableProps<TData, TValue>) {
  const [table, setTable] = useState<Table<TData> | null>(null);

  const hasData = data.length > 0;

  const handleTableReady = (tableInstance: Table<TData>) => {
    setTable(tableInstance);
    onTableReady?.(tableInstance);
  };

  // Default empty state
  const defaultEmptyState = (
    <div className="rounded-sm border border-dashed p-12 text-center">
      <p className="text-sm text-muted-foreground">No data available</p>
    </div>
  );

  const defaultLoadingState = (
    <div className="rounded-sm border border-dashed p-12 text-center">
      <p className="text-sm text-muted-foreground">Loading...</p>
    </div>
  );

  return (
    <Card>
      {(title || description || filterControls || headerActions || showColumnVisibility) && (
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            {(title || description) && (
              <div>
                {title && (typeof title === 'string' ? <CardTitle>{title}</CardTitle> : title)}
                {description && (typeof description === 'string' ? <CardDescription>{description}</CardDescription> : description)}
              </div>
            )}

            {/* Filter controls and actions */}
            {(filterControls || headerActions || showColumnVisibility) && (
              <div className="flex flex-wrap items-center gap-2">
                {filterControls}
                {showColumnVisibility && <ColumnVisibilityDropdown table={table} />}
                {headerActions}
              </div>
            )}
          </div>
        </CardHeader>
      )}
      <CardContent>
        {!hasData && isLoading ? (
          loadingState || defaultLoadingState
        ) : !hasData ? (
          emptyState || defaultEmptyState
        ) : (
          <div className="w-full overflow-auto">
            <DataTable
              columns={columns}
              data={data}
              showColumnVisibility={false}
              onTableReady={handleTableReady}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
