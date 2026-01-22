"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AdminShell } from "@/components/layout/admin-shell";
import { AdminPageHeader } from "@/components/layout/admin-page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, DollarSign, FileText, MapPin, User, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { mockAdminUser } from "@/lib/constants/mock-users";
import { useCreateOrder } from "@/hooks/use-orders";
import { useClients } from "@/hooks/use-clients";
import { useAgents } from "@/hooks/use-agents";
import { useInspectors } from "@/hooks/use-team";
import { useProperties, type Property } from "@/hooks/use-properties";
import { useServices, type Service } from "@/hooks/use-services";

type OrderFormState = {
  client_id: string | null;
  agent_id: string | null;
  inspector_id: string | null;
  property_id: string;
  scheduled_date: string;
  scheduled_time: string;
  duration_minutes: string;
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

function getServicePrice(service: Service) {
  return Number(service.price ?? 0);
}

export default function NewOrderPage() {
  const router = useRouter();
  const createOrder = useCreateOrder();
  const { data: clients = [] } = useClients();
  const { data: agents = [] } = useAgents();
  const { data: inspectors = [] } = useInspectors();
  const { data: properties = [] } = useProperties("demo");
  const { data: services = [] } = useServices();

  const [form, setForm] = useState<OrderFormState>({
    client_id: null,
    agent_id: null,
    inspector_id: null,
    property_id: "",
    scheduled_date: "",
    scheduled_time: "",
    duration_minutes: "",
    source: "",
    internal_notes: "",
    client_notes: "",
  });
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);

  const selectedServices = useMemo(() => {
    return services.filter((service) => selectedServiceIds.includes(service.serviceId));
  }, [services, selectedServiceIds]);

  const totals = useMemo(() => {
    const subtotal = selectedServices.reduce((sum, service) => sum + getServicePrice(service), 0);
    const duration = selectedServices.reduce(
      (sum, service) => sum + Number(service.durationMinutes ?? 0),
      0
    );
    return { subtotal, duration };
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
      property_id: form.property_id,
      client_id: form.client_id || null,
      agent_id: form.agent_id || null,
      inspector_id: form.inspector_id || null,
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

    createOrder.mutate(payload, {
      onSuccess: (order) => {
        toast.success("Order created.");
        router.push(`/admin/orders/${order.id}`);
      },
      onError: (error) => {
        const message = error instanceof Error ? error.message : "Failed to create order.";
        toast.error(message);
      },
    });
  };

  return (
    <AdminShell user={mockAdminUser}>
      <div className="space-y-4">
        <AdminPageHeader
          title="New Order"
          description="Create a new inspection order and assign services"
          actions={
            <div className="flex items-center gap-2">
              <Button variant="ghost" asChild>
                <Link href="/admin/orders">Cancel</Link>
              </Button>
              <Button onClick={handleSubmit} disabled={createOrder.isPending}>
                {createOrder.isPending ? "Creating..." : "Create Order"}
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
                <CardDescription>Select the property being inspected.</CardDescription>
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
                <CardDescription>Link the client, agent, and inspector.</CardDescription>
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
                <CardDescription>Set the inspection schedule and duration.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-3">
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
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  Services
                </CardTitle>
                <CardDescription>Pick the inspection services in this order.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-2">
                  {services.map((service) => {
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
                            {service.category && (
                              <Badge variant="outline" className="uppercase">
                                {service.category}
                              </Badge>
                            )}
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
                  {services.length === 0 && (
                    <div className="text-sm text-muted-foreground">No services found.</div>
                  )}
                </div>
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
                <CardDescription>Order totals and selections.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span>Services</span>
                  <span>{selectedServices.length}</span>
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
                  <span>Set after creation</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-muted-foreground" />
                  Ready to Schedule
                </CardTitle>
                <CardDescription>Assign an inspector to auto-schedule.</CardDescription>
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
