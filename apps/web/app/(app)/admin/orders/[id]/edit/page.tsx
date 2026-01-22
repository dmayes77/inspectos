"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AdminShell } from "@/components/layout/admin-shell";
import { AdminPageHeader } from "@/components/layout/admin-page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, DollarSign, FileText, MapPin, User, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { mockAdminUser } from "@/lib/constants/mock-users";
import { useOrderById, useUpdateOrder, type Order } from "@/hooks/use-orders";
import { useClients } from "@/hooks/use-clients";
import { useAgents } from "@/hooks/use-agents";
import { useInspectors } from "@/hooks/use-team";
import { useProperties, type Property } from "@/hooks/use-properties";

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

function OrderEditForm({ order }: { order: Order }) {
  const router = useRouter();
  const updateOrder = useUpdateOrder();
  const { data: clients = [] } = useClients();
  const { data: agents = [] } = useAgents();
  const { data: inspectors = [] } = useInspectors();
  const { data: properties = [] } = useProperties("demo");

  const [form, setForm] = useState<OrderFormState>(() => ({
    client_id: order.client_id ?? null,
    agent_id: order.agent_id ?? null,
    inspector_id: order.inspector_id ?? null,
    property_id: order.property_id,
    scheduled_date: order.scheduled_date ?? "",
    scheduled_time: order.scheduled_time ?? "",
    duration_minutes: order.duration_minutes ? String(order.duration_minutes) : "",
    status: order.status,
    payment_status: order.payment_status,
    source: order.source ?? "",
    internal_notes: order.internal_notes ?? "",
    client_notes: order.client_notes ?? "",
  }));

  const serviceTotals = useMemo(() => {
    const services = order.inspection?.services ?? [];
    const subtotal = services.reduce((sum, service) => sum + Number(service.price ?? 0), 0);
    const duration = services.reduce((sum, service) => sum + Number(service.duration_minutes ?? 0), 0);
    return { subtotal, duration, count: services.length };
  }, [order.inspection?.services]);

  const handleSubmit = () => {
    if (!form.property_id) {
      toast.error("Select a property to continue.");
      return;
    }

    updateOrder.mutate(
      {
        id: order.id,
        property_id: form.property_id,
        client_id: form.client_id || null,
        agent_id: form.agent_id || null,
        inspector_id: form.inspector_id || null,
        scheduled_date: form.scheduled_date || null,
        scheduled_time: form.scheduled_time || null,
        duration_minutes: form.duration_minutes ? Number(form.duration_minutes) : undefined,
        status: form.status,
        payment_status: form.payment_status,
        source: form.source || undefined,
        internal_notes: form.internal_notes || null,
        client_notes: form.client_notes || null,
      },
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
  };

  return (
    <AdminShell user={mockAdminUser}>
      <div className="space-y-4">
        <AdminPageHeader
          title={`Edit ${order.order_number}`}
          description="Update order details and schedule information"
          actions={
            <div className="flex items-center gap-2">
              <Button variant="ghost" asChild>
                <Link href={`/admin/orders/${order.id}`}>Cancel</Link>
              </Button>
              <Button onClick={handleSubmit} disabled={updateOrder.isPending}>
                {updateOrder.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
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
                <CardDescription>Update the property tied to this order.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="property_id">Property</Label>
                  <Select
                    value={form.property_id}
                    onValueChange={(value) => setForm((prev) => ({ ...prev, property_id: value }))}
                  >
                    <SelectTrigger id="property_id">
                      <SelectValue placeholder="Select property" />
                    </SelectTrigger>
                    <SelectContent>
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
                <CardDescription>Manage client, agent, and inspector assignments.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="client_id">Client</Label>
                  <Select
                    value={form.client_id ?? "__none__"}
                    onValueChange={(value) =>
                      setForm((prev) => ({
                        ...prev,
                        client_id: value === "__none__" ? null : value,
                      }))
                    }
                  >
                    <SelectTrigger id="client_id">
                      <SelectValue placeholder="Select client" />
                    </SelectTrigger>
                    <SelectContent>
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
                    onValueChange={(value) =>
                      setForm((prev) => ({
                        ...prev,
                        agent_id: value === "__none__" ? null : value,
                      }))
                    }
                  >
                    <SelectTrigger id="agent_id">
                      <SelectValue placeholder="Select agent" />
                    </SelectTrigger>
                    <SelectContent>
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
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  Schedule
                </CardTitle>
                <CardDescription>Adjust the inspection schedule and status.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-4">
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
                    placeholder={serviceTotals.duration ? `${serviceTotals.duration}` : "120"}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, duration_minutes: event.target.value }))
                    }
                  />
                </div>
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
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  Billing
                </CardTitle>
                <CardDescription>Track payment status for this order.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-2">
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
                  <p className="text-lg font-semibold">${order.total.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">
                    Adjust totals in financials module.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  Services
                </CardTitle>
                <CardDescription>Services are managed from the inspection.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {(order.inspection?.services ?? []).map((service) => (
                  <div
                    key={service.id}
                    className="flex items-center justify-between rounded-md border px-3 py-2"
                  >
                    <div>
                      <p className="font-medium">{service.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Status: {formatStatusLabel(service.status)}
                      </p>
                    </div>
                    <span className="text-sm font-semibold">
                      ${Number(service.price ?? 0).toFixed(2)}
                    </span>
                  </div>
                ))}
                {(order.inspection?.services ?? []).length === 0 && (
                  <p className="text-sm text-muted-foreground">No services attached yet.</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
                <CardDescription>Internal notes or client instructions.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-2">
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
                <CardDescription>Services and schedule snapshot.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span>Services</span>
                  <span>{serviceTotals.count}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Estimated Duration</span>
                  <span>{serviceTotals.duration || 0} min</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between text-sm">
                  <span>Subtotal</span>
                  <span className="font-semibold">${serviceTotals.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Order total</span>
                  <span>${order.total.toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-muted-foreground" />
                  Schedule Status
                </CardTitle>
                <CardDescription>Quick glance on assignment.</CardDescription>
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
      </div>
    </AdminShell>
  );
}

export default function EditOrderPage() {
  const params = useParams();
  const orderId = typeof params.id === "string" ? params.id : "";
  const { data: order, isLoading, isError } = useOrderById(orderId);

  if (isLoading) {
    return (
      <AdminShell user={mockAdminUser}>
        <div className="py-12 text-center text-muted-foreground">Loading order...</div>
      </AdminShell>
    );
  }

  if (isError || !order) {
    return (
      <AdminShell user={mockAdminUser}>
        <div className="space-y-6">
          <Button variant="ghost" asChild>
            <Link href="/admin/orders">
              Back to Orders
            </Link>
          </Button>
          <div className="text-center py-12 text-muted-foreground">Order not found.</div>
        </div>
      </AdminShell>
    );
  }

  return <OrderEditForm key={order.id} order={order} />;
}
