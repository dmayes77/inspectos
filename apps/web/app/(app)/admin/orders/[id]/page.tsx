"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import { Calendar, Check, Clock, DollarSign, Edit, Mail, MapPin, Phone, Send, Tag, Trash2, User } from "lucide-react";
import { useOrderById, useUpdateOrder, useDeleteOrder } from "@/hooks/use-orders";
import { useCreateOrderNote, useOrderNotes } from "@/hooks/use-order-notes";
import { cn } from "@/lib/utils";
import { formatDate, formatTime12, formatTimestamp, formatTimestampFull } from "@inspectos/shared/utils/dates";
import { formatInvoiceNumber } from "@inspectos/shared/utils/invoices";
import { RESIDENTIAL_PROPERTY_TYPES } from "@inspectos/shared/constants/property-options";
import { ResourceDetailLayout } from "@/components/shared/resource-detail-layout";
import { OrderInspectionTab } from "@/components/orders/order-inspection-tab";

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
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading order...</p>
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-muted-foreground">Order not found</p>
        <Link href="/admin/orders" className="text-sm text-primary underline">
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

  const internalHistory = orderNotes.filter((note) => note.note_type === "internal");

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

  const headerActions = (
    <Button variant="outline" asChild>
      <Link href={`/admin/orders/${order.id}/edit`}>
        <Edit className="mr-2 h-4 w-4" />
        Edit Order
      </Link>
    </Button>
  );

  const overviewTab = (
    <div className="space-y-4">
      {/* Order status + quick actions */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <Tag className="h-4 w-4 text-muted-foreground" />
                Order
              </CardTitle>
              <CardDescription>Status, payment, and quick actions.</CardDescription>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Badge className={cn("text-xs", getStatusBadgeClasses(order.status))}>{formatStatusLabel(order.status)}</Badge>
              <Badge variant="outline" className={cn("text-xs", getPaymentBadgeClasses(order.payment_status))}>
                {formatStatusLabel(order.payment_status)}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => handleStatusChange("scheduled")}>
              <Calendar className="mr-1.5 h-3.5 w-3.5" />
              Mark Scheduled
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleStatusChange("in_progress")}>
              <Clock className="mr-1.5 h-3.5 w-3.5" />
              Mark In Progress
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleStatusChange("completed")}>
              <Check className="mr-1.5 h-3.5 w-3.5" />
              Mark Completed
            </Button>
            <Button size="sm" variant="outline" onClick={() => toast("Client portal link sending is coming soon.")}>
              <Send className="mr-1.5 h-3.5 w-3.5" />
              Send Client Link
            </Button>
            <Button size="sm" variant="outline" onClick={() => toast("Agent portal link sending is coming soon.")}>
              <Mail className="mr-1.5 h-3.5 w-3.5" />
              Send Agent Link
            </Button>
          </div>
          {(order.source || order.report_delivered_at) && (
            <>
              <Separator />
              <div className="grid grid-cols-2 gap-4 text-sm">
                {order.source && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Source</p>
                    <p className="font-medium">{order.source}</p>
                  </div>
                )}
                {order.report_delivered_at && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Report Delivered</p>
                    <p className="font-medium">{formatTimestampFull(order.report_delivered_at)}</p>
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Property */}
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
                <Badge variant="outline" className="text-xs">{property.property_type.replace("-", " ")}</Badge>
                {property.year_built && <Badge variant="outline" className="text-xs">Built {property.year_built}</Badge>}
                {property.square_feet && <Badge variant="outline" className="text-xs">{property.square_feet.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")} sqft</Badge>}
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
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No property assigned</p>
          )}
        </CardContent>
      </Card>

      {/* People */}
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
                <Link href={`/admin/contacts/${client.id}`} className="font-medium hover:underline text-sm">{client.name}</Link>
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
        </CardContent>
      </Card>

      {/* Schedule */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            Schedule
          </CardTitle>
          <CardDescription>Appointment timing and duration.</CardDescription>
        </CardHeader>
        <CardContent>
          {order.scheduled_date ? (
            <div className="space-y-1">
              <p className="font-medium">{formatDate(order.scheduled_date, "EEEE, MMM d, yyyy")}</p>
              {order.scheduled_time && <p className="text-sm text-muted-foreground">at {formatTime12(order.scheduled_time)}</p>}
              <p className="text-sm text-muted-foreground">Duration: {order.duration_minutes} minutes</p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Not yet scheduled</p>
              <Button size="sm" onClick={() => toast("Scheduling is coming soon.")}>
                Schedule Now
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Activity timeline */}
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

      {/* Danger zone */}
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium">Delete order</p>
          <p className="text-xs text-muted-foreground">Permanently remove this order and all associated data.</p>
        </div>
        <Button variant="destructive" size="sm" onClick={handleDelete}>
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </Button>
      </div>
    </div>
  );

  const financialsTab = (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <DollarSign className="h-4 w-4 text-muted-foreground" />
          Financials
        </CardTitle>
        <CardDescription>Totals, payment, and invoices.</CardDescription>
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
        </div>
        <div className="flex items-center justify-between pt-1">
          <span className="text-sm text-muted-foreground">Payment Status</span>
          <Badge variant="outline" className={cn("text-xs", getPaymentBadgeClasses(order.payment_status))}>
            {formatStatusLabel(order.payment_status)}
          </Badge>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => toast("Invoice creation is coming soon.")}>
            Create Invoice
          </Button>
          <Button size="sm" onClick={() => toast("Payment recording is coming soon.")}>Record Payment</Button>
        </div>
        {order.invoices && order.invoices.length > 0 && (
          <div className="space-y-2 pt-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Invoices</p>
            {order.invoices.map((invoice) => (
              <div key={invoice.id} className="flex items-center justify-between text-sm border-l-2 border-border pl-3">
                <Link href={`/admin/invoices/${invoice.id}`} className="hover:underline font-medium">
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

  const notesTab = (
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
            className="w-full min-h-30 rounded-md border bg-background px-3 py-2 text-sm"
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
    <div className="space-y-4">
      {overviewTab}
      <OrderInspectionTab orderId={order.id} />
      {financialsTab}
      {notesTab}
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
