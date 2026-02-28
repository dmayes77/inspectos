"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { IdPageLayout } from "@/components/shared/id-page-layout";
import { SaveButton } from "@/components/shared/action-buttons";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { useProperty, useUpdateProperty } from "@/hooks/use-properties";
import { useClients } from "@/hooks/use-clients";
import { useOrders } from "@/hooks/use-orders";
import { useAgents } from "@/hooks/use-agents";
import { InlineClientDialog } from "@/components/orders/inline-client-dialog";
import { COOLING_OPTIONS, FOUNDATION_OPTIONS, GARAGE_OPTIONS, HEATING_OPTIONS, ROOF_OPTIONS } from "@inspectos/shared/constants/property-options";
import {
  PropertyFormErrors,
  PropertyFormSections,
  PropertyFormState,
  createEmptyPropertyFormState,
  validatePropertyForm,
} from "@/components/properties/property-form-sections";

const basementOptions = ["none", "unfinished", "finished", "partial"] as const;
const buildingClassOptions = ["A", "B", "C"] as const;
const laundryOptions = ["in-unit", "shared", "none"] as const;

const normalizeOptionValue = <T extends string>(value: string | null | undefined, options: readonly T[]): T | undefined => {
  if (!value) return undefined;
  const normalized = value.trim().toLowerCase();
  const match = options.find((option) => option.toLowerCase() === normalized);
  return match ?? undefined;
};

