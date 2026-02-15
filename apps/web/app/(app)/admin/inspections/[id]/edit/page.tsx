"use client";
import { useState, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AdminPageHeader } from "@/components/layout/admin-page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ClientInlineForm } from "@/components/ui/client-inline-form";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useServices } from "@/hooks/use-services";
import { useGet } from "@/hooks/crud";
import type { Inspection, InspectionStatusValue } from "@/types/inspection";
import { useClients } from "@/hooks/use-clients";
import { useInspectors } from "@/hooks/use-team";
import { useUpdateInspection, useCreateInspection } from "@/hooks/use-inspections";
import { useApiClient } from "@/lib/api/tenant-context";
import { useOrderById } from "@/hooks/use-orders";
import { FOUNDATION_OPTIONS, GARAGE_OPTIONS, STORY_OPTIONS } from "@inspectos/shared/constants/property-options";
import { calculateServiceTotal } from "@inspectos/shared/utils/pricing";
import { toast } from "sonner";
import type { ServiceType } from "@/types/service";
import { Loader2, Save } from "lucide-react";
import { ResourceFormLayout } from "@/components/shared/resource-form-layout";
import { ResourceFormSidebar } from "@/components/shared/resource-form-sidebar";
import { InspectionVendorSection } from "@/components/inspections/inspection-vendor-section";

// Helper function to safely extract string from FormData (defined outside component for performance)
const getString = (value: FormDataEntryValue | undefined): string | undefined => {
  return typeof value === "string" ? value : undefined;
};

// Memoized service checkbox component to prevent unnecessary re-renders
const ServiceCheckbox = ({ service, checked, onToggle }: { service: ServiceType; checked: boolean; onToggle: (id: string, checked: boolean) => void }) => {
  return (
    <label className="flex items-center gap-2">
      <Checkbox name="types" value={service.serviceId} checked={checked} onCheckedChange={(isChecked) => onToggle(service.serviceId, isChecked === true)} />
      <span>{service.name}</span>
      {service.isPackage && (
        <Badge variant="secondary" className="ml-1 text-xs">
          Package
        </Badge>
      )}
      {typeof service.price === "number" && <span className="ml-1 text-xs text-muted-foreground">${service.price.toFixed(2)}</span>}
    </label>
  );
};

