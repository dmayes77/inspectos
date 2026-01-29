"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AdminShell } from "@/components/layout/admin-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import { Calendar, Check, Clock, DollarSign, Edit, Mail, MapPin, Phone, Send, Tag, Trash2, User, ClipboardList } from "lucide-react";
import { useOrderById, useUpdateOrder, useDeleteOrder } from "@/hooks/use-orders";
import { useCreateOrderNote, useOrderNotes } from "@/hooks/use-order-notes";
import { mockAdminUser } from "@/lib/constants/mock-users";
import { cn } from "@/lib/utils";
import { formatDate, formatTime12, formatTimestamp, formatTimestampFull } from "@/lib/utils/dates";
import { formatInvoiceNumber } from "@/lib/utils/invoices";
import { RESIDENTIAL_PROPERTY_TYPES } from "@/lib/constants/property-options";
import { ResourceDetailLayout } from "@/components/shared/resource-detail-layout";
import type { InspectionAssignment, InspectionService } from "@/lib/data/orders";

function getStatusBadgeClasses(status: string) {
  switch (status) {
    case "pending":
      return "bg-gray-100 text-gray-800 border-gray-200";
    case "scheduled":
      return "bg-blue-100 text-blue-800 border-blue-200";
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

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: order, isLoading, isError } = useOrderById(id);
  const updateOrder = useUpdateOrder();
  const deleteOrder = useDeleteOrder();
  const [internalNotes, setInternalNotes] = useState("");
  const { data: orderNotes = [] } = useOrderNotes(id);
  const createOrderNote = useCreateOrderNote(id);

  const handleStatusChange = (newStatus: string) => {
    if (!order) return;
    updateOrder.mutate({ id: order.id, status: newStatus as typeof order.status });
  };

  const handleDelete = () => {
    if (!order) return;
    if (confirm("Are you sure you want to delete this order?")) {
      deleteOrder.mutate(order.id, {
        onSuccess: () => router.push("/admin/orders"),
      });
    }
  };

  if (isLoading) {
    return (
      <AdminShell user={mockAdminUser}>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading order...</p>
        </div>
      </AdminShell>
    );
  }

  if (isError || !order) {
    return (
      <AdminShell user={mockAdminUser}>
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <p className="text-muted-foreground">Order not found</p>
          <Link href="/admin/orders" className="text-sm text-primary underline">
            Back to Orders
          </Link>
        </div>
      </AdminShell>
    );
  }

  const property = order.property;
  const client = order.client;
  const agent = order.agent;
  const inspections = Array.isArray(order.inspection) ? order.inspection : order.inspection ? [order.inspection] : [];
  const inspection = inspections.length
    ? [...inspections].sort((a, b) => {
        const aKey = a.started_at ?? a.created_at ?? a.completed_at ?? "";
        const bKey = b.started_at ?? b.created_at ?? b.completed_at ?? "";
        return new Date(bKey).getTime() - new Date(aKey).getTime();
      })[0]
    : null;
  const assignments: InspectionAssignment[] = inspection?.assignments ?? [];
  const services: InspectionService[] = inspection?.services ?? [];
  const activeAssignments = assignments.filter((assignment) => !assignment.unassigned_at);
  const leadAssignment = activeAssignments.find((assignment) => assignment.role === "lead");
  const inspector = leadAssignment?.inspector ?? activeAssignments.find((assignment) => assignment.inspector)?.inspector ?? order.inspector;
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

  const internalHistory = orderNotes.filter((note) => note.note_type === "internal");

  const breadcrumb = (
    <>
      <Link href="/admin/overview" className="hover:text-foreground">
        Overview
      </Link>
      <span className="text-muted-foreground">/</span>
      <Link href="/admin/orders" className="hover:text-foreground">
        Orders
      </Link>
      <span className="text-muted-foreground">/</span>
      <span>{order.order_number}</span>
    </>
  );

  const headerMeta = (
    <>
      <Badge className={cn("text-xs px-2 py-0.5", getStatusBadgeClasses(order.status))}>{formatStatusLabel(order.status)}</Badge>
      <Badge variant="outline" className={cn("text-xs px-2 py-0.5", getPaymentBadgeClasses(order.payment_status))}>
        {formatStatusLabel(order.payment_status)}
      </Badge>
      <span className="text-xs text-muted-foreground">
        Created {formatTimestamp(order.created_at)}
        {order.source ? ` • Source: ${order.source}` : ""}
      </span>
    </>
  );

  const quickActionsSidebar = (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common updates for this order.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button variant="outline" asChild className="w-full justify-start">
            <Link href={`/admin/orders/${order.id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Order
            </Link>
          </Button>
          <Button variant="outline" className="w-full justify-start" onClick={() => handleStatusChange("scheduled")}>
            <Calendar className="mr-2 h-4 w-4" />
            Mark Scheduled
          </Button>
          <Button variant="outline" className="w-full justify-start" onClick={() => handleStatusChange("in_progress")}>
            <Clock className="mr-2 h-4 w-4" />
            Mark In Progress
          </Button>
          <Button variant="outline" className="w-full justify-start" onClick={() => handleStatusChange("completed")}>
            <Check className="mr-2 h-4 w-4" />
            Mark Completed
          </Button>
          <Button variant="outline" className="w-full justify-start" onClick={() => toast("Client portal link sending is coming soon.")}>
            <Send className="mr-2 h-4 w-4" />
            Send Client Portal Link
          </Button>
          <Button variant="outline" className="w-full justify-start" onClick={() => toast("Agent portal link sending is coming soon.")}>
            <Mail className="mr-2 h-4 w-4" />
            Send Agent Portal Link
          </Button>
          <Button variant="destructive" className="w-full justify-start" onClick={handleDelete}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Order
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Order Snapshot</CardTitle>
          <CardDescription>Key identifiers.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Order</span>
            <span className="font-medium">{order.order_number}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Created</span>
            <span>{formatTimestamp(order.created_at)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Inspection</span>
            <span>{inspection ? formatStatusLabel(inspection.status) : "Not created"}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const mainContent = (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-muted-foreground" />
            Order Summary
          </CardTitle>
          <CardDescription>Core status, payment, and source.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="space-y-1">
            <p className="text-xs uppercase text-muted-foreground">Status</p>
            <Badge className={cn("w-fit", getStatusBadgeClasses(order.status))}>{formatStatusLabel(order.status)}</Badge>
          </div>
          <div className="space-y-1">
            <p className="text-xs uppercase text-muted-foreground">Payment</p>
            <Badge variant="outline" className={cn(getPaymentBadgeClasses(order.payment_status))}>
              {formatStatusLabel(order.payment_status)}
            </Badge>
          </div>
          <div className="space-y-1">
            <p className="text-xs uppercase text-muted-foreground">Source</p>
            <p className="text-sm font-medium">{order.source || "—"}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            Property
          </CardTitle>
          <CardDescription>Location and key property details.</CardDescription>
        </CardHeader>
        <CardContent>
          {property ? (
            <div className="space-y-2">
              <p className="font-medium">{property.address_line1}</p>
              {property.address_line2 && <p className="text-muted-foreground">{property.address_line2}</p>}
              <p className="text-muted-foreground">
                {property.city}, {property.state} {property.zip_code}
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                <Badge variant="outline">{property.property_type.replace("-", " ")}</Badge>
                {property.year_built && <Badge variant="outline">Built {property.year_built}</Badge>}
                {property.square_feet && <Badge variant="outline">{property.square_feet.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")} sqft</Badge>}
              </div>
              {(residentialTypes.has(property.property_type) || property.property_type === "multi-family") && (
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-muted-foreground">
                  <div>
                    Bedrooms: <span className="text-foreground">{renderPropertyValue(property.bedrooms)}</span>
                  </div>
                  <div>
                    Bathrooms: <span className="text-foreground">{renderPropertyValue(property.bathrooms)}</span>
                  </div>
                  <div>
                    Stories: <span className="text-foreground">{renderPropertyValue(property.stories)}</span>
                  </div>
                  <div>
                    Foundation: <span className="text-foreground">{renderPropertyValue(property.foundation)}</span>
                  </div>
                  <div>
                    Garage: <span className="text-foreground">{renderPropertyValue(property.garage)}</span>
                  </div>
                  <div>
                    Pool: <span className="text-foreground">{renderPropertyValue(property.pool)}</span>
                  </div>
                </div>
              )}
              {residentialTypes.has(property.property_type) && (
                <div className="mt-3 grid grid-cols-2 gap-3 text-sm text-muted-foreground">
                  <div>
                    Basement: <span className="text-foreground">{renderPropertyValue(property.basement?.replace("-", " "))}</span>
                  </div>
                  <div>
                    Lot Size: <span className="text-foreground">{property.lot_size_acres ? `${property.lot_size_acres} acres` : "—"}</span>
                  </div>
                  <div>
                    Heating: <span className="text-foreground">{renderPropertyValue(property.heating_type)}</span>
                  </div>
                  <div>
                    Cooling: <span className="text-foreground">{renderPropertyValue(property.cooling_type)}</span>
                  </div>
                  <div>
                    Roof: <span className="text-foreground">{renderPropertyValue(property.roof_type)}</span>
                  </div>
                </div>
              )}
              {property.property_type === "commercial" && (
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-muted-foreground">
                  <div>
                    Class: <span className="text-foreground">{renderPropertyValue(property.building_class)}</span>
                  </div>
                  <div>
                    Occupancy: <span className="text-foreground">{renderPropertyValue(property.occupancy_type)}</span>
                  </div>
                  <div>
                    Zoning: <span className="text-foreground">{renderPropertyValue(property.zoning)}</span>
                  </div>
                  <div>
                    Ceiling: <span className="text-foreground">{property.ceiling_height ? `${property.ceiling_height} ft` : "—"}</span>
                  </div>
                  <div>
                    Loading Docks: <span className="text-foreground">{renderPropertyValue(property.loading_docks)}</span>
                  </div>
                  <div>
                    Parking: <span className="text-foreground">{renderPropertyValue(property.parking_spaces)}</span>
                  </div>
                  <div>
                    Elevator: <span className="text-foreground">{renderPropertyValue(property.elevator)}</span>
                  </div>
                </div>
              )}
              {property.property_type === "multi-family" && (
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-muted-foreground">
                  <div>
                    Units: <span className="text-foreground">{renderPropertyValue(property.number_of_units)}</span>
                  </div>
                  <div>
                    Unit Mix: <span className="text-foreground">{renderPropertyValue(property.unit_mix)}</span>
                  </div>
                  <div>
                    Laundry: <span className="text-foreground">{renderPropertyValue(property.laundry_type?.replace("-", " "))}</span>
                  </div>
                  <div>
                    Parking: <span className="text-foreground">{renderPropertyValue(property.parking_spaces)}</span>
                  </div>
                  <div>
                    Elevator: <span className="text-foreground">{renderPropertyValue(property.elevator)}</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-muted-foreground">No property assigned</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            People
          </CardTitle>
          <CardDescription>Client and agent contacts.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <p className="text-xs uppercase text-muted-foreground">Client</p>
            {client ? (
              <div className="space-y-2">
                <p className="font-medium">{client.name}</p>
                {client.email && (
                  <a className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground" href={`mailto:${client.email}`}>
                    <Mail className="h-4 w-4" />
                    {client.email}
                  </a>
                )}
                {client.phone && (
                  <a className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground" href={`tel:${client.phone}`}>
                    <Phone className="h-4 w-4" />
                    {client.phone}
                  </a>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No client assigned</p>
            )}
          </div>
          <div className="space-y-2">
            <p className="text-xs uppercase text-muted-foreground">Agent</p>
            {agent ? (
              <div className="space-y-2">
                <p className="font-medium">{agent.name}</p>
                {agent.agency && <p className="text-sm text-muted-foreground">{agent.agency.name}</p>}
                {agent.email && (
                  <a className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground" href={`mailto:${agent.email}`}>
                    <Mail className="h-4 w-4" />
                    {agent.email}
                  </a>
                )}
                {agent.phone && (
                  <a className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground" href={`tel:${agent.phone}`}>
                    <Phone className="h-4 w-4" />
                    {agent.phone}
                  </a>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No agent assigned</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            Schedule
          </CardTitle>
          <CardDescription>Appointment timing and duration.</CardDescription>
        </CardHeader>
        <CardContent>
          {order.scheduled_date ? (
            <div className="space-y-2">
              <p className="font-medium">{formatDate(order.scheduled_date, "EEEE, MMM d, yyyy")}</p>
              {order.scheduled_time && <p className="text-muted-foreground">at {formatTime12(order.scheduled_time)}</p>}
              <p className="text-muted-foreground">Duration: {order.duration_minutes} minutes</p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-muted-foreground">Not yet scheduled</p>
              <Button size="sm" onClick={() => toast("Scheduling is coming soon.")}>
                Schedule Now
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Inspection</CardTitle>
          <CardDescription>{inspection ? `Status: ${formatStatusLabel(inspection.status)}` : "No inspection started"}</CardDescription>
        </CardHeader>
        <CardContent>
          {inspection ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Started</p>
                  <p className="font-medium">{inspection.started_at ? formatTimestampFull(inspection.started_at) : "Not started"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="font-medium">{inspection.completed_at ? formatTimestampFull(inspection.completed_at) : "Not completed"}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Inspector</p>
                {inspector ? (
                  <div className="mt-1 space-y-1 text-sm">
                    <p className="font-medium text-foreground">{inspector.full_name ?? inspector.email}</p>
                    {inspector.email ? (
                      <a className="flex items-center gap-2 text-muted-foreground hover:text-foreground" href={`mailto:${inspector.email}`}>
                        <Mail className="h-4 w-4" />
                        {inspector.email}
                      </a>
                    ) : null}
                  </div>
                ) : (
                  <p className="mt-1 text-sm text-muted-foreground">Unassigned</p>
                )}
              </div>
              {inspection.notes && (
                <div>
                  <p className="text-sm text-muted-foreground">Notes</p>
                  <p className="mt-1">{inspection.notes}</p>
                </div>
              )}
              {services.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Services</p>
                  <div className="space-y-2">
                    {services.map((service) => (
                      <div key={service.id} className="flex items-center justify-between rounded border border-muted/70 px-3 py-2">
                        <div>
                          <p className="font-medium">{service.name}</p>
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-xs",
                              service.status === "completed"
                                ? "bg-green-100 text-green-800"
                                : service.status === "in_progress"
                                  ? "bg-amber-100 text-amber-800"
                                  : "",
                            )}
                          >
                            {formatStatusLabel(service.status)}
                          </Badge>
                        </div>
                        <p className="text-sm font-semibold">{formatMoney(service.price)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No services selected yet.</p>
              )}
              <Button asChild>
                <Link href={`/admin/inspections/${inspection.id}`}>View Inspection</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>Inspection has not been started yet.</p>
              <div className="rounded-md border border-dashed p-3 text-foreground">
                <p className="text-xs uppercase text-muted-foreground">Inspector</p>
                {inspector ? (
                  <div className="mt-1 space-y-1">
                    <p className="font-medium">{inspector.full_name ?? inspector.email}</p>
                    {inspector.email ? (
                      <a className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground" href={`mailto:${inspector.email}`}>
                        <Mail className="h-4 w-4" />
                        {inspector.email}
                      </a>
                    ) : null}
                    <p className="text-xs text-muted-foreground">This inspector will be attached when you create the inspection.</p>
                  </div>
                ) : (
                  <p className="mt-1 text-sm text-muted-foreground">Assign an inspector during inspection creation.</p>
                )}
              </div>
              <Button asChild>
                <Link href={`/admin/inspections/new?orderId=${order.id}`}>Add Inspection</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            Financials
          </CardTitle>
          <CardDescription>Totals, payment, and invoices.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Subtotal</span>
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
                <span>Tax</span>
                <span>{formatMoney(order.tax)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-semibold">
              <span>Total</span>
              <span>{formatMoney(order.total)}</span>
            </div>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <span className="text-sm">Payment Status</span>
            <Badge variant="outline" className={cn(getPaymentBadgeClasses(order.payment_status))}>
              {formatStatusLabel(order.payment_status)}
            </Badge>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => toast("Invoice creation is coming soon.")}>
              Create Invoice
            </Button>
            <Button onClick={() => toast("Payment recording is coming soon.")}>Record Payment</Button>
          </div>
          {order.invoices && order.invoices.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Invoices</p>
              {order.invoices.map((invoice) => (
                <div key={invoice.id} className="flex items-center justify-between text-sm">
                  <Link href={`/admin/invoices/${invoice.id}`} className="hover:underline">
                    {formatInvoiceNumber(invoice.id)}
                  </Link>
                  <span className="font-medium">{formatMoney(invoice.total)}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Report Delivery</CardTitle>
          <CardDescription>Delivery status from the order record.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Report Delivered</span>
            <span className="font-medium">{order.report_delivered_at ? formatTimestampFull(order.report_delivered_at) : "Not delivered"}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Payment Status</span>
            <Badge variant="outline" className={cn("text-xs", getPaymentBadgeClasses(order.payment_status))}>
              {formatStatusLabel(order.payment_status)}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notes</CardTitle>
          <CardDescription>Internal notes for the team.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="order-internal-notes" className="sr-only">
              Internal notes
            </label>
            <textarea
              id="order-internal-notes"
              className="w-full min-h-30 rounded-md border bg-background px-3 py-2 text-sm"
              value={internalNotes}
              onChange={(event) => setInternalNotes(event.target.value)}
              placeholder="Add internal notes..."
            />
            {internalHistory.length ? (
              <div className="space-y-2 rounded-md border bg-muted/30 p-3 text-xs text-muted-foreground">
                <p className="font-medium text-foreground">Saved notes</p>
                {internalHistory.map((note) => (
                  <div key={note.id} className="space-y-1">
                    <p className="text-[11px] uppercase tracking-wide">
                      {formatTimestampFull(note.created_at)}
                      {note.created_by?.full_name ? ` • ${note.created_by.full_name}` : note.created_by?.email ? ` • ${note.created_by.email}` : ""}
                    </p>
                    <p className="text-sm text-foreground">{note.body}</p>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={handleSaveNotes} disabled={createOrderNote.isPending}>
              {createOrderNote.isPending ? "Saving..." : "Save Notes"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Activity</CardTitle>
          <CardDescription>Timeline of order events.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <div className="mt-2 h-2 w-2 rounded-full bg-green-500" />
            <div>
              <p className="font-medium">Order created</p>
              <p className="text-sm text-muted-foreground">{formatTimestampFull(order.created_at)}</p>
            </div>
          </div>
          {order.scheduled_date && (
            <div className="flex gap-3">
              <div className="mt-2 h-2 w-2 rounded-full bg-blue-500" />
              <div>
                <p className="font-medium">Scheduled for inspection</p>
                <p className="text-sm text-muted-foreground">
                  {formatDate(order.scheduled_date, "EEEE, MMM d, yyyy")}
                  {order.scheduled_time && ` at ${formatTime12(order.scheduled_time)}`}
                </p>
              </div>
            </div>
          )}
          {order.completed_at && (
            <div className="flex gap-3">
              <div className="mt-2 h-2 w-2 rounded-full bg-green-500" />
              <div>
                <p className="font-medium">Order completed</p>
                <p className="text-sm text-muted-foreground">{formatTimestampFull(order.completed_at)}</p>
              </div>
            </div>
          )}
          {order.report_delivered_at && (
            <div className="flex gap-3">
              <div className="mt-2 h-2 w-2 rounded-full bg-purple-500" />
              <div>
                <p className="font-medium">Report delivered</p>
                <p className="text-sm text-muted-foreground">{formatTimestampFull(order.report_delivered_at)}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  return (
    <AdminShell user={mockAdminUser}>
      <ResourceDetailLayout
        breadcrumb={breadcrumb}
        title={order.order_number}
        description="Order detail, property information, and quick actions."
        meta={headerMeta}
        backHref="/admin/orders"
        main={mainContent}
        sidebar={quickActionsSidebar}
      />
    </AdminShell>
  );
}
