import { AdminShell } from "@/components/layout/admin-shell";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { mockAdminUser } from "@/lib/constants/mock-users";

interface AdminPageSkeletonProps {
  /**
   * Show stats cards at the top (used for dashboard-style pages)
   */
  showStats?: boolean;
  /**
   * Number of list items to show in skeleton
   */
  listItems?: number;
  /**
   * Show a table skeleton instead of list items
   */
  showTable?: boolean;
}

export function AdminPageSkeleton({
  showStats = false,
  listItems = 5,
  showTable = false,
}: AdminPageSkeletonProps) {
  return (
    <AdminShell user={mockAdminUser}>
      <div className="space-y-6">
        {/* Page Header Skeleton */}
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>

        {/* Stats Cards (optional) */}
        {showStats && (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-32" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-24 mb-2" />
                  <Skeleton className="h-3 w-20" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Main Content Skeleton */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-10 w-32" />
            </div>
          </CardHeader>
          <CardContent>
            {showTable ? (
              /* Table Skeleton */
              <div className="space-y-3">
                <div className="grid grid-cols-4 gap-4 pb-3 border-b">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-4 w-full" />
                  ))}
                </div>
                {Array.from({ length: listItems }).map((_, i) => (
                  <div key={i} className="grid grid-cols-4 gap-4 py-3 border-b last:border-0">
                    {[1, 2, 3, 4].map((j) => (
                      <Skeleton key={j} className="h-4 w-full" />
                    ))}
                  </div>
                ))}
              </div>
            ) : (
              /* List Skeleton */
              <div className="space-y-4">
                {Array.from({ length: listItems }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-12 w-12 rounded" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-full max-w-md" />
                      <Skeleton className="h-3 w-full max-w-xs" />
                    </div>
                    <Skeleton className="h-8 w-20" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}