export default function EditInspectionPage(props: { isNew?: boolean; orderId?: string } = {}) {
  const params = useParams();
  const router = useRouter();
  const apiClient = useApiClient();
  const { data: services = [] } = useServices();
  const [selectedTypeIds, setSelectedTypeIds] = useState<string[]>([]);
  const { data: clientsData = [] } = useClients();
  const clients = clientsData;
  const [showClientForm, setShowClientForm] = useState(false);

  const { orderId, isNew } = props;
  const { data: linkedOrder } = useOrderById(orderId ?? "");

  // Get inspection by ID
  const inspectionId = typeof params.id === "string" ? params.id : undefined;
  const { data: inspection } = useGet<Inspection | null>(inspectionId ? `inspection-${inspectionId}` : "inspection-new", async () => {
    if (!inspectionId || isNew) return null;
    try {
      return await apiClient.get<Inspection>(`/admin/inspections/${inspectionId}`);
    } catch {
      return null;
    }
  });

  const [selectedClientId, setSelectedClientId] = useState<string>(inspection?.order?.client?.id || "");
  const [selectedInspectorId, setSelectedInspectorId] = useState<string>(inspection?.inspector_id || "");
  const [selectedVendorIds, setSelectedVendorIds] = useState<string[]>(
    inspection?.vendorIds && Array.isArray(inspection.vendorIds) ? inspection.vendorIds : []
  );
  const { data: inspectors = [] } = useInspectors();
  const orderProperty = linkedOrder?.property;

  // React Query mutations
  const updateMutation = useUpdateInspection();
  const createMutation = useCreateInspection();

  // Derive submitting state from mutations
  const isSubmitting = updateMutation.isPending || createMutation.isPending;

  // Parse address using utility function (memoized)
  const addressParts = useMemo(() => {
    const property = inspection?.order?.property || orderProperty;
    if (property) {
      return {
        street: property.address_line1,
        city: property.city,
        state: property.state,
        zip: property.zip_code,
      };
    }
    return { street: "", city: "", state: "", zip: "" };
  }, [inspection, orderProperty]);

  const { street, city, state, zip } = addressParts;
  const resolvedClientId = selectedClientId || inspection?.order?.client?.id || linkedOrder?.client?.id || "";
  const resolvedInspectorId = selectedInspectorId || inspection?.inspector_id || linkedOrder?.inspector?.id || "";
  const resolvedTypeIds = useMemo(() => {
    if (selectedTypeIds.length) return selectedTypeIds;
    if (Array.isArray(inspection?.selected_type_ids)) return inspection.selected_type_ids;
    return [];
  }, [inspection, selectedTypeIds]);

  // Calculate price using utility function (memoized)
  const calculatedPrice = useMemo(() => {
    return calculateServiceTotal(resolvedTypeIds, services);
  }, [resolvedTypeIds, services]);

  const { coreServices, addonServices, packageServices } = useMemo(() => {
    const core = services.filter((service) => service.category === "core" && !service.isPackage);
    const addons = services.filter((service) => service.category === "addon" && !service.isPackage);
    const packages = services.filter((service) => service.isPackage);
    return { coreServices: core, addonServices: addons, packageServices: packages };
  }, [services]);

  // Memoized form submission handler
  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      const formData = new FormData(e.currentTarget);
      const raw = Object.fromEntries(formData);

      // Basic validation
      if (!resolvedInspectorId) {
        toast.error("Please select an inspector");
        return;
      }

      if (resolvedTypeIds.length === 0) {
        toast.error("Please select at least one service");
        return;
      }

      // Build payload with proper typing (no type assertions needed)
      const statusValue = getString(raw.status) || "draft";
      const payload: Partial<Inspection> & { orderId?: string } = {
        selected_type_ids: resolvedTypeIds,
        inspector_id: resolvedInspectorId,
        status: statusValue as InspectionStatusValue,
        notes: getString(raw.notes) || "",
        order_id: orderId || null,
        vendorIds: selectedVendorIds,
      };

      // Use React Query mutations with proper error handling
      if (inspection?.id) {
        updateMutation.mutate(
          { inspectionId: inspection.id, ...payload },
          {
            onSuccess: () => {
              toast.success("Inspection updated successfully");
              router.push(`/admin/inspections/${inspection.id}`);
            },
            onError: (error) => {
              const errorMessage = error instanceof Error ? error.message : "Failed to update inspection";
              toast.error(errorMessage);
            },
          },
        );
      } else {
        createMutation.mutate(payload, {
          onSuccess: (data) => {
            toast.success("Inspection created successfully");
            router.push(data?.id ? `/admin/inspections/${data.id}` : "/admin/inspections");
          },
          onError: (error) => {
            const errorMessage = error instanceof Error ? error.message : "Failed to create inspection";
            toast.error(errorMessage);
          },
        });
      }
    },
    [
      resolvedTypeIds,
      resolvedInspectorId,
      inspection,
      updateMutation,
      createMutation,
      router,
      orderId,
      selectedVendorIds,
    ],
  );

  // Format default values using formatters
  // Note: These fields don't exist in the database schema, keeping for UI only
  const poolDefaultValue = "no";
  const storiesDefaultValue = "1";
  const garageDefaultValue = "None";
  const foundationDefaultValue = "Slab";
  const handleClientCreate = useCallback(
    (client: { name: string; email: string }) => {
      const newClient = {
        clientId: Math.random().toString(36).slice(2),
        name: client.name,
        email: client.email,
        phone: "",
        type: "Homebuyer",
        inspections: 0,
        lastInspection: "",
        totalSpent: 0,
        archived: false,
      };
      setSelectedClientId(newClient.clientId);
      setShowClientForm(false);
      toast.success("Client created. Please refresh to see in list.");
    },
    [setSelectedClientId, setShowClientForm],
  );
  const handleClientCancel = useCallback(() => setShowClientForm(false), [setShowClientForm]);
  const handleClientSelect = useCallback(
    (value: string) => {
      if (value === "__add_new_client__") {
        setShowClientForm(true);
      } else {
        setSelectedClientId(value);
      }
    },
    [setSelectedClientId, setShowClientForm],
  );
  const handleInspectorSelect = useCallback((value: string) => setSelectedInspectorId(value), [setSelectedInspectorId]);
  const handleServiceToggle = useCallback(
    (serviceId: string, isChecked: boolean) => {
      setSelectedTypeIds((ids) => {
        const base = ids.length ? ids : resolvedTypeIds;
        if (isChecked) {
          return Array.from(new Set([...base, serviceId]));
        }
        return base.filter((id) => id !== serviceId);
      });
    },
    [resolvedTypeIds],
  );

  return (
    <>
    <div className="space-y-4 w-full">

      <AdminPageHeader
        title={inspection ? "Edit Inspection" : "New Inspection"}
        description={inspection ? `Update inspection ${inspection.id}` : "Create a new inspection appointment"}
      />

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <ResourceFormLayout
          left={
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Property Information</CardTitle>
                  <CardDescription>Enter the property address and details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="street">Street Address</Label>
                    <Input id="street" name="street" placeholder="123 Main Street" defaultValue={street} required />
                  </div>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input id="city" name="city" placeholder="Austin" defaultValue={city} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">State</Label>
                      <Input id="state" name="state" placeholder="TX" maxLength={2} defaultValue={state} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="zip">ZIP Code</Label>
                      <Input id="zip" name="zip" placeholder="78701" maxLength={5} defaultValue={zip} required />
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="sqft">Square Footage (optional)</Label>
                      <Input
                        id="sqft"
                        name="sqft"
                        type="number"
                        placeholder="2400"
                        defaultValue={inspection?.order?.property?.square_feet || orderProperty?.square_feet || ""}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="yearBuilt">Year Built (optional)</Label>
                      <Input
                        id="yearBuilt"
                        name="yearBuilt"
                        type="number"
                        placeholder="1985"
                        min="1800"
                        max={new Date().getFullYear()}
                        defaultValue={inspection?.order?.property?.year_built || orderProperty?.year_built || ""}
                      />
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="propertyType">Property Type</Label>
                      <Input
                        id="propertyType"
                        name="propertyType"
                        placeholder="Single Family"
                        defaultValue={inspection?.order?.property?.property_type || orderProperty?.property_type || ""}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bedrooms">Bedrooms (optional)</Label>
                      <Input
                        id="bedrooms"
                        name="bedrooms"
                        type="number"
                        min="1"
                        step="1"
                        placeholder="4"
                        defaultValue=""
                        onFocus={(event) => {
                          if (!event.currentTarget.value) {
                            event.currentTarget.value = "1";
                          }
                        }}
                      />
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="bathrooms">Bathrooms (optional)</Label>
                      <Input
                        id="bathrooms"
                        name="bathrooms"
                        type="number"
                        min="1"
                        step="0.5"
                        placeholder="2.5"
                        defaultValue=""
                        onChange={(event) => {
                          const numeric = Number(event.currentTarget.value);
                          if (!Number.isNaN(numeric) && numeric > 4) {
                            event.currentTarget.value = String(Math.round(numeric));
                          }
                        }}
                        onFocus={(event) => {
                          if (!event.currentTarget.value) {
                            event.currentTarget.value = "1";
                          }
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="stories">Stories</Label>
                      <Select name="stories" defaultValue={storiesDefaultValue}>
                        <SelectTrigger id="stories">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          {STORY_OPTIONS.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="foundation">Foundation</Label>
                      <Select name="foundation" defaultValue={foundationDefaultValue}>
                        <SelectTrigger id="foundation">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          {FOUNDATION_OPTIONS.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="garage">Garage</Label>
                      <Select name="garage" defaultValue={garageDefaultValue}>
                        <SelectTrigger id="garage">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          {GARAGE_OPTIONS.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pool">Pool</Label>
                    <Select name="pool" defaultValue={poolDefaultValue}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">Yes</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Client</CardTitle>
                  <CardDescription>Choose who ordered this inspection</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="client">Client</Label>
                    {showClientForm ? (
                      <ClientInlineForm onCreate={handleClientCreate} onCancel={handleClientCancel} />
                    ) : (
                      <Select name="client" value={resolvedClientId} required onValueChange={handleClientSelect}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a client" />
                        </SelectTrigger>
                        <SelectContent>
                          {clients.map((client) => (
                            <SelectItem key={client.clientId} value={client.clientId}>
                              {client.name}
                            </SelectItem>
                          ))}
                          <SelectItem value="__add_new_client__" className="text-blue-600 font-semibold">
                            + Add New Client
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Inspection Details</CardTitle>
                  <div className="text-muted-foreground text-sm mb-2">Assign the inspector, services, date, and time</div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="inspector">Inspector</Label>
                    <Select name="inspector" value={resolvedInspectorId} required onValueChange={handleInspectorSelect}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select an inspector" />
                      </SelectTrigger>
                      <SelectContent>
                        {inspectors.map((inspector) => (
                          <SelectItem key={inspector.teamMemberId} value={inspector.teamMemberId}>
                            {inspector.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {/* Vendor Assignment Section */}
                  <div className="space-y-2">
                    <InspectionVendorSection selectedVendorIds={selectedVendorIds} onChange={setSelectedVendorIds} />
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Core Services</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {coreServices.map((service) => {
                          const checked = resolvedTypeIds.includes(service.serviceId);
                          return <ServiceCheckbox key={service.serviceId} service={service} checked={checked} onToggle={handleServiceToggle} />;
                        })}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Add-ons</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {addonServices.map((service) => {
                          const checked = resolvedTypeIds.includes(service.serviceId);
                          return <ServiceCheckbox key={service.serviceId} service={service} checked={checked} onToggle={handleServiceToggle} />;
                        })}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Packages</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {packageServices.map((service) => {
                          const checked = resolvedTypeIds.includes(service.serviceId);
                          return <ServiceCheckbox key={service.serviceId} service={service} checked={checked} onToggle={handleServiceToggle} />;
                        })}
                      </div>
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="date">Date (optional)</Label>
                      <Input
                        id="date"
                        name="date"
                        type="date"
                        defaultValue={inspection?.order?.scheduled_date || linkedOrder?.scheduled_date || ""}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="time">Time (optional)</Label>
                      <Input id="time" name="time" type="time" defaultValue="" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select name="status" defaultValue={inspection?.status || "draft"}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="submitted">Submitted</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="price">Price ($)</Label>
                    <Input id="price" name="price" type="number" step="0.01" value={calculatedPrice} readOnly required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes (optional)</Label>
                    <Textarea
                      id="notes"
                      name="notes"
                      placeholder="Add any special instructions or notes..."
                      rows={4}
                      defaultValue={inspection?.notes || ""}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          }
          right={
            <ResourceFormSidebar
              actions={
                <>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        {inspection ? "Save Changes" : "Create Inspection"}
                      </>
                    )}
                  </Button>
                  <Button type="button" variant="outline" asChild>
                    <Link href={inspection ? `/admin/inspections/${inspection.id}` : "/admin/inspections"}>Cancel</Link>
                  </Button>
                </>
              }
              tips={[
                "Pick at least one service to auto-calculate the inspection price.",
                "Choose an inspector before setting a final status.",
                "Use the notes field for access instructions or hazards.",
              ]}
              tipTitle="Quick Tips"
            />
          }
        />
      </form>
    </div>
    </>
  );
}