export default function PropertyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const propertyId = params.id as string;

  const { data: property, isLoading } = useProperty(propertyId);
  const updateProperty = useUpdateProperty(propertyId);
  const { data: clientsData } = useClients();
  const { data: agents = [] } = useAgents();
  const { data: allOrders = [] } = useOrders();
  const clients = clientsData ?? [];
  const allowedPropertyTypes = new Set(["single-family", "condo-townhome", "multi-family", "manufactured", "commercial"]);

  const [form, setForm] = useState<PropertyFormState>(createEmptyPropertyFormState());
  const [errors, setErrors] = useState<PropertyFormErrors>({});
  const [showClientDialog, setShowClientDialog] = useState(false);
  const [formInitialized, setFormInitialized] = useState(false);

  const propertyOrders = useMemo(() => {
    if (!property) return [];
    return allOrders
      .filter((order) => order.property_id === property.id)
      .sort((a, b) => {
        const aDate = new Date(a.scheduled_date ?? a.created_at).getTime();
        const bDate = new Date(b.scheduled_date ?? b.created_at).getTime();
        return bDate - aDate;
      })
      .slice(0, 5);
  }, [allOrders, property]);

  const ownerHistory = useMemo(() => {
    return [...(property?.owners ?? [])].sort((a, b) => {
      const aTime = new Date(a.startDate).getTime();
      const bTime = new Date(b.startDate).getTime();
      return bTime - aTime;
    });
  }, [property?.owners]);

  const currentPrimaryOwner =
    ownerHistory.find((owner) => owner.isPrimary && owner.endDate === null) ??
    ownerHistory.find((owner) => owner.endDate === null) ??
    null;

  const recentOrderWithContact = useMemo(() => {
    return propertyOrders.find((order) => order.agent_id || order.client_id || order.agent || order.client) ?? null;
  }, [propertyOrders]);

  const primaryContact = useMemo(() => {
    if (currentPrimaryOwner?.client) {
      return {
        kind: "client" as const,
        source: "Property owner record",
        name: currentPrimaryOwner.client.name,
        email: currentPrimaryOwner.client.email,
        phone: currentPrimaryOwner.client.phone,
      };
    }

    const propertyClientId = form.clientId || property?.client_id || null;
    if (propertyClientId) {
      const propertyClient = clients.find((client) => client.clientId === propertyClientId);
      if (propertyClient) {
        return {
          kind: "client" as const,
          source: "Property contact",
          name: propertyClient.name,
          email: propertyClient.email,
          phone: propertyClient.phone,
        };
      }
    }

    if (recentOrderWithContact?.agent_id || recentOrderWithContact?.agent) {
      const orderAgent =
        recentOrderWithContact.agent ??
        agents.find((agent) => agent.id === recentOrderWithContact.agent_id) ??
        null;
      if (orderAgent) {
        return {
          kind: "agent" as const,
          source: "Most recent order",
          name: orderAgent.name,
          email: orderAgent.email ?? null,
          phone: orderAgent.phone ?? null,
        };
      }
    }

    if (recentOrderWithContact?.client_id || recentOrderWithContact?.client) {
      const orderClient =
        recentOrderWithContact.client ??
        clients.find((client) => client.clientId === recentOrderWithContact.client_id) ??
        null;
      if (orderClient) {
        return {
          kind: "client" as const,
          source: "Most recent order",
          name: orderClient.name,
          email: orderClient.email ?? null,
          phone: orderClient.phone ?? null,
        };
      }
    }

    return null;
  }, [agents, clients, currentPrimaryOwner, form.clientId, property?.client_id, recentOrderWithContact]);

  const handleClientCreated = (clientId: string) => {
    setForm((prev) => ({ ...prev, clientId }));
  };

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
  }, [allowedPropertyTypes, formInitialized, property]);

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

      router.refresh();
    } catch (error) {
      console.error("Property update failed:", error);
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
        <IdPageLayout
          title="Property Not Found"
          description="The property you're looking for doesn't exist or you don't have access."
          left={null}
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

  const orderCreateHref = `/orders/new?propertyId=${property.id}${form.clientId ? `&clientId=${form.clientId}` : ""}`;

  return (
    <>
      <form onSubmit={handleSubmit}>
        <IdPageLayout
          title={property.address_line1}
          description={`${property.city}, ${property.state} ${property.zip_code} • Property workspace`}
          breadcrumb={
            <>
              <Link href="/properties" className="text-muted-foreground transition hover:text-foreground">
                Properties
              </Link>
              <span className="text-muted-foreground">{">"}</span>
              <span className="max-w-[20rem] truncate font-medium">{property.address_line1}</span>
            </>
          }
          left={
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Property Details</CardTitle>
                  <CardDescription>Manage the core property information for future orders.</CardDescription>
                </CardHeader>
              </Card>

              <PropertyFormSections
                form={form}
                setForm={setForm}
                errors={errors}
                setErrors={setErrors}
                clients={clients}
                showOwnerSection={false}
              />

              <Card>
                <CardHeader>
                  <CardTitle>Primary Contact</CardTitle>
                  <CardDescription>Select the main contact tied to this property.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Property Contact</p>
                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        value={form.clientId || ""}
                        onChange={(event) => setForm((prev) => ({ ...prev, clientId: event.target.value }))}
                        className="h-9 min-w-[220px] flex-1 rounded-md border border-input bg-background px-3 text-sm"
                      >
                        <option value="">No client selected</option>
                        {clients.map((client) => (
                          <option key={client.clientId} value={client.clientId}>
                            {client.name}
                          </option>
                        ))}
                      </select>
                      <Button type="button" variant="outline" size="sm" onClick={() => setShowClientDialog(true)}>
                        Create New Client
                      </Button>
                    </div>
                  </div>
                  {!form.clientId ? (
                    <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                      Primary contact is recommended before launching a new order.
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            </>
          }
          right={
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <SaveButton type="submit" className="w-full" isSaving={updateProperty.isPending} label="Save Property" />
                  <Button type="button" variant="outline" className="w-full" asChild>
                    <Link href={orderCreateHref}>Create New Order</Link>
                  </Button>
                  <Button type="button" variant="outline" className="w-full" onClick={() => router.push("/properties")} disabled={updateProperty.isPending}>
                    Cancel
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Tips</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <p>Required fields are marked with an asterisk (*).</p>
                  <p>Keep primary contact current to speed order creation.</p>
                  <p>Use recent orders to duplicate proven job setups.</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Primary Contact</CardTitle>
                  <CardDescription>Active contact for this property context.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {primaryContact ? (
                    <div className="rounded-md border p-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium">{primaryContact.name}</p>
                        <div className="flex items-center gap-2">
                          <Badge color="light">{primaryContact.kind === "agent" ? "Agent" : "Client"}</Badge>
                          <Badge color="light">Primary</Badge>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">{primaryContact.source}</p>
                      {primaryContact.email ? <p className="text-sm text-muted-foreground">{primaryContact.email}</p> : null}
                      {primaryContact.phone ? <p className="text-sm text-muted-foreground">{primaryContact.phone}</p> : null}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No primary contact attached yet.</p>
                  )}

                  {ownerHistory.length > 1 ? (
                    <div className="space-y-2">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Contact History</p>
                      {ownerHistory.slice(0, 4).map((owner) => (
                        <div key={owner.propertyOwnerId} className="flex items-center justify-between rounded-md border p-2 text-sm">
                          <span className="truncate">{owner.client?.name ?? "Unknown contact"}</span>
                          <span className="text-xs text-muted-foreground">{owner.endDate ? "Past" : "Current"}</span>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Orders</CardTitle>
                  <CardDescription>Latest activity tied to this property.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {propertyOrders.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No orders yet for this property.</p>
                  ) : (
                    propertyOrders.map((order) => (
                      <Link key={order.id} href={`/orders/${order.order_number ?? order.id}`} className="block rounded-md border p-3 transition hover:bg-accent">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-medium">{order.order_number}</p>
                          <Badge color="light" className="capitalize">{order.status.replaceAll("_", " ")}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {order.scheduled_date ?? "Unscheduled"}{order.scheduled_time ? ` at ${order.scheduled_time}` : ""}
                        </p>
                      </Link>
                    ))
                  )}
                </CardContent>
              </Card>
            </>
          }
        />
      </form>
      <InlineClientDialog open={showClientDialog} onOpenChange={setShowClientDialog} onClientCreated={handleClientCreated} />
    </>
  );
}
