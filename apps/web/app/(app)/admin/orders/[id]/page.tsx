"use client";

import { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AdminShell } from "@/components/layout/admin-shell";
import { AdminPageHeader } from "@/components/layout/admin-page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ArrowLeft,
  Building2,
  Calendar,
  Check,
  Clock,
  DollarSign,
  Edit,
  FileText,
  Mail,
  MapPin,
  MoreVertical,
  Phone,
  Send,
  Tag,
  Trash2,
  User,
  UserCheck,
  ClipboardList,
} from "lucide-react";
import { useOrderById, useUpdateOrder, useDeleteOrder } from "@/hooks/use-orders";
import { mockAdminUser } from "@/lib/constants/mock-users";
import { cn } from "@/lib/utils";
import { formatDateShort, formatTime12 } from "@/lib/utils/dates";

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

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: order, isLoading, isError } = useOrderById(id);
  const updateOrder = useUpdateOrder();
  const deleteOrder = useDeleteOrder();

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
          <Button variant="outline" asChild>
            <Link href="/admin/orders">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Orders
            </Link>
          </Button>
        </div>
      </AdminShell>
    );
  }

  const property = order.property;
  const client = order.client;
  const agent = order.agent;
  const inspector = order.inspector;
  const inspection = order.inspection;

  return (
    <AdminShell user={mockAdminUser}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" asChild>
                <Link href="/admin/orders">
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
              <h1 className="text-2xl font-bold">{order.order_number}</h1>
              <Badge className={cn("ml-2", getStatusBadgeClasses(order.status))}>
                {formatStatusLabel(order.status)}
              </Badge>
              <Badge variant="outline" className={cn(getPaymentBadgeClasses(order.payment_status))}>
                {formatStatusLabel(order.payment_status)}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              Created {new Date(order.created_at).toLocaleDateString()}
              {order.source && ` • Source: ${order.source}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link href={`/admin/orders/${order.id}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleStatusChange("scheduled")}>
                  <Calendar className="mr-2 h-4 w-4" />
                  Mark Scheduled
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleStatusChange("in_progress")}>
                  <Clock className="mr-2 h-4 w-4" />
                  Mark In Progress
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleStatusChange("completed")}>
                  <Check className="mr-2 h-4 w-4" />
                  Mark Completed
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Send className="mr-2 h-4 w-4" />
                  Send Client Portal Link
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Mail className="mr-2 h-4 w-4" />
                  Send Agent Portal Link
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Order
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-4">
          <div className="space-y-4 lg:col-span-3">
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
                  <Badge className={cn("w-fit", getStatusBadgeClasses(order.status))}>
                    {formatStatusLabel(order.status)}
                  </Badge>
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
                    {property.address_line2 && (
                      <p className="text-muted-foreground">{property.address_line2}</p>
                    )}
                    <p className="text-muted-foreground">
                      {property.city}, {property.state} {property.zip_code}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      <Badge variant="outline">{property.property_type}</Badge>
                      {property.year_built && <Badge variant="outline">Built {property.year_built}</Badge>}
                      {property.square_feet && (
                        <Badge variant="outline">{property.square_feet.toLocaleString()} sqft</Badge>
                      )}
                    </div>
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
                <CardDescription>Client, agent, and inspector contacts.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-3">
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
                <div className="space-y-2">
                  <p className="text-xs uppercase text-muted-foreground">Inspector</p>
                  {inspector ? (
                    <div className="space-y-2">
                      <p className="font-medium">{inspector.full_name ?? inspector.email}</p>
                      <a className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground" href={`mailto:${inspector.email}`}>
                        <Mail className="h-4 w-4" />
                        {inspector.email}
                      </a>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Unassigned</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardList className="h-4 w-4 text-muted-foreground" />
                  Services
                </CardTitle>
                <CardDescription>Selected services and pricing.</CardDescription>
              </CardHeader>
              <CardContent>
                {inspection?.services && inspection.services.length > 0 ? (
                  <div className="space-y-3">
                    {inspection.services.map((service) => (
                      <div key={service.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                        <div>
                          <p className="font-medium">{service.name}</p>
                          <Badge
                            variant="outline"
                            className={cn(
                              "mt-1",
                              service.status === "completed"
                                ? "bg-green-100 text-green-800"
                                : service.status === "in_progress"
                                ? "bg-amber-100 text-amber-800"
                                : ""
                            )}
                          >
                            {formatStatusLabel(service.status)}
                          </Badge>
                        </div>
                        <p className="font-medium">${service.price.toFixed(2)}</p>
                      </div>
                    ))}
                    <Separator />
                    <div className="flex justify-between font-semibold">
                      <span>Total</span>
                      <span>${order.total.toFixed(2)}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No services selected</p>
                )}
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
                    <p className="font-medium">{formatDateShort(order.scheduled_date)}</p>
                    {order.scheduled_time && (
                      <p className="text-muted-foreground">
                        at {formatTime12(order.scheduled_time)}
                      </p>
                    )}
                    <p className="text-muted-foreground">Duration: {order.duration_minutes} minutes</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-muted-foreground">Not yet scheduled</p>
                    <Button size="sm">Schedule Now</Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Inspection</CardTitle>
                <CardDescription>
                  {inspection ? `Status: ${formatStatusLabel(inspection.status)}` : "No inspection started"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {inspection ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Started</p>
                        <p className="font-medium">
                          {inspection.started_at ? new Date(inspection.started_at).toLocaleString() : "Not started"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Completed</p>
                        <p className="font-medium">
                          {inspection.completed_at ? new Date(inspection.completed_at).toLocaleString() : "Not completed"}
                        </p>
                      </div>
                    </div>
                    {inspection.notes && (
                      <div>
                        <p className="text-sm text-muted-foreground">Notes</p>
                        <p className="mt-1">{inspection.notes}</p>
                      </div>
                    )}
                    <Button asChild>
                      <Link href={`/admin/inspections/${inspection.id}`}>View Inspection</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="text-muted-foreground">Inspection has not been started yet.</div>
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
                    <span>${order.subtotal.toFixed(2)}</span>
                  </div>
                  {order.discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount</span>
                      <span>-${order.discount.toFixed(2)}</span>
                    </div>
                  )}
                  {order.tax > 0 && (
                    <div className="flex justify-between">
                      <span>Tax</span>
                      <span>${order.tax.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-semibold">
                    <span>Total</span>
                    <span>${order.total.toFixed(2)}</span>
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
                  <Button variant="outline">Create Invoice</Button>
                  <Button>Record Payment</Button>
                </div>
                {order.invoices && order.invoices.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Invoices</p>
                    {order.invoices.map((invoice) => (
                      <div key={invoice.id} className="flex items-center justify-between text-sm">
                        <span>Invoice #{invoice.id.slice(0, 8)}</span>
                        <span className="font-medium">${invoice.total.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Communications</CardTitle>
                <CardDescription>Send portal links and report delivery.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                <Button variant="outline">
                  <Send className="mr-2 h-4 w-4" />
                  Client Portal
                </Button>
                <Button variant="outline">
                  <Send className="mr-2 h-4 w-4" />
                  Agent Portal
                </Button>
                <Button variant="outline">
                  <Mail className="mr-2 h-4 w-4" />
                  Send Report
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
                <CardDescription>Internal and client notes.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-xs uppercase text-muted-foreground">Internal</p>
                  <p className="text-sm">{order.internal_notes || "No internal notes"}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-muted-foreground">Client</p>
                  <p className="text-sm">{order.client_notes || "No client notes"}</p>
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
                    <p className="text-sm text-muted-foreground">
                      {new Date(order.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                {order.scheduled_date && (
                  <div className="flex gap-3">
                    <div className="mt-2 h-2 w-2 rounded-full bg-blue-500" />
                    <div>
                      <p className="font-medium">Scheduled for inspection</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDateShort(order.scheduled_date)}
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
                      <p className="text-sm text-muted-foreground">
                        {new Date(order.completed_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}
                {order.report_delivered_at && (
                  <div className="flex gap-3">
                    <div className="mt-2 h-2 w-2 rounded-full bg-purple-500" />
                    <div>
                      <p className="font-medium">Report delivered</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(order.report_delivered_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Keep momentum on this order.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full">
                  Schedule Inspection
                </Button>
                <Button variant="outline" className="w-full">
                  Assign Inspector
                </Button>
                <Button variant="outline" className="w-full">
                  Generate Invoice
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
                  <span>{new Date(order.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Services</span>
                  <span>{inspection?.services?.length ?? 0}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
