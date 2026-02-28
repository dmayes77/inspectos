"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { IdPageLayout } from "@/components/shared/id-page-layout";
import { SaveButton } from "@/components/shared/action-buttons";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useCreateProperty } from "@/hooks/use-properties";
import { useClients } from "@/hooks/use-clients";
import { InlineClientDialog } from "@/components/orders/inline-client-dialog";
import { PropertyFormSections, PropertyFormErrors, createEmptyPropertyFormState, validatePropertyForm } from "@/components/properties/property-form-sections";
import { toSlugIdSegment } from "@/lib/routing/slug-id";

const basementOptions = ["none", "unfinished", "finished", "partial"] as const;
const buildingClassOptions = ["A", "B", "C"] as const;
const laundryOptions = ["in-unit", "shared", "none"] as const;

const normalizeOptionValue = <T extends string>(value: string | null | undefined, options: readonly T[]) => {
  if (!value) return undefined;
  const normalized = value.trim().toLowerCase();
  return options.find((option) => option.toLowerCase() === normalized);
};

export default function NewPropertyPage() {
  const router = useRouter();
  const createProperty = useCreateProperty();
  const { data: clientsData } = useClients();
  const clients = clientsData ?? [];
  const [form, setForm] = useState(createEmptyPropertyFormState());
  const [errors, setErrors] = useState<PropertyFormErrors>({});
  const [showClientDialog, setShowClientDialog] = useState(false);

  const handleClientCreated = (clientId: string) => {
    setForm((prev) => ({ ...prev, clientId }));
  };

  const handleCreate = async () => {
    const validationErrors = validatePropertyForm(form);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    const basementValue = normalizeOptionValue(form.basement, basementOptions) ?? null;
    const buildingClassValue = normalizeOptionValue(form.buildingClass, buildingClassOptions) ?? null;
    const laundryValue = normalizeOptionValue(form.laundryType, laundryOptions) ?? null;

    try {
      const result = await createProperty.mutateAsync({
        address_line1: form.addressLine1.trim(),
        address_line2: form.addressLine2.trim() || null,
        city: form.city.trim(),
        state: form.state.trim(),
        zip_code: form.zipCode.trim(),
        property_type: form.propertyType as "single-family" | "condo-townhome" | "multi-family" | "manufactured" | "commercial",
        year_built: form.yearBuilt ? parseInt(form.yearBuilt, 10) : null,
        square_feet: form.squareFeet ? parseInt(form.squareFeet, 10) : null,
        notes: form.notes.trim() || null,
        client_id: form.clientId || null,
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

      router.push(
        `/properties/${toSlugIdSegment(
          `${result.address_line1 ?? form.addressLine1} ${result.city ?? form.city} ${result.state ?? form.state}`,
          result.public_id ?? result.id
        )}`
      );
    } catch {
      // Error surfaced by mutation hooks/toasts
    }
  };

  return (
    <>
      <IdPageLayout
        title="Add Property"
        description="Create a new property record in your workspace"
        breadcrumb={
          <>
            <Link href="/properties" className="text-muted-foreground transition hover:text-foreground">
              Properties
            </Link>
            <span className="text-muted-foreground">{">"}</span>
            <span className="max-w-[20rem] truncate font-medium">New Property</span>
          </>
        }
        left={
          <PropertyFormSections
            form={form}
            setForm={setForm}
            errors={errors}
            setErrors={setErrors}
            clients={clients}
            onOpenClientDialog={() => setShowClientDialog(true)}
          />
        }
        right={
          <>
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <SaveButton className="w-full" label="Create Property" savingLabel="Creating..." onClick={handleCreate} isSaving={createProperty.isPending} />
                <Button type="button" variant="outline" className="w-full" asChild>
                  <Link href="/properties">Cancel</Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Tips</CardTitle>
                <CardDescription>Keep this profile complete for smoother order scheduling.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>Required fields are marked with an asterisk (*).</p>
                <p>Assign a primary contact to speed dispatch handoffs.</p>
                <p>You can add detailed attributes now or update them later.</p>
              </CardContent>
            </Card>
          </>
        }
      />
      <InlineClientDialog open={showClientDialog} onOpenChange={setShowClientDialog} onClientCreated={handleClientCreated} />
    </>
  );
}
