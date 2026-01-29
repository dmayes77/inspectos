"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Plus } from "lucide-react";
import { PropertyFormSections, PropertyFormErrors, createEmptyPropertyFormState, validatePropertyForm } from "@/components/properties/property-form-sections";
import { useCreateProperty } from "@/hooks/use-properties";

const basementOptions = ["none", "unfinished", "finished", "partial"] as const;
const buildingClassOptions = ["A", "B", "C"] as const;
const laundryOptions = ["in-unit", "shared", "none"] as const;

const normalizeOptionValue = <T extends string>(value: string | null | undefined, options: readonly T[]) => {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  return options.find((option) => option.toLowerCase() === normalized) ?? null;
};

type InlinePropertyDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPropertyCreated: (propertyId: string) => void;
  clientId?: string;
};

export function InlinePropertyDialog({ open, onOpenChange, onPropertyCreated, clientId }: InlinePropertyDialogProps) {
  const tenantSlug = process.env.NEXT_PUBLIC_SUPABASE_TENANT_ID ?? "demo";
  const createProperty = useCreateProperty();
  const [form, setForm] = useState(() => {
    const initial = createEmptyPropertyFormState();
    return clientId ? { ...initial, clientId } : initial;
  });
  const [errors, setErrors] = useState<PropertyFormErrors>({});

  useEffect(() => {
    if (!open || !clientId || form.clientId) return;
    setForm((prev) => ({ ...prev, clientId }));
  }, [clientId, open, form.clientId]);

  const resetForm = () => {
    const empty = createEmptyPropertyFormState();
    setForm(clientId ? { ...empty, clientId } : empty);
    setErrors({});
  };

  const handleDialogChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const validationErrors = validatePropertyForm(form);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    const basementValue = normalizeOptionValue(form.basement, basementOptions);
    const buildingClassValue = normalizeOptionValue(form.buildingClass, buildingClassOptions);
    const laundryValue = normalizeOptionValue(form.laundryType, laundryOptions);

    try {
      const created = await createProperty.mutateAsync({
        tenant_slug: tenantSlug,
        address_line1: form.addressLine1.trim(),
        address_line2: form.addressLine2.trim() || null,
        city: form.city.trim(),
        state: form.state.trim(),
        zip_code: form.zipCode.trim(),
        property_type: form.propertyType as any,
        year_built: form.yearBuilt ? parseInt(form.yearBuilt, 10) : null,
        square_feet: form.squareFeet ? parseInt(form.squareFeet, 10) : null,
        notes: form.notes.trim() || null,
        client_id: form.clientId || clientId || null,
        bedrooms: form.bedrooms ? parseInt(form.bedrooms, 10) : null,
        bathrooms: form.bathrooms ? parseFloat(form.bathrooms) : null,
        stories: form.stories || null,
        foundation: form.foundation || null,
        garage: form.garage || null,
        pool: form.pool,
        basement: basementValue,
        lot_size_acres: form.lotSizeAcres ? parseFloat(form.lotSizeAcres) : null,
        heating_type: form.heatingType || null,
        cooling_type: form.coolingType || null,
        roof_type: form.roofType || null,
        building_class: buildingClassValue,
        loading_docks: form.loadingDocks ? parseInt(form.loadingDocks, 10) : null,
        zoning: form.zoning || null,
        occupancy_type: form.occupancyType || null,
        ceiling_height: form.ceilingHeight ? parseFloat(form.ceilingHeight) : null,
        number_of_units: form.numberOfUnits ? parseInt(form.numberOfUnits, 10) : null,
        unit_mix: form.unitMix || null,
        laundry_type: laundryValue,
        parking_spaces: form.parkingSpaces ? parseInt(form.parkingSpaces, 10) : null,
        elevator: form.elevator,
      });

      onPropertyCreated(created.id);
      handleDialogChange(false);
      resetForm();
    } catch (error) {
      // handled by mutation
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Create New Property</DialogTitle>
            <DialogDescription>Reuse the full property form without leaving the order.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <PropertyFormSections form={form} setForm={setForm} errors={errors} setErrors={setErrors} showOwnerSection={false} />
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => handleDialogChange(false)} disabled={createProperty.isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={createProperty.isPending}>
              {createProperty.isPending ? (
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
