"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, Check, Clock, DollarSign, Mail, MapPin, Phone, Send, Tag, Trash2, User } from "lucide-react";
import { useOrderById, useUpdateOrder, useDeleteOrder } from "@/hooks/use-orders";
import { useCreateOrderNote, useOrderNotes } from "@/hooks/use-order-notes";
import { useClients } from "@/hooks/use-clients";
import { useAgents } from "@/hooks/use-agents";
import { useProperties } from "@/hooks/use-properties";
import { useServices } from "@/hooks/use-services";
import { useInspectors } from "@/hooks/use-team";
import { useVendors } from "@/hooks/use-vendors";
import { cn } from "@/lib/utils";
import { formatDate, formatTime12, formatTimestamp, formatTimestampFull } from "@inspectos/shared/utils/dates";
import { formatInvoiceNumber } from "@inspectos/shared/utils/invoices";
import { RESIDENTIAL_PROPERTY_TYPES } from "@inspectos/shared/constants/property-options";
import { ResourceDetailLayout } from "@/components/shared/resource-detail-layout";
import { OrderInspectionTab } from "@/components/orders/order-inspection-tab";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ServiceAssignmentsSection, type ServiceAssignment } from "@/components/orders/service-assignments-section";

function getStatusBadgeClasses(status: string) {
  switch (status) {
    case "pending":
      return "bg-gray-100 text-gray-800 border-gray-200";
    case "scheduled":
      return "bg-brand-100 text-brand-700 border-brand-200";
    case "in_progress":
      return "bg-amber-100 text-amber-800 border-amber-200";
    case "pending_report":
      return "bg-purple-100 text-purple-800 border-purple-200";
    case "delivered":
      return "bg-green-100 text-green-800 border-green-200";
    case "completed":
      return "bg-green-500 text-white border-green-500";
    case "cancelled":
      return "bg-red-100 text-red-800 border-red-200";
    default:
      return "";
  }
}

function getPaymentBadgeClasses(status: string) {
  switch (status) {
    case "unpaid":
      return "bg-red-100 text-red-800 border-red-200";
    case "partial":
      return "bg-amber-100 text-amber-800 border-amber-200";
    case "paid":
      return "bg-green-100 text-green-800 border-green-200";
    case "refunded":
      return "bg-gray-100 text-gray-800 border-gray-200";
    default:
      return "";
  }
}

function formatStatusLabel(status?: string | null) {
  if (!status) return "—";
  return status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatMoney(value?: number | null) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "—";
  return `$${value.toFixed(2)}`;
}

