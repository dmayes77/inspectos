"use client";

import { AdminPageHeader } from "@/layout/admin-page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HardHat, Plus } from "lucide-react";

export default function AssetsPage() {
  return (
    <>
    <div className="space-y-6">
      <AdminPageHeader
        title="Assets"
        description="Manage equipment, vehicles, and calibration schedules"
        actions={
          <Button className="sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Add Asset
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Equipment Registry</CardTitle>
          <CardDescription>Track serial numbers, assignments, and maintenance.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center gap-3 rounded-md border border-dashed p-10 text-center">
            <HardHat className="h-10 w-10 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">No assets yet</p>
              <p className="text-xs text-muted-foreground">
                Add thermal cameras, ladders, moisture meters, and vehicles.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
    </>
  );
}
