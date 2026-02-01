"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Calendar, CheckCircle2, Clock, DollarSign, FileText, Loader2, MapPin, Plus, User, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { useCreateOrder, useUpdateOrder, type Order } from "@/hooks/use-orders";
import { useClients } from "@/hooks/use-clients";
import { useAgents } from "@/hooks/use-agents";
import { useInspectors } from "@/hooks/use-team";
import { useInspections } from "@/hooks/use-inspections";
import { useProperties, useCreateProperty, type Property } from "@/hooks/use-properties";
import { useServices, type Service } from "@/hooks/use-services";
import { InlineClientDialog } from "@/components/orders/inline-client-dialog";
import { InlineAgentDialog } from "@/components/orders/inline-agent-dialog";
import { PropertyFormSections, PropertyFormErrors, createEmptyPropertyFormState, validatePropertyForm } from "@/components/properties/property-form-sections";
import { InspectionDetailsSection } from "@/components/inspections/inspection-details-section";
import type { InspectionService } from "@/lib/data/orders";
import type { Inspection } from "@/hooks/use-inspections";
import { cn } from "@/lib/utils";
import { tryFormatDate } from "@/lib/utils/tryFormatDate";

const orderStatusOptions = ["pending", "scheduled", "in_progress", "pending_report", "delivered", "completed", "cancelled"] as const;

const paymentStatusOptions = ["unpaid", "partial", "paid", "refunded"] as const;

const basementOptions = ["none", "unfinished", "finished", "partial"] as const;
const buildingClassOptions = ["A", "B", "C"] as const;
const laundryOptions = ["in-unit", "shared", "none"] as const;

const normalizeOptionValue = <T extends string>(value: string | null | undefined, options: readonly T[]) => {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  return options.find((option) => option.toLowerCase() === normalized) ?? null;
};

type OrderFormState = {
  client_id: string | null;
  agent_id: string | null;
  inspector_id: string | null;
  property_id: string;
  scheduled_date: string;
  scheduled_time: string;
  duration_minutes: string;
  status: Order["status"];
  payment_status: Order["payment_status"];
  source: string;
  internal_notes: string;
  client_notes: string;
};

type OrderFormProps = {
  mode: "new" | "edit";
  order?: Order;
};

type LinkedInspectionDetails = {
  inspectorId: string | null;
  inspectorName: string | null;
  scheduledDate: string | null;
  scheduledTime: string | null;
  services: Service[];
};

function getPropertyLabel(property: Property) {
  return [property.address_line1, property.address_line2, `${property.city}, ${property.state} ${property.zip_code}`].filter(Boolean).join(", ");
}

