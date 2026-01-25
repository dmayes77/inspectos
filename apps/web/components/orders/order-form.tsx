"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Calendar, CheckCircle2, Clock, DollarSign, FileText, MapPin, Plus, Search, User, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { useCreateOrder, useUpdateOrder, type Order } from "@/hooks/use-orders";
import { useClients } from "@/hooks/use-clients";
import { useAgents } from "@/hooks/use-agents";
import { useInspectors } from "@/hooks/use-team";
import { useProperties, type Property } from "@/hooks/use-properties";
import { useServices, type Service } from "@/hooks/use-services";
import { InlineClientDialog } from "@/components/orders/inline-client-dialog";
import { InlinePropertyDialog } from "@/components/orders/inline-property-dialog";
import { InlineAgentDialog } from "@/components/orders/inline-agent-dialog";
import type { InspectionService } from "@/lib/data/orders";

const orderStatusOptions = [
  "pending",
  "scheduled",
  "in_progress",
  "pending_report",
  "delivered",
  "completed",
  "cancelled",
] as const;

const paymentStatusOptions = ["unpaid", "partial", "paid", "refunded"] as const;

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

function getPropertyLabel(property: Property) {
  return [
    property.address_line1,
    property.address_line2,
    `${property.city}, ${property.state} ${property.zip_code}`,
  ]
    .filter(Boolean)
    .join(", ");
}

