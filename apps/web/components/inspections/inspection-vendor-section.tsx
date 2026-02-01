"use client";

import { useState } from "react";
import { useVendors } from "@/hooks/use-vendors";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { VendorForm } from "@/components/vendors/vendor-form";

export function InspectionVendorSection({ selectedVendorIds, onChange }: { selectedVendorIds: string[]; onChange: (ids: string[]) => void }) {
  const { data: vendors = [] } = useVendors();
  const [showVendorDialog, setShowVendorDialog] = useState(false);

  const handleSelect = (id: string) => {
    if (!selectedVendorIds.includes(id)) {
      onChange([...selectedVendorIds, id]);
    }
  };
  const handleRemove = (id: string) => {
    onChange(selectedVendorIds.filter((vid) => vid !== id));
  };

  return (
    <div className="space-y-2">
      <Label>Vendors</Label>
      <div className="flex gap-2 flex-wrap">
        {selectedVendorIds.map((id) => {
          const vendor = vendors.find((v) => v.id === id);
          return vendor ? (
            <span key={id} className="inline-flex items-center gap-1 rounded bg-muted px-2 py-1 text-sm">
              {vendor.name}
              <Button size="sm" variant="ghost" onClick={() => handleRemove(id)}>
                ×
              </Button>
            </span>
          ) : null;
        })}
      </div>
      <div className="flex gap-2 items-center">
        <Select onValueChange={handleSelect}>
          <SelectTrigger>
            <SelectValue placeholder="Add vendor" />
          </SelectTrigger>
          <SelectContent>
            {vendors
              .filter((v) => !selectedVendorIds.includes(v.id))
              .map((vendor) => (
                <SelectItem key={vendor.id} value={vendor.id}>
                  {vendor.name} ({vendor.vendor_type})
                </SelectItem>
              ))}
            <SelectItem value="__add_new_vendor__" className="text-blue-600 font-semibold">
              + Add new vendor
            </SelectItem>
          </SelectContent>
        </Select>
        {showVendorDialog && (
          <VendorForm
            mode="new"
            initialData={undefined}
            onSubmit={() => {
              setShowVendorDialog(false);
              // Optionally refetch vendors and select the new one
            }}
            onCancel={() => setShowVendorDialog(false)}
          />
        )}
      </div>
    </div>
  );
}
