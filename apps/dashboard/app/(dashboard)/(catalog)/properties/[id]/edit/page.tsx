"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/layout/page-header";
import { Button } from "@/components/ui/button";
import { Loader2, Save } from "lucide-react";
import { useProperty, useUpdateProperty } from "@/hooks/use-properties";
import { useClients } from "@/hooks/use-clients";
import { InlineClientDialog } from "@/components/orders/inline-client-dialog";
import { COOLING_OPTIONS, FOUNDATION_OPTIONS, GARAGE_OPTIONS, HEATING_OPTIONS, ROOF_OPTIONS } from "@inspectos/shared/constants/property-options";
import { ResourceFormLayout } from "@/components/shared/resource-form-layout";
import { ResourceFormSidebar } from "@/components/shared/resource-form-sidebar";
import {
  PropertyFormErrors,
  PropertyFormSections,
  PropertyFormState,
  createEmptyPropertyFormState,
  validatePropertyForm,
} from "@/components/properties/property-form-sections";

export default function EditPropertyPage() {
  const params = useParams();
  const router = useRouter();
  const propertyId = params.id as string;

  const { data: property, isLoading } = useProperty(propertyId);
  const updateProperty = useUpdateProperty(propertyId);
  const { data: clientsData } = useClients();
  const clients = clientsData ?? [];
  const allowedPropertyTypes = new Set(["single-family", "condo-townhome", "multi-family", "manufactured", "commercial"]);
  const basementOptions = ["none", "unfinished", "finished", "partial"] as const;
  const buildingClassOptions = ["A", "B", "C"] as const;
  const laundryOptions = ["in-unit", "shared", "none"] as const;

  const normalizeOptionValue = <T extends string>(value: string | null | undefined, options: readonly T[]): T | undefined => {
    if (!value) return undefined;
    const normalized = value.trim().toLowerCase();
    const match = options.find((option) => option.toLowerCase() === normalized);
    return match ?? undefined;
  };

  const [form, setForm] = useState<PropertyFormState>(createEmptyPropertyFormState());
  const [errors, setErrors] = useState<PropertyFormErrors>({});
  const [showClientDialog, setShowClientDialog] = useState(false);
  const [formInitialized, setFormInitialized] = useState(false);

  const handleClientCreated = (clientId: string) => {
    setForm((prev) => ({ ...prev, clientId }));
  };

  // Populate form when property loads
  useEffect(() => {
    if (property && !formInitialized) {
      setForm({
        addressLine1: property.address_line1,
        addressLine2: property.address_line2 || "",
        city: property.city,
        state: property.state,
        zipCode: property.zip_code,
        propertyType: allowedPropertyTypes.has(property.property_type) ? property.property_type : "single-family",
        yearBuilt: property.year_built?.toString() || "",
        squareFeet: property.square_feet?.toString() || "",
        notes: property.notes || "",
        clientId: property.client_id || "",
        bedrooms: property.bedrooms?.toString() || "",
        bathrooms: property.bathrooms?.toString() || "",
        stories: property.stories || "",
        foundation: normalizeOptionValue(property.foundation, FOUNDATION_OPTIONS) ?? "",
        garage: normalizeOptionValue(property.garage, GARAGE_OPTIONS) ?? "",
        pool: property.pool ?? false,
        basement: normalizeOptionValue(property.basement, basementOptions) ?? "",
        lotSizeAcres: property.lot_size_acres?.toString() || "",
        heatingType: normalizeOptionValue(property.heating_type, HEATING_OPTIONS) ?? "",
        coolingType: normalizeOptionValue(property.cooling_type, COOLING_OPTIONS) ?? "",
        roofType: normalizeOptionValue(property.roof_type, ROOF_OPTIONS) ?? "",
        buildingClass: normalizeOptionValue(property.building_class, buildingClassOptions) ?? "",
        loadingDocks: property.loading_docks?.toString() || "",
        zoning: property.zoning || "",
        occupancyType: property.occupancy_type || "",
        ceilingHeight: property.ceiling_height?.toString() || "",
        numberOfUnits: property.number_of_units?.toString() || "",
        unitMix: property.unit_mix || "",
        laundryType: normalizeOptionValue(property.laundry_type, laundryOptions) ?? "",
        parkingSpaces: property.parking_spaces?.toString() || "",
        elevator: property.elevator ?? false,
      });
      setFormInitialized(true);
    }
  }, [property, formInitialized]);

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
      await updateProperty.mutateAsync({
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

      router.push(`/properties/${propertyId}`);
    } catch (error) {
      console.error("Property update failed:", error);
      // Error handled by mutation
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-100">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!property) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Property Not Found"
          description="The property you're looking for doesn't exist or you don't have access."
        />
      </div>
    );
  }

  if (!formInitialized) {
    return (
      <div className="flex items-center justify-center min-h-100">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
    <div className="space-y-6">
      <PageHeader
        title="Edit Property"
        description="Update the property details to keep inspections accurate."
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
                  <Button type="submit" className="w-full" disabled={updateProperty.isPending}>
                    {updateProperty.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => router.push(`/properties/${propertyId}`)}
                    disabled={updateProperty.isPending}
                  >
                    Cancel
                  </Button>
                </>
              }
              tips={[
                "• Required fields are marked with an asterisk (*)",
                "• Changes will be saved immediately",
                "• You can change the owner/contact anytime",
              ]}
            />
          }
        />
      </form>

      <InlineClientDialog open={showClientDialog} onOpenChange={setShowClientDialog} onClientCreated={handleClientCreated} />
    </div>
    </>
  );
}