function parseCostInput(value: string) {
  if (!value.trim()) return undefined;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}

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

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const { data: order, isLoading, isError } = useOrderById(id);
  const { data: clients = [] } = useClients();
  const { data: agents = [] } = useAgents();
  const { data: properties = [] } = useProperties();
  const { data: services = [] } = useServices();
  const { data: inspectors = [] } = useInspectors();
  const { data: vendors = [] } = useVendors();
  const updateOrder = useUpdateOrder();
  const deleteOrder = useDeleteOrder();
  const [internalNotes, setInternalNotes] = useState("");
  const [scheduleForm, setScheduleForm] = useState({
    scheduled_date: "",
    scheduled_time: "",
    duration_minutes: "",
  });
  const [assignmentForm, setAssignmentForm] = useState({
    property_id: "",
    client_id: "__none__",
    agent_id: "__none__",
  });
  const [costForm, setCostForm] = useState({
    labor_cost: "",
    travel_cost: "",
    overhead_cost: "",
    other_cost: "",
  });
  const [serviceAssignments, setServiceAssignments] = useState<ServiceAssignment[]>([]);
  const [serviceSearch, setServiceSearch] = useState("");
  const { data: orderNotes = [] } = useOrderNotes(id);
  const createOrderNote = useCreateOrderNote(id);

  const serviceNameMap = useMemo(() => {
    return new Map(services.map((service) => [service.name.toLowerCase(), service.serviceId]));
  }, [services]);

  useEffect(() => {
    setAssignmentForm({
      property_id: order?.property_id ?? "",
      client_id: order?.client_id ?? "__none__",
      agent_id: order?.agent_id ?? "__none__",
    });
  }, [order?.id, order?.property_id, order?.client_id, order?.agent_id]);

  useEffect(() => {
    setScheduleForm({
      scheduled_date: order?.scheduled_date ?? "",
      scheduled_time: order?.scheduled_time ?? "",
      duration_minutes: order?.duration_minutes ? String(order.duration_minutes) : "",
    });
  }, [order?.id, order?.scheduled_date, order?.scheduled_time, order?.duration_minutes]);

  useEffect(() => {
    setCostForm({
      labor_cost: typeof order?.labor_cost === "number" ? String(order.labor_cost) : "",
      travel_cost: typeof order?.travel_cost === "number" ? String(order.travel_cost) : "",
      overhead_cost: typeof order?.overhead_cost === "number" ? String(order.overhead_cost) : "",
      other_cost: typeof order?.other_cost === "number" ? String(order.other_cost) : "",
    });
  }, [order?.id, order?.labor_cost, order?.travel_cost, order?.overhead_cost, order?.other_cost]);

  useEffect(() => {
    if (!order) return;
    const existing = order.services ?? [];
    const assignments: ServiceAssignment[] = existing
      .map((service) => {
        const serviceId = service.service_id ?? serviceNameMap.get(service.name?.toLowerCase() ?? "");
        if (!serviceId) return null;
        return {
          serviceId,
          selected: true,
          inspectorIds: service.inspector_id ? [service.inspector_id] : [],
          vendorIds: service.vendor_id ? [service.vendor_id] : [],
        };
      })
      .filter((assignment): assignment is ServiceAssignment => Boolean(assignment));

    setServiceAssignments(assignments);
  }, [order?.id, order?.services, serviceNameMap]);

  const selectedServices = useMemo(() => {
    const selectedIds = serviceAssignments.filter((a) => a.selected).map((a) => a.serviceId);
    return services.filter((service) => selectedIds.includes(service.serviceId));
  }, [services, serviceAssignments]);

  const handleStatusChange = (newStatus: string) => {
    if (!order) return;
    updateOrder.mutate(
      { id: order.id, status: newStatus as typeof order.status },
      {
        onSuccess: () => {
          toast.success(`Order marked ${formatStatusLabel(newStatus)}.`);
        },
        onError: (error) => {
          toast.error(error instanceof Error ? error.message : "Failed to update status.");
        },
      }
    );
  };

  const handlePaymentStatusChange = (newStatus: string) => {
    if (!order) return;
    updateOrder.mutate(
      { id: order.id, payment_status: newStatus as typeof order.payment_status },
      {
        onSuccess: () => {
          toast.success(`Payment marked ${formatStatusLabel(newStatus)}.`);
        },
        onError: (error) => {
          toast.error(error instanceof Error ? error.message : "Failed to update payment status.");
        },
      }
    );
  };

  const handleDelete = () => {
    if (!order) return;
    if (confirm("Are you sure you want to delete this order?")) {
      deleteOrder.mutate(order.id, {
        onSuccess: () => router.push("/app/orders"),
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading order...</p>
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-muted-foreground">Order not found</p>
        <Link href="/app/orders" className="text-sm text-primary underline">
          Back to Orders
        </Link>
      </div>
    );
  }

  const property = order.property;
  const client = order.client;
  const agent = order.agent;
  const residentialTypes = new Set<string>(RESIDENTIAL_PROPERTY_TYPES);

  const renderPropertyValue = (value?: string | number | boolean | null) => {
    if (value === null || value === undefined || value === "") return "—";
    if (typeof value === "boolean") return value ? "Yes" : "No";
    return `${value}`;
  };

  const handleSaveNotes = async () => {
    const nextInternal = internalNotes.trim();
    if (!nextInternal) {
      toast.error("Add a note before saving.");
      return;
    }

    try {
      await createOrderNote.mutateAsync({
        orderId: order.id,
        noteType: "internal",
        body: nextInternal,
      });
      setInternalNotes("");
      toast.success("Notes saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save notes.");
    }
  };

  const handleSaveCosts = () => {
    if (!order) return;

    updateOrder.mutate(
      {
        id: order.id,
        labor_cost: parseCostInput(costForm.labor_cost),
        travel_cost: parseCostInput(costForm.travel_cost),
        overhead_cost: parseCostInput(costForm.overhead_cost),
        other_cost: parseCostInput(costForm.other_cost),
      },
      {
        onSuccess: () => {
          toast.success("Costs updated.");
        },
        onError: (error) => {
          toast.error(error instanceof Error ? error.message : "Failed to update costs.");
        },
      }
    );
  };

  const handleSaveSchedule = () => {
    if (!order) return;

    updateOrder.mutate(
      {
        id: order.id,
        scheduled_date: scheduleForm.scheduled_date || null,
        scheduled_time: scheduleForm.scheduled_time || null,
        duration_minutes: scheduleForm.duration_minutes.trim() ? Number.parseInt(scheduleForm.duration_minutes, 10) : undefined,
      },
      {
        onSuccess: () => {
          toast.success("Schedule updated.");
        },
        onError: (error) => {
          toast.error(error instanceof Error ? error.message : "Failed to update schedule.");
        },
      }
    );
  };

  const handleSaveAssignments = () => {
    if (!order) return;
    if (!assignmentForm.property_id) {
      toast.error("Property is required.");
      return;
    }

    updateOrder.mutate(
      {
        id: order.id,
        property_id: assignmentForm.property_id,
        client_id: assignmentForm.client_id === "__none__" ? null : assignmentForm.client_id,
        agent_id: assignmentForm.agent_id === "__none__" ? null : assignmentForm.agent_id,
      },
      {
        onSuccess: () => {
          toast.success("Property and people updated.");
        },
        onError: (error) => {
          toast.error(error instanceof Error ? error.message : "Failed to update assignments.");
        },
      }
    );
  };

  const handleServiceToggle = (serviceId: string, checked: boolean) => {
    setServiceAssignments((prev) => {
      const existing = prev.find((a) => a.serviceId === serviceId);
      if (existing) {
        return prev.map((a) => (a.serviceId === serviceId ? { ...a, selected: checked } : a));
      }
      return [...prev, { serviceId, selected: checked, inspectorIds: [], vendorIds: [] }];
    });
  };

  const handleServiceInspectorsChange = (serviceId: string, inspectorIds: string[]) => {
    setServiceAssignments((prev) => prev.map((a) => (a.serviceId === serviceId ? { ...a, inspectorIds } : a)));
  };

  const handleServiceVendorsChange = (serviceId: string, vendorIds: string[]) => {
    setServiceAssignments((prev) => prev.map((a) => (a.serviceId === serviceId ? { ...a, vendorIds } : a)));
  };

  const handleSaveServices = () => {
    if (!order) return;
    if (selectedServices.length === 0) {
      toast.error("Select at least one service.");
      return;
    }

    const payloadServices = selectedServices.map((service) => {
      const assignment = serviceAssignments.find((a) => a.serviceId === service.serviceId);
      return {
        service_id: service.serviceId,
        template_id: service.templateId ?? undefined,
        name: service.name,
        price: typeof service.price === "number" ? service.price : Number(service.price ?? 0),
        duration_minutes: service.durationMinutes ?? undefined,
        inspector_id: assignment?.inspectorIds[0] ?? null,
        vendor_id: assignment?.vendorIds[0] ?? null,
      };
    });

    updateOrder.mutate(
      {
        id: order.id,
        services: payloadServices,
      },
      {
        onSuccess: () => {
          toast.success("Services updated.");
        },
        onError: (error) => {
          toast.error(error instanceof Error ? error.message : "Failed to update services.");
        },
      }
    );
  };

  const internalHistory = orderNotes.filter((note) => note.note_type === "internal");

  const headerMeta = (
    <>
      <span className="text-xs text-muted-foreground">
        Created {formatTimestamp(order.created_at)}
        {order.source ? ` • Source: ${order.source}` : ""}
      </span>
    </>
  );

  const headerActions = (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" onClick={() => toast("Invoice creation is coming soon.")}>
        Create Invoice
      </Button>
      <Button variant="outline" onClick={() => toast("Payment recording is coming soon.")}>
        Record Payment
      </Button>
    </div>
  );

  const totalCost =
    typeof order.total_cost === "number" ? order.total_cost : (order.labor_cost ?? 0) + (order.travel_cost ?? 0) + (order.overhead_cost ?? 0) + (order.other_cost ?? 0);
  const totalRevenue = typeof order.total === "number" ? order.total : 0;
  const grossMargin = typeof order.gross_margin === "number" ? order.gross_margin : totalRevenue - totalCost;
  const grossMarginPct = typeof order.gross_margin_pct === "number" ? order.gross_margin_pct : totalRevenue > 0 ? (grossMargin / totalRevenue) * 100 : null;
  const costDraft = {
    labor: parseCostInput(costForm.labor_cost) ?? 0,
    travel: parseCostInput(costForm.travel_cost) ?? 0,
    overhead: parseCostInput(costForm.overhead_cost) ?? 0,
    other: parseCostInput(costForm.other_cost) ?? 0,
  };
  const draftTotalCost = costDraft.labor + costDraft.travel + costDraft.overhead + costDraft.other;
  const draftGrossMargin = totalRevenue - draftTotalCost;
  const draftGrossMarginPct = totalRevenue > 0 ? (draftGrossMargin / totalRevenue) * 100 : null;
  const nextAction =
    order.status === "pending"
      ? { label: "Mark Scheduled", status: "scheduled" }
      : order.status === "scheduled"
        ? { label: "Start Inspection", status: "in_progress" }
        : order.status === "in_progress"
          ? { label: "Mark Pending Report", status: "pending_report" }
          : order.status === "pending_report"
            ? { label: "Mark Delivered", status: "delivered" }
            : order.status === "delivered"
              ? { label: "Mark Completed", status: "completed" }
              : null;

  const workspaceCard = (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Tag className="h-4 w-4 text-muted-foreground" />
              Order Workspace
            </CardTitle>
            <CardDescription>Manage status, schedule, payments, and communications in one place.</CardDescription>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge className={cn("text-xs", getStatusBadgeClasses(order.status))}>{formatStatusLabel(order.status)}</Badge>
            <Badge color="light" className={cn("text-xs", getPaymentBadgeClasses(order.payment_status))}>
              {formatStatusLabel(order.payment_status)}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-sm border bg-muted/20 p-3">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Revenue</p>
            <p className="text-xl font-semibold">{formatMoney(totalRevenue)}</p>
          </div>
          <div className="rounded-sm border bg-muted/20 p-3">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Total Cost</p>
            <p className="text-xl font-semibold">{formatMoney(totalCost)}</p>
          </div>
          <div className="rounded-sm border bg-muted/20 p-3">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Gross Margin</p>
            <p className={cn("text-xl font-semibold", grossMargin < 0 ? "text-destructive" : "")}>
              {formatMoney(grossMargin)}
              {grossMarginPct !== null ? <span className="ml-2 text-sm font-medium text-muted-foreground">{grossMarginPct.toFixed(1)}%</span> : null}
            </p>
          </div>
        </div>
        <div className="grid gap-3 lg:grid-cols-[1fr_1fr_auto]">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Order Status</p>
            <Select value={order.status} onValueChange={handleStatusChange} disabled={updateOrder.isPending || deleteOrder.isPending}>
              <SelectTrigger>
                <SelectValue />
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
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Payment Status</p>
            <Select value={order.payment_status} onValueChange={handlePaymentStatusChange} disabled={updateOrder.isPending || deleteOrder.isPending}>
              <SelectTrigger>
                <SelectValue />
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
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Next Step</p>
            <Button
              className="w-full lg:min-w-44"
              variant={nextAction ? "primary" : "outline"}
              disabled={!nextAction || updateOrder.isPending || deleteOrder.isPending}
              onClick={() => {
                if (!nextAction) return;
                handleStatusChange(nextAction.status);
              }}
            >
              {nextAction ? nextAction.label : "No Pending Step"}
            </Button>
          </div>
        </div>
        <div className="grid gap-2 md:grid-cols-4">
          <Button size="sm" variant="outline" className="w-full" onClick={() => toast("Client portal link sending is coming soon.")}>
            <Send className="mr-1.5 h-3.5 w-3.5" />
            Send Client Link
          </Button>
          <Button size="sm" variant="outline" className="w-full" onClick={() => toast("Agent portal link sending is coming soon.")}>
            <Mail className="mr-1.5 h-3.5 w-3.5" />
            Send Agent Link
          </Button>
          <Button size="sm" variant="outline" className="w-full" onClick={() => toast("Scheduling calendar integration is coming soon.")}>
            <Calendar className="mr-1.5 h-3.5 w-3.5" />
            Reschedule
          </Button>
          <Button size="sm" variant="outline" className="w-full" onClick={() => toast("SMS notifications are coming soon.")}>
            <Phone className="mr-1.5 h-3.5 w-3.5" />
            Text Client
          </Button>
        </div>
        <Separator />
        <div className="space-y-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Schedule</p>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="order-scheduled-date">Date</Label>
              <Input
                id="order-scheduled-date"
                type="date"
                value={scheduleForm.scheduled_date}
                onChange={(event) => setScheduleForm((prev) => ({ ...prev, scheduled_date: event.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="order-scheduled-time">Time</Label>
              <Input
                id="order-scheduled-time"
                type="time"
                value={scheduleForm.scheduled_time}
                onChange={(event) => setScheduleForm((prev) => ({ ...prev, scheduled_time: event.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="order-duration">Duration (minutes)</Label>
              <Input
                id="order-duration"
                type="number"
                min={0}
                value={scheduleForm.duration_minutes}
                onChange={(event) => setScheduleForm((prev) => ({ ...prev, duration_minutes: event.target.value }))}
                placeholder="120"
              />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {order.scheduled_date
                ? `Current: ${formatDate(order.scheduled_date, "EEEE, MMM d, yyyy")}${order.scheduled_time ? ` at ${formatTime12(order.scheduled_time)}` : ""}`
                : "Current: Not scheduled"}
            </p>
            <Button size="sm" variant="outline" onClick={handleSaveSchedule} disabled={updateOrder.isPending || deleteOrder.isPending}>
              {updateOrder.isPending ? "Saving..." : "Save Schedule"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const propertyCard = (
    <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            Property
          </CardTitle>
          <CardDescription>Location and key property details.</CardDescription>
        </CardHeader>
        <CardContent>
          {property ? (
            <div className="space-y-3">
              <div>
                <p className="font-medium">{property.address_line1}</p>
                {property.address_line2 && <p className="text-sm text-muted-foreground">{property.address_line2}</p>}
                <p className="text-sm text-muted-foreground">
                  {property.city}, {property.state} {property.zip_code}
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <Badge color="light" className="text-xs">{property.property_type.replace("-", " ")}</Badge>
                {property.year_built && <Badge color="light" className="text-xs">Built {property.year_built}</Badge>}
                {property.square_feet && <Badge color="light" className="text-xs">{property.square_feet.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")} sqft</Badge>}
              </div>
              {(residentialTypes.has(property.property_type) || property.property_type === "multi-family") && (
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm pt-1">
                  {[
                    ["Bedrooms", renderPropertyValue(property.bedrooms)],
                    ["Bathrooms", renderPropertyValue(property.bathrooms)],
                    ["Stories", renderPropertyValue(property.stories)],
                    ["Foundation", renderPropertyValue(property.foundation)],
                    ["Garage", renderPropertyValue(property.garage)],
                    ["Pool", renderPropertyValue(property.pool)],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <p className="text-xs text-muted-foreground">{label}</p>
                      <p className="font-medium">{value}</p>
                    </div>
                  ))}
                </div>
              )}
              {residentialTypes.has(property.property_type) && (
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                  {[
                    ["Basement", renderPropertyValue(property.basement?.replace("-", " "))],
                    ["Lot Size", property.lot_size_acres ? `${property.lot_size_acres} acres` : "—"],
                    ["Heating", renderPropertyValue(property.heating_type)],
                    ["Cooling", renderPropertyValue(property.cooling_type)],
                    ["Roof", renderPropertyValue(property.roof_type)],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <p className="text-xs text-muted-foreground">{label}</p>
                      <p className="font-medium">{value}</p>
                    </div>
                  ))}
                </div>
              )}
              {property.property_type === "commercial" && (
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                  {[
                    ["Class", renderPropertyValue(property.building_class)],
                    ["Occupancy", renderPropertyValue(property.occupancy_type)],
                    ["Zoning", renderPropertyValue(property.zoning)],
                    ["Ceiling", property.ceiling_height ? `${property.ceiling_height} ft` : "—"],
                    ["Loading Docks", renderPropertyValue(property.loading_docks)],
                    ["Parking", renderPropertyValue(property.parking_spaces)],
                    ["Elevator", renderPropertyValue(property.elevator)],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <p className="text-xs text-muted-foreground">{label}</p>
                      <p className="font-medium">{value}</p>
                    </div>
                  ))}
                </div>
              )}
              {property.property_type === "multi-family" && (
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                  {[
                    ["Units", renderPropertyValue(property.number_of_units)],
                    ["Unit Mix", renderPropertyValue(property.unit_mix)],
                    ["Laundry", renderPropertyValue(property.laundry_type?.replace("-", " "))],
                    ["Parking", renderPropertyValue(property.parking_spaces)],
                    ["Elevator", renderPropertyValue(property.elevator)],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <p className="text-xs text-muted-foreground">{label}</p>
                      <p className="font-medium">{value}</p>
                    </div>
                  ))}
                </div>
              )}
              <Separator />
              <div className="space-y-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Edit Property</p>
                <div className="space-y-1.5">
                  <Label htmlFor="order-property-select">Property</Label>
                  <Select
                    value={assignmentForm.property_id}
                    onValueChange={(value) => setAssignmentForm((prev) => ({ ...prev, property_id: value }))}
                    disabled={updateOrder.isPending || deleteOrder.isPending}
                  >
                    <SelectTrigger id="order-property-select">
                      <SelectValue placeholder="Select property" />
                    </SelectTrigger>
                    <SelectContent>
                      {properties.map((option) => (
                        <SelectItem key={option.id} value={option.id}>
                          {[option.address_line1, option.city, option.state].filter(Boolean).join(", ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No property assigned</p>
          )}
        </CardContent>
      </Card>
  );

  const peopleCard = (
    <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="h-4 w-4 text-muted-foreground" />
            People
          </CardTitle>
          <CardDescription>Client and agent contacts.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2">
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Client</p>
            {client ? (
              <div className="space-y-1.5">
                <Link href={`/app/contacts/${client.id}`} className="font-medium hover:underline text-sm">{client.name}</Link>
                {client.email && (
                  <a className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground" href={`mailto:${client.email}`}>
                    <Mail className="h-3.5 w-3.5" />{client.email}
                  </a>
                )}
                {client.phone && (
                  <a className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground" href={`tel:${client.phone}`}>
                    <Phone className="h-3.5 w-3.5" />{client.phone}
                  </a>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No client assigned</p>
            )}
          </div>
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Agent</p>
            {agent ? (
              <div className="space-y-1.5">
                <p className="font-medium text-sm">{agent.name}</p>
                {agent.agency && <p className="text-xs text-muted-foreground">{agent.agency.name}</p>}
                {agent.email && (
                  <a className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground" href={`mailto:${agent.email}`}>
                    <Mail className="h-3.5 w-3.5" />{agent.email}
                  </a>
                )}
                {agent.phone && (
                  <a className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground" href={`tel:${agent.phone}`}>
                    <Phone className="h-3.5 w-3.5" />{agent.phone}
                  </a>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No agent assigned</p>
            )}
          </div>
          <div className="md:col-span-2">
            <Separator className="mb-4" />
            <div className="space-y-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Edit People</p>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="order-client-select">Client</Label>
                  <Select
                    value={assignmentForm.client_id}
                    onValueChange={(value) => setAssignmentForm((prev) => ({ ...prev, client_id: value }))}
                    disabled={updateOrder.isPending || deleteOrder.isPending}
                  >
                    <SelectTrigger id="order-client-select">
                      <SelectValue placeholder="Select client" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">No client</SelectItem>
                      {clients.map((option) => (
                        <SelectItem key={option.clientId} value={option.clientId}>
                          {option.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="order-agent-select">Agent</Label>
                  <Select
                    value={assignmentForm.agent_id}
                    onValueChange={(value) => setAssignmentForm((prev) => ({ ...prev, agent_id: value }))}
                    disabled={updateOrder.isPending || deleteOrder.isPending}
                  >
                    <SelectTrigger id="order-agent-select">
                      <SelectValue placeholder="Select agent" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">No agent</SelectItem>
                      {agents.map((option) => (
                        <SelectItem key={option.id} value={option.id}>
                          {option.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end">
                <Button size="sm" variant="outline" onClick={handleSaveAssignments} disabled={updateOrder.isPending || deleteOrder.isPending}>
                  {updateOrder.isPending ? "Saving..." : "Save Property & People"}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
  );

  const servicesCard = (
    <Card id="order-services">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Tag className="h-4 w-4 text-muted-foreground" />
          Services & Assignments
        </CardTitle>
        <CardDescription>Edit selected services and assign inspectors/vendors inline.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ServiceAssignmentsSection
          inspectors={inspectors}
          vendors={vendors.map((vendor) => ({
            id: vendor.id,
            name: vendor.name,
            vendor_type: vendor.vendorType ?? null,
            email: vendor.email ?? null,
            phone: vendor.phone ?? null,
          }))}
          services={services}
          serviceAssignments={serviceAssignments}
          onServiceToggle={handleServiceToggle}
          onServiceInspectorsChange={handleServiceInspectorsChange}
          onServiceVendorsChange={handleServiceVendorsChange}
          searchValue={serviceSearch}
          onSearchChange={setServiceSearch}
          helperText="Each selected service can be assigned to a specific inspector or vendor."
        />
        <div className="flex justify-end">
          <Button size="sm" variant="outline" onClick={handleSaveServices} disabled={updateOrder.isPending || deleteOrder.isPending}>
            {updateOrder.isPending ? "Saving..." : "Save Services"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const activityCard = (
    <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Activity</CardTitle>
          <CardDescription>Timeline of order events.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="border-l-2 border-border pl-3">
            <p className="text-xs font-medium">Order created</p>
            <p className="text-xs text-muted-foreground">{formatTimestampFull(order.created_at)}</p>
          </div>
          {order.scheduled_date && (
            <div className="border-l-2 border-border pl-3">
              <p className="text-xs font-medium">Scheduled for inspection</p>
              <p className="text-xs text-muted-foreground">
                {formatDate(order.scheduled_date, "EEEE, MMM d, yyyy")}
                {order.scheduled_time && ` at ${formatTime12(order.scheduled_time)}`}
              </p>
            </div>
          )}
          {order.completed_at && (
            <div className="border-l-2 border-border pl-3">
              <p className="text-xs font-medium">Order completed</p>
              <p className="text-xs text-muted-foreground">{formatTimestampFull(order.completed_at)}</p>
            </div>
          )}
          {order.report_delivered_at && (
            <div className="border-l-2 border-border pl-3">
              <p className="text-xs font-medium">Report delivered</p>
              <p className="text-xs text-muted-foreground">{formatTimestampFull(order.report_delivered_at)}</p>
            </div>
          )}
        </CardContent>
      </Card>
  );

  const dangerZone = (
    <div className="rounded-sm border border-destructive/30 bg-destructive/5 p-4 flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium">Delete order</p>
        <p className="text-xs text-muted-foreground">Permanently remove this order and all associated data.</p>
      </div>
      <Button variant="destructive" size="sm" onClick={handleDelete}>
        <Trash2 className="mr-2 h-4 w-4" />
        Delete
      </Button>
    </div>
  );

  const financialsCard = (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <DollarSign className="h-4 w-4 text-muted-foreground" />
          Margin & Billing
        </CardTitle>
        <CardDescription>Live economics for this order.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{formatMoney(order.subtotal)}</span>
          </div>
          {typeof order.discount === "number" && order.discount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Discount</span>
              <span>-{formatMoney(order.discount)}</span>
            </div>
          )}
          {typeof order.tax === "number" && order.tax > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tax</span>
              <span>{formatMoney(order.tax)}</span>
            </div>
          )}
          <Separator />
          <div className="flex justify-between font-semibold">
            <span>Total</span>
            <span>{formatMoney(order.total)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total Cost</span>
            <span>{formatMoney(draftTotalCost)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Gross Margin</span>
            <span className={cn(draftGrossMargin < 0 ? "text-destructive" : "")}>
              {formatMoney(draftGrossMargin)}
              {draftGrossMarginPct !== null ? ` (${draftGrossMarginPct.toFixed(1)}%)` : ""}
            </span>
          </div>
        </div>
        <Separator />
        <div className="space-y-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Cost Inputs</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="order-labor-cost">Labor</Label>
              <Input
                id="order-labor-cost"
                type="number"
                min={0}
                step="0.01"
                value={costForm.labor_cost}
                onChange={(event) => setCostForm((prev) => ({ ...prev, labor_cost: event.target.value }))}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="order-travel-cost">Travel</Label>
              <Input
                id="order-travel-cost"
                type="number"
                min={0}
                step="0.01"
                value={costForm.travel_cost}
                onChange={(event) => setCostForm((prev) => ({ ...prev, travel_cost: event.target.value }))}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="order-overhead-cost">Overhead</Label>
              <Input
                id="order-overhead-cost"
                type="number"
                min={0}
                step="0.01"
                value={costForm.overhead_cost}
                onChange={(event) => setCostForm((prev) => ({ ...prev, overhead_cost: event.target.value }))}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="order-other-cost">Other</Label>
              <Input
                id="order-other-cost"
                type="number"
                min={0}
                step="0.01"
                value={costForm.other_cost}
                onChange={(event) => setCostForm((prev) => ({ ...prev, other_cost: event.target.value }))}
                placeholder="0.00"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button size="sm" variant="outline" onClick={handleSaveCosts} disabled={updateOrder.isPending || deleteOrder.isPending}>
              {updateOrder.isPending ? "Saving..." : "Save Costs"}
            </Button>
          </div>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <Button size="sm" variant="outline" className="w-full" onClick={() => toast("Invoice creation is coming soon.")}>
            Create Invoice
          </Button>
          <Button size="sm" className="w-full" onClick={() => toast("Payment recording is coming soon.")}>Record Payment</Button>
        </div>
        {order.invoices && order.invoices.length > 0 && (
          <div className="space-y-2 pt-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Invoices</p>
            {order.invoices.map((invoice) => (
              <div key={invoice.id} className="flex items-center justify-between text-sm border-l-2 border-border pl-3">
                <Link href={`/app/invoices/${invoice.id}`} className="hover:underline font-medium">
                  {formatInvoiceNumber(invoice.id)}
                </Link>
                <span className="text-muted-foreground">{formatMoney(invoice.total)}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );

  const notesCard = (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Notes</CardTitle>
        <CardDescription>Internal notes for the team.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="order-internal-notes" className="sr-only">
            Internal notes
          </label>
          <textarea
            id="order-internal-notes"
            className="w-full min-h-30 rounded-sm border bg-background px-3 py-2 text-sm"
            value={internalNotes}
            onChange={(event) => setInternalNotes(event.target.value)}
            placeholder="Add internal notes..."
          />
          {internalHistory.length ? (
            <div className="space-y-3 pt-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Saved notes</p>
              {internalHistory.map((note) => (
                <div key={note.id} className="border-l-2 border-border pl-3 space-y-0.5">
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wide">
                    {formatTimestampFull(note.created_at)}
                    {note.created_by?.full_name ? ` • ${note.created_by.full_name}` : note.created_by?.email ? ` • ${note.created_by.email}` : ""}
                  </p>
                  <p className="text-sm">{note.body}</p>
                </div>
              ))}
            </div>
          ) : null}
        </div>
        <div className="flex justify-end">
          <Button size="sm" variant="outline" onClick={handleSaveNotes} disabled={createOrderNote.isPending}>
            {createOrderNote.isPending ? "Saving..." : "Save Notes"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const mainContent = (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,2.1fr)_minmax(320px,1fr)]">
      <div className="space-y-4">
        {workspaceCard}
        <div className="space-y-4">
          {propertyCard}
          {peopleCard}
          {servicesCard}
        </div>
        <OrderInspectionTab orderId={order.id} />
      </div>
      <div className="space-y-4 xl:sticky xl:top-20 xl:self-start">
        {financialsCard}
        {notesCard}
        {activityCard}
        {dangerZone}
      </div>
    </div>
  );

  return (
    <ResourceDetailLayout
      title={order.order_number}
      meta={headerMeta}
      headerActions={headerActions}
      main={mainContent}
    />
  );
}