function formatStatusLabel(status: string) {
  return status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function getInspectionPropertyAddress(inspection: Inspection) {
  const property = inspection.summary?.property ?? inspection.job?.property ?? null;
  if (!property) return null;
  const cityState = [property.city, property.state].filter(Boolean).join(", ");
  const postal = property.zip_code ? `${property.zip_code}` : "";
  const location = [cityState, postal].filter(Boolean).join(" ").trim();
  return [property.address_line1, property.address_line2, location].filter((value) => Boolean(value && value.trim())).join(", ");
}

function getInspectionMetaLabel(inspection: Inspection) {
  const scheduleDate = inspection.summary?.scheduled_date ?? inspection.schedule?.slot_date ?? null;
  const scheduleTime = inspection.summary?.scheduled_time ?? inspection.schedule?.slot_start ?? null;
  const inspectorName = inspection.inspector?.full_name ?? null;
  const parts = [] as string[];
  const formattedDate = tryFormatDate(scheduleDate);
  if (formattedDate || scheduleTime) {
    const scheduleLabel = formattedDate && scheduleTime ? `${formattedDate} at ${scheduleTime}` : (formattedDate ?? scheduleTime);
    if (scheduleLabel) parts.push(scheduleLabel);
  }
  if (inspectorName) parts.push(inspectorName);
  parts.push(`ID ${inspection.id.slice(0, 8)}`);
  return parts.filter(Boolean).join(" • ");
}

function formatScheduleLabel(date?: string | null, time?: string | null) {
  const formattedDate = tryFormatDate(date);
  if (formattedDate && time) return `${formattedDate} at ${time}`;
  return formattedDate ?? time ?? null;
}

function mapInspectionServiceToService(service: InspectionService): Service {
  return {
    serviceId: service.service_id ?? service.id,
    name: service.name,
    price: service.price,
    durationMinutes: service.duration_minutes ?? undefined,
    templateId: service.template_id ?? undefined,
  };
}

function getServicePrice(service: Service) {
  const price = typeof service.price === "number" ? service.price : Number(service.price ?? 0);
  return Number.isFinite(price) ? price : 0;
}

export function OrderForm({ mode, order }: OrderFormProps) {
  const router = useRouter();
  const tenantSlug = process.env.NEXT_PUBLIC_SUPABASE_TENANT_ID ?? "demo";
  const createOrder = useCreateOrder();
  const updateOrder = useUpdateOrder();
  const { data: clients = [] } = useClients();
  const { data: agents = [] } = useAgents(tenantSlug);
  const { data: inspectors = [] } = useInspectors();
  const { data: inspections = [] } = useInspections();
  const { data: properties = [] } = useProperties(tenantSlug);
  const { data: services = [] } = useServices();
  const createProperty = useCreateProperty();
  const orderInspection = useMemo(() => {
    if (!order?.inspection) return null;
    return Array.isArray(order.inspection) ? order.inspection[0] : order.inspection;
  }, [order?.inspection]);

  const [serviceSearch, setServiceSearch] = useState("");
  const [clientDialogOpen, setClientDialogOpen] = useState(false);
  const [agentDialogOpen, setAgentDialogOpen] = useState(false);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [showInlinePropertyForm, setShowInlinePropertyForm] = useState(false);
  const [selectedInspectionId, setSelectedInspectionId] = useState(() => orderInspection?.id ?? "");
  const [showInlineInspectionForm, setShowInlineInspectionForm] = useState(false);
  const [propertyForm, setPropertyForm] = useState(() => createEmptyPropertyFormState());
  const [propertyFormErrors, setPropertyFormErrors] = useState<PropertyFormErrors>({});

  const [form, setForm] = useState<OrderFormState>(() => ({
    client_id: order?.client_id ?? null,
    agent_id: order?.agent_id ?? null,
    inspector_id: order?.inspector_id ?? null,
    property_id: order?.property_id ?? "",
    scheduled_date: order?.scheduled_date ?? "",
        showInlinePropertyForm ? "max-h-1250 opacity-100 pointer-events-auto" : "max-h-0 opacity-0 pointer-events-none",
    duration_minutes: order?.duration_minutes ? String(order.duration_minutes) : "",
    status: order?.status ?? "pending",
    payment_status: order?.payment_status ?? "unpaid",
    source: order?.source ?? "",
    internal_notes: order?.internal_notes ?? "",
    client_notes: order?.client_notes ?? "",
  }));

  const serviceNameMap = useMemo(() => {
    return new Map(services.map((service) => [service.name.toLowerCase(), service.serviceId]));
  }, [services]);

  useEffect(() => {
    if (!showInlinePropertyForm) return;
    const nextClientId = form.client_id ?? "";
    setPropertyForm((prev) => {
      if (prev.clientId === nextClientId) {
        return prev;
      }
      return { ...prev, clientId: nextClientId };
    });
  }, [form.client_id, showInlinePropertyForm]);

  useEffect(() => {
    if (!orderInspection?.id) return;
    setSelectedInspectionId(orderInspection.id);
    setShowInlineInspectionForm(false);
  }, [orderInspection?.id]);

  useEffect(() => {
    if (mode !== "edit" || selectedServiceIds.length > 0) return;
    const inspection = Array.isArray(order?.inspection) ? order?.inspection[0] : order?.inspection;
    const existing: InspectionService[] = inspection?.services ?? [];
    if (existing.length === 0) return;

    const fromIds = existing.map((service) => service.service_id).filter((value): value is string => Boolean(value));

    if (fromIds.length > 0) {
      setSelectedServiceIds(fromIds);
      return;
    }

    const byName = existing
      .map((service) => service.name?.toLowerCase())
      .filter((name): name is string => Boolean(name))
      .map((name) => serviceNameMap.get(name))
      .filter((id): id is string => Boolean(id));

    if (byName.length > 0) {
      setSelectedServiceIds(Array.from(new Set(byName)));
    }
  }, [mode, order?.inspection, selectedServiceIds.length, serviceNameMap]);

  const selectedInspection = useMemo(() => {
    if (!selectedInspectionId) return null;
    return inspections.find((inspection) => inspection.id === selectedInspectionId) ?? null;
  }, [inspections, selectedInspectionId]);

  const linkedInspectionDetails = useMemo<LinkedInspectionDetails | null>(() => {
    if (!selectedInspectionId || showInlineInspectionForm) return null;

    if (selectedInspection) {
      const serviceIds = selectedInspection.summary?.service_ids ?? selectedInspection.selected_type_ids ?? [];
      const derivedServices = serviceIds
        .map((serviceId) => services.find((service) => service.serviceId === serviceId))
        .filter((service): service is Service => Boolean(service));
      return {
        inspectorId: selectedInspection.inspector_id ?? null,
        inspectorName: selectedInspection.inspector?.full_name ?? null,
        scheduledDate: selectedInspection.summary?.scheduled_date ?? selectedInspection.schedule?.slot_date ?? null,
        scheduledTime: selectedInspection.summary?.scheduled_time ?? selectedInspection.schedule?.slot_start ?? null,
        services: derivedServices,
      };
    }

    if (orderInspection && orderInspection.id === selectedInspectionId) {
      const derivedServices = orderInspection.services?.map((service: InspectionService) => mapInspectionServiceToService(service)) ?? [];
      return {
        inspectorId: orderInspection.inspector_id ?? null,
        inspectorName: order?.inspector?.full_name ?? null,
        scheduledDate: order?.scheduled_date ?? orderInspection.order_schedule?.slot_date ?? null,
        scheduledTime: order?.scheduled_time ?? orderInspection.order_schedule?.slot_start ?? null,
        services: derivedServices,
      };
    }

    return null;
  }, [
    selectedInspectionId,
    showInlineInspectionForm,
    selectedInspection,
    services,
    orderInspection,
    order?.inspector?.full_name,
    order?.scheduled_date,
    order?.scheduled_time,
  ]);

  const selectedServices = useMemo(() => {
    if (!showInlineInspectionForm && linkedInspectionDetails) {
      return linkedInspectionDetails.services;
    }
    return services.filter((service) => selectedServiceIds.includes(service.serviceId));
  }, [showInlineInspectionForm, linkedInspectionDetails, services, selectedServiceIds]);

  const isLinkingExistingInspection = !showInlineInspectionForm && Boolean(selectedInspectionId);

  const linkedInspectionSchedule = useMemo(() => {
    if (!linkedInspectionDetails) return null;
    return formatScheduleLabel(linkedInspectionDetails.scheduledDate, linkedInspectionDetails.scheduledTime);
  }, [linkedInspectionDetails]);

  const inlineInspectorName = useMemo(() => {
    if (!form.inspector_id) return null;
    const inspector = inspectors.find((item) => item.teamMemberId === form.inspector_id);
    return inspector?.name ?? null;
  }, [form.inspector_id, inspectors]);

  const inspectorSummaryLabel = isLinkingExistingInspection
    ? (linkedInspectionDetails?.inspectorName ?? (linkedInspectionDetails?.inspectorId ? "Inspector assigned" : null))
    : inlineInspectorName;

  useEffect(() => {
    if (!isLinkingExistingInspection) return;
    const inspectorId = linkedInspectionDetails?.inspectorId ?? null;
    setForm((prev) => {
      if (prev.inspector_id === inspectorId) {
        return prev;
      }
      return { ...prev, inspector_id: inspectorId };
    });
  }, [isLinkingExistingInspection, linkedInspectionDetails?.inspectorId]);

  const totals = useMemo(() => {
    const subtotal = selectedServices.reduce((sum, service) => sum + getServicePrice(service), 0);
    const duration = selectedServices.reduce((sum, service) => sum + Number(service.durationMinutes ?? 0), 0);
    return { subtotal, duration, count: selectedServices.length };
  }, [selectedServices]);

  const servicesSatisfied = isLinkingExistingInspection ? Boolean(selectedInspectionId) : totals.count > 0;

  const handleServiceToggle = (serviceId: string, checked: boolean) => {
    setSelectedServiceIds((prev) => {
      const isChecked = prev.includes(serviceId);
      if (checked) {
        return isChecked ? prev : [...prev, serviceId];
      }
      return prev.filter((id) => id !== serviceId);
    });
  };

  const handleSubmit = () => {
    if (!form.property_id) {
      toast.error("Select a property to continue.");
      return;
    }
    if (!showInlineInspectionForm && !selectedInspectionId) {
      toast.error("Link an inspection or create one inline.");
      return;
    }
    if (showInlineInspectionForm && selectedServices.length === 0) {
      toast.error("Select at least one service.");
      return;
    }

    const payload = {
      client_id: form.client_id || null,
      agent_id: form.agent_id || null,
      inspector_id: form.inspector_id || null,
      property_id: form.property_id,
      scheduled_date: form.scheduled_date || null,
      scheduled_time: form.scheduled_time || null,
      duration_minutes: form.duration_minutes ? Number(form.duration_minutes) : undefined,
      source: form.source || undefined,
      internal_notes: form.internal_notes || null,
      client_notes: form.client_notes || null,
      inspection_id: isLinkingExistingInspection ? selectedInspectionId : undefined,
      services: selectedServices.map((service) => ({
        service_id: service.serviceId,
        template_id: service.templateId ?? undefined,
        name: service.name,
        price: getServicePrice(service),
        duration_minutes: service.durationMinutes ?? undefined,
      })),
    };

    if (mode === "edit" && order) {
      const updatePayload = {
        ...payload,
        status: form.status,
        payment_status: form.payment_status,
      };
      updateOrder.mutate(
        { id: order.id, ...updatePayload },
        {
          onSuccess: (updated) => {
            toast.success("Order updated.");
            router.push(`/admin/orders/${updated.id}`);
          },
          onError: (error) => {
            const message = error instanceof Error ? error.message : "Failed to update order.";
            toast.error(message);
          },
        },
      );
      return;
    }

    createOrder.mutate(payload, {
      onSuccess: (created) => {
        toast.success("Order created.");
        router.push(`/admin/orders/${created.id}`);
      },
      onError: (error) => {
        const message = error instanceof Error ? error.message : "Failed to create order.";
        toast.error(message);
      },
    });
  };

  const handleClientCreated = (clientId: string) => {
    setForm((prev) => ({ ...prev, client_id: clientId }));
  };

  const handleAgentCreated = (agentId: string) => {
    setForm((prev) => ({ ...prev, agent_id: agentId }));
  };

  const handlePropertySelect = (value: string) => {
    if (value === "__add_new_property__") {
      const initial = createEmptyPropertyFormState();
      setPropertyForm(form.client_id ? { ...initial, clientId: form.client_id } : initial);
      setPropertyFormErrors({});
      setShowInlinePropertyForm(true);
      setForm((prev) => ({ ...prev, property_id: "" }));
      return;
    }
    setShowInlinePropertyForm(false);
    setPropertyFormErrors({});
    setForm((prev) => ({ ...prev, property_id: value }));
  };

  const handleClientSelect = (value: string) => {
    if (value === "__add_new_client__") {
      setClientDialogOpen(true);
      return;
    }
    setForm((prev) => ({
      ...prev,
      client_id: value === "__none__" ? null : value,
    }));
  };

  const handleAgentSelect = (value: string) => {
    if (value === "__add_new_agent__") {
      setAgentDialogOpen(true);
      return;
    }
    setForm((prev) => ({
      ...prev,
      agent_id: value === "__none__" ? null : value,
    }));
  };

  const handleInspectionSelect = (value: string) => {
    if (value === "__add_new_inspection__") {
      setSelectedInspectionId("");
      setShowInlineInspectionForm(true);
      return;
    }
    if (value === "__no_inspections__") {
      return;
    }
    setSelectedInspectionId(value);
    setShowInlineInspectionForm(false);
  };

  const handleInlinePropertyCancel = () => {
    setShowInlinePropertyForm(false);
    setPropertyForm(createEmptyPropertyFormState());
    setPropertyFormErrors({});
  };

  const handleInlinePropertySubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const validationErrors = validatePropertyForm(propertyForm);
    setPropertyFormErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    const basementValue = normalizeOptionValue(propertyForm.basement, basementOptions);
    const buildingClassValue = normalizeOptionValue(propertyForm.buildingClass, buildingClassOptions);
    const laundryValue = normalizeOptionValue(propertyForm.laundryType, laundryOptions);

    try {
      const created = await createProperty.mutateAsync({
        tenant_slug: tenantSlug,
        address_line1: propertyForm.addressLine1.trim(),
        address_line2: propertyForm.addressLine2.trim() || null,
        city: propertyForm.city.trim(),
        state: propertyForm.state.trim(),
        zip_code: propertyForm.zipCode.trim(),
        property_type: propertyForm.propertyType as any,
        year_built: propertyForm.yearBuilt ? parseInt(propertyForm.yearBuilt, 10) : null,
        square_feet: propertyForm.squareFeet ? parseInt(propertyForm.squareFeet, 10) : null,
        notes: propertyForm.notes.trim() || null,
        client_id: form.client_id || propertyForm.clientId || null,
        bedrooms: propertyForm.bedrooms ? parseInt(propertyForm.bedrooms, 10) : null,
        bathrooms: propertyForm.bathrooms ? parseFloat(propertyForm.bathrooms) : null,
        stories: propertyForm.stories || null,
        foundation: propertyForm.foundation || null,
        garage: propertyForm.garage || null,
        pool: propertyForm.pool,
        basement: basementValue,
        lot_size_acres: propertyForm.lotSizeAcres ? parseFloat(propertyForm.lotSizeAcres) : null,
        heating_type: propertyForm.heatingType || null,
        cooling_type: propertyForm.coolingType || null,
        roof_type: propertyForm.roofType || null,
        building_class: buildingClassValue,
        loading_docks: propertyForm.loadingDocks ? parseInt(propertyForm.loadingDocks, 10) : null,
        zoning: propertyForm.zoning || null,
        occupancy_type: propertyForm.occupancyType || null,
        ceiling_height: propertyForm.ceilingHeight ? parseFloat(propertyForm.ceilingHeight) : null,
        number_of_units: propertyForm.numberOfUnits ? parseInt(propertyForm.numberOfUnits, 10) : null,
        unit_mix: propertyForm.unitMix || null,
        laundry_type: laundryValue,
        parking_spaces: propertyForm.parkingSpaces ? parseInt(propertyForm.parkingSpaces, 10) : null,
        elevator: propertyForm.elevator,
      });

      setForm((prev) => ({ ...prev, property_id: created.id }));
      handleInlinePropertyCancel();
    } catch (error) {
      // handled by mutation toast
    }
  };

  const isSubmitting = createOrder.isPending || updateOrder.isPending;
  const primaryActionLabel = mode === "edit" ? "Save Changes" : "Create Order";
  const cancelHref = mode === "edit" && order ? `/admin/orders/${order.id}` : "/admin/orders";

  return (
    <div className="space-y-4">
      <PageHeader
        breadcrumb={
          <>
            <Link href="/admin/overview" className="hover:text-foreground">
              Overview
            </Link>
            <span className="text-muted-foreground">/</span>
            <Link href="/admin/orders" className="hover:text-foreground">
              Orders
            </Link>
            <span className="text-muted-foreground">/</span>
            <span>{mode === "edit" && order ? "Edit" : "New"}</span>
          </>
        }
        title={mode === "edit" && order ? order.order_number : "New Order"}
        meta={
          <>
            <Badge className="text-xs px-2 py-0.5">{formatStatusLabel(form.status)}</Badge>
            <Badge variant="outline" className="text-xs px-2 py-0.5">
              {formatStatusLabel(form.payment_status)}
            </Badge>
            {order?.created_at || order?.source ? (
              <span className="text-xs text-muted-foreground">
                {order?.created_at ? `Created ${new Date(order.created_at).toLocaleDateString()}` : ""}
                {order?.created_at && order?.source ? " • " : ""}
                {order?.source ? `Source: ${order.source}` : ""}
              </span>
            ) : null}
          </>
        }
        description="Capture the core order details, then confirm services and schedule."
        backHref="/admin/orders"
        actions={
          <>
            <Button variant="ghost" asChild>
              <Link href={cancelHref}>Cancel</Link>
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : primaryActionLabel}
            </Button>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-4">
        <div className="space-y-4 lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                Property
              </CardTitle>
              <CardDescription>Select the property and source.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="property_id">Property</Label>
                  <Select value={form.property_id} onValueChange={handlePropertySelect}>
                    <SelectTrigger id="property_id">
                      <SelectValue placeholder="Select property" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__add_new_property__" className="text-blue-600 font-semibold">
                        <span className="inline-flex items-center gap-2">
                          <Plus className="h-3 w-3" />
                          Add new property
                        </span>
                      </SelectItem>
                      {properties.map((property) => (
                        <SelectItem key={property.id} value={property.id}>
                          {getPropertyLabel(property)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="source">Source</Label>
                  <Input
                    id="source"
                    value={form.source}
                    onChange={(event) => setForm((prev) => ({ ...prev, source: event.target.value }))}
                    placeholder="Referral, website, partner..."
                  />
                </div>
              </div>

              <div
                className={cn(
                  "overflow-hidden rounded-lg border bg-muted/20 transition-all duration-300 ease-in-out",
                  showInlinePropertyForm ? "max-h-1250 opacity-100 pointer-events-auto" : "max-h-0 opacity-0 pointer-events-none",
                )}
                aria-hidden={!showInlinePropertyForm}
              >
                <form onSubmit={handleInlinePropertySubmit} className="space-y-4 p-4">
                  <div>
                    <p className="font-semibold">Create new property</p>
                    <p className="text-sm text-muted-foreground">The order stays in context while you capture the address.</p>
                  </div>
                  <PropertyFormSections
                    form={propertyForm}
                    setForm={setPropertyForm}
                    errors={propertyFormErrors}
                    setErrors={setPropertyFormErrors}
                    showOwnerSection={false}
                  />
                  <div className="flex flex-wrap items-center justify-end gap-2 border-t pt-4">
                    <Button type="button" variant="ghost" onClick={handleInlinePropertyCancel} disabled={createProperty.isPending}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createProperty.isPending}>
                      {createProperty.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Plus className="mr-2 h-4 w-4" />
                          Save property
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                People
              </CardTitle>
              <CardDescription>Link the client and referring agent.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="client_id">Client</Label>
                <Select value={form.client_id ?? "__none__"} onValueChange={handleClientSelect}>
                  <SelectTrigger id="client_id">
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__add_new_client__" className="text-blue-600 font-semibold">
                      <span className="inline-flex items-center gap-2">
                        <Plus className="h-3 w-3" />
                        Add new client
                      </span>
                    </SelectItem>
                    <SelectItem value="__none__">No client</SelectItem>
                    {clients.map((client) => (
                      <SelectItem key={client.clientId} value={client.clientId}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="agent_id">Referring Agent</Label>
                <Select value={form.agent_id ?? "__none__"} onValueChange={handleAgentSelect}>
                  <SelectTrigger id="agent_id">
                    <SelectValue placeholder="Select agent" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__add_new_agent__" className="text-blue-600 font-semibold">
                      <span className="inline-flex items-center gap-2">
                        <Plus className="h-3 w-3" />
                        Add new agent
                      </span>
                    </SelectItem>
                    <SelectItem value="__none__">No agent</SelectItem>
                    {agents.map((agent) => (
                      <SelectItem key={agent.id} value={agent.id}>
                        {agent.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                Inspection
              </CardTitle>
              <CardDescription>Select the inspector and services for this inspection.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="inspection_id">Inspection</Label>
                <Select value={selectedInspectionId || ""} onValueChange={handleInspectionSelect}>
                  <SelectTrigger id="inspection_id">
                    <SelectValue placeholder="Link existing inspection" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__add_new_inspection__" className="text-blue-600 font-semibold">
                      <span className="inline-flex items-center gap-2">
                        <Plus className="h-3 w-3" />
                        Add new inspection
                      </span>
                    </SelectItem>
                    {inspections.length === 0 ? (
                      <SelectItem value="__no_inspections__" disabled>
                        No inspections available
                      </SelectItem>
                    ) : (
                      inspections.map((inspection) => (
                        <SelectItem key={inspection.id} value={inspection.id}>
                          <div className="flex flex-col gap-0.5 text-left">
                            <span className="font-medium leading-tight">
                              {getInspectionPropertyAddress(inspection) ?? `Inspection ${inspection.id.slice(0, 8)}`}
                            </span>
                            <span className="text-xs text-muted-foreground">{getInspectionMetaLabel(inspection)}</span>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">Link an existing record or add a new inspection inline without leaving the order.</p>
              </div>

              {!showInlineInspectionForm && (
                <div className="space-y-3 rounded-lg border bg-muted/30 p-4 text-sm">
                  {selectedInspectionId ? (
                    <>
                      <div>
                        <p className="font-medium">{linkedInspectionDetails?.inspectorName ?? "No inspector assigned"}</p>
                        <p className="text-muted-foreground">{linkedInspectionSchedule ?? "No schedule information"}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase text-muted-foreground">Services</p>
                        {linkedInspectionDetails?.services.length ? (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {linkedInspectionDetails.services.map((service) => (
                              <Badge key={`linked-service-${service.serviceId}`} variant="secondary">
                                {service.name}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <p className="text-muted-foreground">Service selections unavailable for this inspection.</p>
                        )}
                      </div>
                    </>
                  ) : (
                    <p className="text-muted-foreground">Select an inspection to view its details.</p>
                  )}
                </div>
              )}

              <div
                className={cn(
                  "overflow-hidden rounded-lg border bg-muted/20 transition-all duration-300 ease-in-out",
                  showInlineInspectionForm ? "max-h-1250 opacity-100 pointer-events-auto" : "max-h-0 opacity-0 pointer-events-none",
                )}
                aria-hidden={!showInlineInspectionForm}
              >
                <div className="space-y-4 p-4">
                  <InspectionDetailsSection
                    inspectors={inspectors}
                    selectedInspectorId={form.inspector_id}
                    onInspectorChange={(value) =>
                      setForm((prev) => ({
                        ...prev,
                        inspector_id: value,
                      }))
                    }
                    services={services}
                    selectedServiceIds={selectedServiceIds}
                    onServiceToggle={handleServiceToggle}
                    searchValue={serviceSearch}
                    onSearchChange={setServiceSearch}
                    helperText="These selections will determine which services appear under the inspection container."
                    allowUnassigned
                    unassignedLabel="Unassigned"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                Schedule
              </CardTitle>
              <CardDescription>Confirm date, time, and status.</CardDescription>
            </CardHeader>
            <CardContent className={`grid gap-4 ${mode === "edit" ? "md:grid-cols-4" : "md:grid-cols-3"}`}>
              <div className="space-y-2">
                <Label htmlFor="scheduled_date">Date</Label>
                <Input
                  id="scheduled_date"
                  type="date"
                  value={form.scheduled_date}
                  onChange={(event) => setForm((prev) => ({ ...prev, scheduled_date: event.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="scheduled_time">Time</Label>
                <Input
                  id="scheduled_time"
                  type="time"
                  value={form.scheduled_time}
                  onChange={(event) => setForm((prev) => ({ ...prev, scheduled_time: event.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration_minutes">Duration (minutes)</Label>
                <Input
                  id="duration_minutes"
                  type="number"
                  min={0}
                  value={form.duration_minutes}
                  placeholder={totals.duration ? `${totals.duration}` : "120"}
                  onChange={(event) => setForm((prev) => ({ ...prev, duration_minutes: event.target.value }))}
                />
              </div>
              {mode === "edit" && (
                <div className="space-y-2">
                  <Label htmlFor="status">Order Status</Label>
                  <Select value={form.status} onValueChange={(value) => setForm((prev) => ({ ...prev, status: value as Order["status"] }))}>
                    <SelectTrigger id="status">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {orderStatusOptions.map((status) => (
                        <SelectItem key={status} value={status}>
                          {formatStatusLabel(status)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>

          {mode === "edit" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  Payment
                </CardTitle>
                <CardDescription>Track payment status for this order.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="payment_status">Payment Status</Label>
                  <Select
                    value={form.payment_status}
                    onValueChange={(value) =>
                      setForm((prev) => ({
                        ...prev,
                        payment_status: value as Order["payment_status"],
                      }))
                    }
                  >
                    <SelectTrigger id="payment_status">
                      <SelectValue placeholder="Select payment status" />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentStatusOptions.map((status) => (
                        <SelectItem key={status} value={status}>
                          {formatStatusLabel(status)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="rounded-md border p-3 text-sm">
                  <p className="text-muted-foreground">Current total</p>
                  <p className="text-lg font-semibold">${totals.subtotal.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">Taxes and discounts applied after creation.</p>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
              <CardDescription>Internal notes or client instructions.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="internal_notes">Internal Notes</Label>
                <Textarea
                  id="internal_notes"
                  value={form.internal_notes}
                  onChange={(event) => setForm((prev) => ({ ...prev, internal_notes: event.target.value }))}
                  placeholder="Team-only notes..."
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="client_notes">Client Notes</Label>
                <Textarea
                  id="client_notes"
                  value={form.client_notes}
                  onChange={(event) => setForm((prev) => ({ ...prev, client_notes: event.target.value }))}
                  placeholder="Visible to client..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                Summary
              </CardTitle>
              <CardDescription>Totals and required steps.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span>Services</span>
                <span>{totals.count}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Estimated Duration</span>
                <span>{totals.duration || 0} min</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between text-sm">
                <span>Subtotal</span>
                <span className="font-semibold">${totals.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Taxes/discounts</span>
                <span>After creation</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-muted-foreground" />
                Order Readiness
              </CardTitle>
              <CardDescription>Checklist for completion.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle2 className={form.property_id ? "h-4 w-4 text-emerald-500" : "h-4 w-4"} />
                Property selected
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className={servicesSatisfied ? "h-4 w-4 text-emerald-500" : "h-4 w-4"} />
                Services selected
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className={form.scheduled_date ? "h-4 w-4 text-emerald-500" : "h-4 w-4"} />
                Date set
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className={form.inspector_id ? "h-4 w-4 text-emerald-500" : "h-4 w-4"} />
                Inspector assigned
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-muted-foreground" />
                Schedule Snapshot
              </CardTitle>
              <CardDescription>Quick view of schedule.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {form.scheduled_date || "Pick a date"}
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {form.scheduled_time || "Pick a time"}
              </div>
              <div className="flex items-center gap-2">
                <UserCheck className="h-4 w-4" />
                {inspectorSummaryLabel ?? (form.inspector_id ? "Inspector assigned" : "No inspector yet")}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <InlineClientDialog open={clientDialogOpen} onOpenChange={setClientDialogOpen} onClientCreated={handleClientCreated} />
      <InlineAgentDialog open={agentDialogOpen} onOpenChange={setAgentDialogOpen} onAgentCreated={handleAgentCreated} />
    </div>
  );
}
