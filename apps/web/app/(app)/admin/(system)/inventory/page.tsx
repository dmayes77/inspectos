"use client";

import { AdminPageHeader } from "@/layout/admin-page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ClipboardList, Plus } from "lucide-react";

export default function InventoryPage() {
  return (
    <>
    <div className="space-y-6">
      <AdminPageHeader
        title="Inventory"
        description="Track supplies, test kits, and consumables"
        actions={
          <Button className="sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Add Item
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Stock Levels</CardTitle>
          <CardDescription>Monitor usage and reorder thresholds.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-10 text-center">
            <ClipboardList className="h-10 w-10 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">No inventory items yet</p>
              <p className="text-xs text-muted-foreground">
                Track radon kits, mold samples, batteries, and PPE.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
    </>
  );
}
