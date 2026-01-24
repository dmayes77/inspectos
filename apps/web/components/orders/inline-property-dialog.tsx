"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

type InlinePropertyDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPropertyCreated: (propertyId: string) => void;
  clientId?: string;
};

export function InlinePropertyDialog({ open, onOpenChange, onPropertyCreated, clientId }: InlinePropertyDialogProps) {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    zipCode: "",
    propertyType: "single-family",
    yearBuilt: "",
    squareFeet: "",
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.addressLine1.trim()) {
      toast.error("Address is required");
      return;
    }

    if (!form.city.trim() || !form.state.trim() || !form.zipCode.trim()) {
      toast.error("City, State, and Zip Code are required");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        address_line1: form.addressLine1.trim(),
        address_line2: form.addressLine2.trim() || null,
        city: form.city.trim(),
        state: form.state.trim(),
        zip_code: form.zipCode.trim(),
        property_type: form.propertyType,
        year_built: form.yearBuilt ? parseInt(form.yearBuilt, 10) : null,
        square_feet: form.squareFeet ? parseInt(form.squareFeet, 10) : null,
        notes: form.notes.trim() || null,
        client_id: clientId || null,
      };

      const response = await fetch("/api/admin/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error?.message || "Failed to create property");
      }

      const result = await response.json();
      toast.success("Property created");
      onPropertyCreated(result.data.id);
      queryClient.invalidateQueries({ queryKey: ["properties"] });
      onOpenChange(false);
      setForm({
        addressLine1: "",
        addressLine2: "",
        city: "",
        state: "",
        zipCode: "",
        propertyType: "single-family",
        yearBuilt: "",
        squareFeet: "",
        notes: "",
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create property");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Property</DialogTitle>
          <DialogDescription>
            Add a new property to your database and link to this order.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="property-address1">
              Address <span className="text-destructive">*</span>
            </Label>
            <Input
              id="property-address1"
              value={form.addressLine1}
              onChange={(e) => setForm((prev) => ({ ...prev, addressLine1: e.target.value }))}
              placeholder="123 Main Street"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="property-address2">Address Line 2</Label>
            <Input
              id="property-address2"
              value={form.addressLine2}
              onChange={(e) => setForm((prev) => ({ ...prev, addressLine2: e.target.value }))}
              placeholder="Apt 4B"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="property-city">
                City <span className="text-destructive">*</span>
              </Label>
              <Input
                id="property-city"
                value={form.city}
                onChange={(e) => setForm((prev) => ({ ...prev, city: e.target.value }))}
                placeholder="San Francisco"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="property-state">
                State <span className="text-destructive">*</span>
              </Label>
              <Input
                id="property-state"
                value={form.state}
                onChange={(e) => setForm((prev) => ({ ...prev, state: e.target.value }))}
                placeholder="CA"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="property-zip">
                Zip Code <span className="text-destructive">*</span>
              </Label>
              <Input
                id="property-zip"
                value={form.zipCode}
                onChange={(e) => setForm((prev) => ({ ...prev, zipCode: e.target.value }))}
                placeholder="94102"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="property-type">Property Type</Label>
              <Select value={form.propertyType} onValueChange={(value) => setForm((prev) => ({ ...prev, propertyType: value }))}>
                <SelectTrigger id="property-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single-family">Single-Family</SelectItem>
                  <SelectItem value="condo-townhome">Condo / Townhome</SelectItem>
                  <SelectItem value="commercial">Commercial</SelectItem>
                  <SelectItem value="multi-family">Multi-Family</SelectItem>
                  <SelectItem value="manufactured">Manufactured</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="property-year-built">Year Built</Label>
              <Input
                id="property-year-built"
                type="number"
                value={form.yearBuilt}
                onChange={(e) => setForm((prev) => ({ ...prev, yearBuilt: e.target.value }))}
                placeholder="2020"
                min="1800"
                max={new Date().getFullYear() + 1}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="property-square-feet">Square Feet</Label>
              <Input
                id="property-square-feet"
                type="number"
                value={form.squareFeet}
                onChange={(e) => setForm((prev) => ({ ...prev, squareFeet: e.target.value }))}
                placeholder="2000"
                min="0"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="property-notes">Notes</Label>
            <Textarea
              id="property-notes"
              value={form.notes}
              onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
              placeholder="Additional property details..."
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Property
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