function formatStatusLabel(status: string) {
  return status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function getServicePrice(service: Service) {
  return Number(service.price ?? 0);
}

export function OrderForm({ mode, order }: OrderFormProps) {
  const router = useRouter();
  const tenantSlug = process.env.NEXT_PUBLIC_SUPABASE_TENANT_ID ?? "demo";
  const createOrder = useCreateOrder();
  const updateOrder = useUpdateOrder();
  const { data: clients = [] } = useClients();
  const { data: agents = [] } = useAgents(tenantSlug);
  const { data: inspectors = [] } = useInspectors();
  const { data: properties = [] } = useProperties(tenantSlug);
  const { data: services = [] } = useServices();

  const [serviceSearch, setServiceSearch] = useState("");
  const [clientDialogOpen, setClientDialogOpen] = useState(false);
  const [propertyDialogOpen, setPropertyDialogOpen] = useState(false);
  const [agentDialogOpen, setAgentDialogOpen] = useState(false);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);

  const [form, setForm] = useState<OrderFormState>(() => ({
    client_id: order?.client_id ?? null,
    agent_id: order?.agent_id ?? null,
    inspector_id: order?.inspector_id ?? null,
    property_id: order?.property_id ?? "",
    scheduled_date: order?.scheduled_date ?? "",
    scheduled_time: order?.scheduled_time ?? "",
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
    if (mode !== "edit" || selectedServiceIds.length > 0) return;
    const inspection = Array.isArray(order?.inspection) ? order?.inspection[0] : order?.inspection;
    const existing: InspectionService[] = inspection?.services ?? [];
    if (existing.length === 0) return;

    const fromIds = existing
      .map((service) => service.service_id)
      .filter((value): value is string => Boolean(value));

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

  const selectedServices = useMemo(() => {
    return services.filter((service) => selectedServiceIds.includes(service.serviceId));
  }, [services, selectedServiceIds]);

  const { coreServices, addonServices, packageServices } = useMemo(() => {
    const filtered = serviceSearch.trim().toLowerCase();
    const visible = filtered
      ? services.filter((service) => service.name.toLowerCase().includes(filtered))
      : services;
    return {
      coreServices: visible.filter((service) => service.category === "core" && !service.isPackage),
      addonServices: visible.filter((service) => service.category === "addon" && !service.isPackage),
      packageServices: visible.filter((service) => service.isPackage),
    };
  }, [services, serviceSearch]);

  const totals = useMemo(() => {
    const subtotal = selectedServices.reduce((sum, service) => sum + getServicePrice(service), 0);
    const duration = selectedServices.reduce(
      (sum, service) => sum + Number(service.durationMinutes ?? 0),
      0
    );
    return { subtotal, duration, count: selectedServices.length };
  }, [selectedServices]);

  const handleToggleService = (serviceId: string) => {
    setSelectedServiceIds((prev) =>
      prev.includes(serviceId) ? prev.filter((id) => id !== serviceId) : [...prev, serviceId]
    );
  };

  const handleSubmit = () => {
    if (!form.property_id) {
      toast.error("Select a property to continue.");
      return;
    }
    if (selectedServices.length === 0) {
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
        }
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

  const handlePropertyCreated = (propertyId: string) => {
    setForm((prev) => ({ ...prev, property_id: propertyId }));
  };

  const handleAgentCreated = (agentId: string) => {
    setForm((prev) => ({ ...prev, agent_id: agentId }));
  };

  const handlePropertySelect = (value: string) => {
    if (value === "__add_new_property__") {
      setPropertyDialogOpen(true);
      return;
    }
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
            {(order?.created_at || order?.source) ? (
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
            <CardContent className="grid gap-4 md:grid-cols-2">
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
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, source: event.target.value }))
                  }
                  placeholder="Referral, website, partner..."
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                People
              </CardTitle>
              <CardDescription>Link the client, agent, and inspector.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="client_id">Client</Label>
                <Select
                  value={form.client_id ?? "__none__"}
                  onValueChange={handleClientSelect}
                >
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
                  <Select
                    value={form.agent_id ?? "__none__"}
                    onValueChange={handleAgentSelect}
                  >
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

              <div className="space-y-2">
                <Label htmlFor="inspector_id">Inspector</Label>
                <Select
                  value={form.inspector_id ?? "__none__"}
                  onValueChange={(value) =>
                    setForm((prev) => ({
                      ...prev,
                      inspector_id: value === "__none__" ? null : value,
                    }))
                  }
                >
                  <SelectTrigger id="inspector_id">
                    <SelectValue placeholder="Assign inspector" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Unassigned</SelectItem>
                    {inspectors.map((inspector) => (
                      <SelectItem key={inspector.teamMemberId} value={inspector.teamMemberId}>
                        {inspector.name}
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
              <CardDescription>Select services that will be scheduled under the inspection container.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={serviceSearch}
                  onChange={(event) => setServiceSearch(event.target.value)}
                  placeholder="Search services..."
                  className="pl-9"
                />
              </div>
              <p className="text-sm text-muted-foreground">
                These selections will determine which services appear under the inspection container.
              </p>

              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Core Services</Label>
                    <Badge variant="outline">{coreServices.length}</Badge>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    {coreServices.map((service) => {
                      const checked = selectedServiceIds.includes(service.serviceId);
                      return (
                        <label
                          key={service.serviceId}
                          className="flex items-start gap-3 rounded-md border px-3 py-2 hover:bg-muted/50"
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={() => handleToggleService(service.serviceId)}
                          />
                          <div className="flex-1">
                            <div className="flex items-center justify-between gap-3">
                              <p className="font-medium">{service.name}</p>
                              <span className="text-sm font-semibold">
                                ${getServicePrice(service).toFixed(2)}
                              </span>
                            </div>
                            <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
                              {service.durationMinutes && (
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {service.durationMinutes} min
                                </span>
                              )}
                              {service.templateId && <span>Template linked</span>}
                            </div>
                          </div>
                        </label>
                      );
                    })}
                    {coreServices.length === 0 && (
                      <div className="text-sm text-muted-foreground">No core services found.</div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Add-ons</Label>
                    <Badge variant="outline">{addonServices.length}</Badge>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    {addonServices.map((service) => {
                      const checked = selectedServiceIds.includes(service.serviceId);
                      return (
                        <label
                          key={service.serviceId}
                          className="flex items-start gap-3 rounded-md border px-3 py-2 hover:bg-muted/50"
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={() => handleToggleService(service.serviceId)}
                          />
                          <div className="flex-1">
                            <div className="flex items-center justify-between gap-3">
                              <p className="font-medium">{service.name}</p>
                              <span className="text-sm font-semibold">
                                ${getServicePrice(service).toFixed(2)}
                              </span>
                            </div>
                            <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
                              {service.durationMinutes && (
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {service.durationMinutes} min
                                </span>
                              )}
                              {service.templateId && <span>Template linked</span>}
                            </div>
                          </div>
                        </label>
                      );
                    })}
                    {addonServices.length === 0 && (
                      <div className="text-sm text-muted-foreground">No add-ons found.</div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Packages</Label>
                    <Badge variant="outline">{packageServices.length}</Badge>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    {packageServices.map((service) => {
                      const checked = selectedServiceIds.includes(service.serviceId);
                      return (
                        <label
                          key={service.serviceId}
                          className="flex items-start gap-3 rounded-md border px-3 py-2 hover:bg-muted/50"
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={() => handleToggleService(service.serviceId)}
                          />
                          <div className="flex-1">
                            <div className="flex items-center justify-between gap-3">
                              <p className="font-medium">{service.name}</p>
                              <span className="text-sm font-semibold">
                                ${getServicePrice(service).toFixed(2)}
                              </span>
                            </div>
                            <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
                              {service.durationMinutes && (
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {service.durationMinutes} min
                                </span>
                              )}
                              {service.templateId && <span>Template linked</span>}
                            </div>
                          </div>
                        </label>
                      );
                    })}
                    {packageServices.length === 0 && (
                      <div className="text-sm text-muted-foreground">No packages found.</div>
                    )}
                  </div>
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
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, scheduled_date: event.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="scheduled_time">Time</Label>
                <Input
                  id="scheduled_time"
                  type="time"
                  value={form.scheduled_time}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, scheduled_time: event.target.value }))
                  }
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
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, duration_minutes: event.target.value }))
                  }
                />
              </div>
              {mode === "edit" && (
                <div className="space-y-2">
                  <Label htmlFor="status">Order Status</Label>
                  <Select
                    value={form.status}
                    onValueChange={(value) =>
                      setForm((prev) => ({ ...prev, status: value as Order["status"] }))
                    }
                  >
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
                  <p className="text-xs text-muted-foreground">
                    Taxes and discounts applied after creation.
                  </p>
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
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, internal_notes: event.target.value }))
                  }
                  placeholder="Team-only notes..."
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="client_notes">Client Notes</Label>
                <Textarea
                  id="client_notes"
                  value={form.client_notes}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, client_notes: event.target.value }))
                  }
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
                <CheckCircle2 className={totals.count > 0 ? "h-4 w-4 text-emerald-500" : "h-4 w-4"} />
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
                {form.inspector_id ? "Inspector assigned" : "No inspector yet"}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <InlineClientDialog
        open={clientDialogOpen}
        onOpenChange={setClientDialogOpen}
        onClientCreated={handleClientCreated}
      />
      <InlinePropertyDialog
        open={propertyDialogOpen}
        onOpenChange={setPropertyDialogOpen}
        onPropertyCreated={handlePropertyCreated}
        clientId={form.client_id ?? undefined}
      />
      <InlineAgentDialog
        open={agentDialogOpen}
        onOpenChange={setAgentDialogOpen}
        onAgentCreated={handleAgentCreated}
      />
    </div>
  );
}
