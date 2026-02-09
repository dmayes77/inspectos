"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AdminShell } from "@/components/layout/admin-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Loader2, Save } from "lucide-react";
import { useCreateProperty } from "@/hooks/use-properties";
import { useClients } from "@/hooks/use-clients";
import { InlineClientDialog } from "@/components/orders/inline-client-dialog";
import { mockAdminUser } from "@inspectos/shared/constants/mock-users";
import { ResourceFormLayout } from "@/components/shared/resource-form-layout";
import { ResourceFormSidebar } from "@/components/shared/resource-form-sidebar";
import { PropertyFormSections, PropertyFormErrors, createEmptyPropertyFormState, validatePropertyForm } from "@/components/properties/property-form-sections";

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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
        property_type: form.propertyType as 'single-family' | 'condo-townhome' | 'multi-family' | 'manufactured' | 'commercial',
        year_built: form.yearBuilt ? parseInt(form.yearBuilt, 10) : null,
        square_feet: form.squareFeet ? parseInt(form.squareFeet, 10) : null,
        notes: form.notes.trim() || null,
        client_id: form.clientId || null,
        // Common details
        bedrooms: form.bedrooms ? parseInt(form.bedrooms, 10) : null,
        bathrooms: form.bathrooms ? parseFloat(form.bathrooms) : null,
        stories: form.stories || null,
        foundation: form.foundation || null,
        garage: form.garage || null,
        pool: form.pool,
        // Residential specific
        basement: basementValue,
        lot_size_acres: form.lotSizeAcres ? parseFloat(form.lotSizeAcres) : null,
        heating_type: form.heatingType || null,
        cooling_type: form.coolingType || null,
        roof_type: form.roofType || null,
        // Commercial specific
        building_class: buildingClassValue,
        loading_docks: form.loadingDocks ? parseInt(form.loadingDocks, 10) : null,
        zoning: form.zoning || null,
        occupancy_type: form.occupancyType || null,
        ceiling_height: form.ceilingHeight ? parseFloat(form.ceilingHeight) : null,
        // Multi-family specific
        number_of_units: form.numberOfUnits ? parseInt(form.numberOfUnits, 10) : null,
        unit_mix: form.unitMix || null,
        laundry_type: laundryValue,
        // Shared
        parking_spaces: form.parkingSpaces ? parseInt(form.parkingSpaces, 10) : null,
        elevator: form.elevator,
      });

      router.push(`/admin/properties/${result.id}`);
    } catch (error) {
      // Error handled by mutation
    }
  };

  return (
    <AdminShell user={mockAdminUser}>
      <div className="space-y-6">
        <PageHeader
          breadcrumb={
            <>
              <Link href="/admin/overview" className="hover:text-foreground">
                Overview
              </Link>
              <span className="text-muted-foreground">/</span>
              <Link href="/admin/properties" className="hover:text-foreground">
                Properties
              </Link>
            </>
          }
          title="Add New Property"
          description="Create a new property record in your database"
          backHref="/admin/properties"
        />

        <form onSubmit={handleSubmit}>
          <ResourceFormLayout
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
              <ResourceFormSidebar
                actions={
                  <>
                    <Button type="submit" className="w-full" disabled={createProperty.isPending}>
                      {createProperty.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Create Property
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => router.push("/admin/properties")}
                      disabled={createProperty.isPending}
                    >
                      Cancel
                    </Button>
                  </>
                }
                tips={[
                  "• Required fields are marked with an asterisk (*)",
                  "• You can assign an owner/contact now or later",
                  "• Property details can be edited at any time",
                ]}
              />
            }
          />
        </form>

        <InlineClientDialog open={showClientDialog} onOpenChange={setShowClientDialog} onClientCreated={handleClientCreated} />
      </div>
    </AdminShell>
  );
}
