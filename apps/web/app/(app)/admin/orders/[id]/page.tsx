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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Tabs defaultValue="overview">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="inspection">Inspection</TabsTrigger>
                <TabsTrigger value="financials">Financials</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                {/* Property Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-muted-foreground" />
                      Property
                    </CardTitle>
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
                        <div className="flex flex-wrap gap-2 mt-4">
                          <Badge variant="outline">{property.property_type}</Badge>
                          {property.year_built && (
                            <Badge variant="outline">Built {property.year_built}</Badge>
                          )}
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

                {/* Services Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ClipboardList className="h-5 w-5 text-muted-foreground" />
                      Services
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {inspection?.services && inspection.services.length > 0 ? (
                      <div className="space-y-3">
                        {inspection.services.map((service) => (
                          <div
                            key={service.id}
                            className="flex items-center justify-between py-2 border-b last:border-0"
                          >
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
                        <Separator className="my-2" />
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

                {/* Schedule Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                      Schedule
                    </CardTitle>
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
                        <p className="text-muted-foreground">
                          Duration: {order.duration_minutes} minutes
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-muted-foreground">Not yet scheduled</p>
                        <Button size="sm">Schedule Now</Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="inspection" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Inspection Details</CardTitle>
                    <CardDescription>
                      {inspection
                        ? `Status: ${formatStatusLabel(inspection.status)}`
                        : "No inspection started"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {inspection ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Started</p>
                            <p className="font-medium">
                              {inspection.started_at
                                ? new Date(inspection.started_at).toLocaleString()
                                : "Not started"}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Completed</p>
                            <p className="font-medium">
                              {inspection.completed_at
                                ? new Date(inspection.completed_at).toLocaleString()
                                : "Not completed"}
                            </p>
                          </div>
                          {inspection.weather_conditions && (
                            <div>
                              <p className="text-sm text-muted-foreground">Weather</p>
                              <p className="font-medium">{inspection.weather_conditions}</p>
                            </div>
                          )}
                          {inspection.temperature && (
                            <div>
                              <p className="text-sm text-muted-foreground">Temperature</p>
                              <p className="font-medium">{inspection.temperature}</p>
                            </div>
                          )}
                        </div>
                        {inspection.notes && (
                          <div>
                            <p className="text-sm text-muted-foreground">Notes</p>
                            <p className="mt-1">{inspection.notes}</p>
                          </div>
                        )}
                        <Button asChild>
                          <Link href={`/admin/inspections/${inspection.id}`}>
                            View Full Inspection
                          </Link>
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <p className="text-muted-foreground mb-4">
                          Inspection has not been started yet
                        </p>
                        <Button>Start Inspection</Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="financials" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Financial Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between py-2 border-b">
                        <span>Subtotal</span>
                        <span>${order.subtotal.toFixed(2)}</span>
                      </div>
                      {order.discount > 0 && (
                        <div className="flex justify-between py-2 border-b text-green-600">
                          <span>Discount</span>
                          <span>-${order.discount.toFixed(2)}</span>
                        </div>
                      )}
                      {order.tax > 0 && (
                        <div className="flex justify-between py-2 border-b">
                          <span>Tax</span>
                          <span>${order.tax.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between py-2 font-semibold text-lg">
                        <span>Total</span>
                        <span>${order.total.toFixed(2)}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between items-center">
                        <span>Payment Status</span>
                        <Badge
                          variant="outline"
                          className={cn(getPaymentBadgeClasses(order.payment_status))}
                        >
                          {formatStatusLabel(order.payment_status)}
                        </Badge>
                      </div>
                      <div className="flex gap-2 mt-4">
                        <Button variant="outline">Create Invoice</Button>
                        <Button>Record Payment</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Invoices */}
                {order.invoices && order.invoices.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Invoices</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {order.invoices.map((invoice) => (
                          <div
                            key={invoice.id}
                            className="flex items-center justify-between py-2 border-b last:border-0"
                          >
                            <div>
                              <p className="font-medium">Invoice #{invoice.id.slice(0, 8)}</p>
                              <p className="text-sm text-muted-foreground">
                                {invoice.issued_at
                                  ? `Issued ${formatDateShort(invoice.issued_at)}`
                                  : "Draft"}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">${invoice.total.toFixed(2)}</p>
                              <Badge variant="outline">{invoice.status}</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="activity" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Activity Log</CardTitle>
                    <CardDescription>Timeline of order events</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex gap-3">
                        <div className="w-2 h-2 mt-2 rounded-full bg-green-500" />
                        <div>
                          <p className="font-medium">Order created</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(order.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      {order.scheduled_date && (
                        <div className="flex gap-3">
                          <div className="w-2 h-2 mt-2 rounded-full bg-blue-500" />
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
                          <div className="w-2 h-2 mt-2 rounded-full bg-green-500" />
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
                          <div className="w-2 h-2 mt-2 rounded-full bg-purple-500" />
                          <div>
                            <p className="font-medium">Report delivered</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(order.report_delivered_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Client Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Client
                </CardTitle>
              </CardHeader>
              <CardContent>
                {client ? (
                  <div className="space-y-3">
                    <p className="font-medium">{client.name}</p>
                    {client.email && (
                      <a
                        href={`mailto:${client.email}`}
                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                      >
                        <Mail className="h-4 w-4" />
                        {client.email}
                      </a>
                    )}
                    {client.phone && (
                      <a
                        href={`tel:${client.phone}`}
                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                      >
                        <Phone className="h-4 w-4" />
                        {client.phone}
                      </a>
                    )}
                    {client.company && (
                      <p className="text-sm text-muted-foreground">{client.company}</p>
                    )}
                    <Button variant="outline" size="sm" className="w-full mt-2">
                      <Send className="mr-2 h-4 w-4" />
                      Send Portal Link
                    </Button>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">No client assigned</p>
                )}
              </CardContent>
            </Card>

            {/* Agent Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Referring Agent
                </CardTitle>
              </CardHeader>
              <CardContent>
                {agent ? (
                  <div className="space-y-3">
                    <p className="font-medium">{agent.name}</p>
                    {agent.agency && (
                      <p className="text-sm text-muted-foreground">{agent.agency.name}</p>
                    )}
                    {agent.email && (
                      <a
                        href={`mailto:${agent.email}`}
                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                      >
                        <Mail className="h-4 w-4" />
                        {agent.email}
                      </a>
                    )}
                    {agent.phone && (
                      <a
                        href={`tel:${agent.phone}`}
                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                      >
                        <Phone className="h-4 w-4" />
                        {agent.phone}
                      </a>
                    )}
                    <Button variant="outline" size="sm" className="w-full mt-2">
                      <Send className="mr-2 h-4 w-4" />
                      Send Portal Link
                    </Button>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">No agent assigned</p>
                )}
              </CardContent>
            </Card>

            {/* Inspector Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <UserCheck className="h-4 w-4" />
                  Assigned Inspector
                </CardTitle>
              </CardHeader>
              <CardContent>
                {inspector ? (
                  <div className="space-y-3">
                    <p className="font-medium">{inspector.full_name ?? inspector.email}</p>
                    <a
                      href={`mailto:${inspector.email}`}
                      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                    >
                      <Mail className="h-4 w-4" />
                      {inspector.email}
                    </a>
                    <Button variant="outline" size="sm" className="w-full mt-2">
                      Reassign Inspector
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-muted-foreground text-sm">No inspector assigned</p>
                    <Button size="sm" className="w-full">
                      Assign Inspector
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Notes Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                {order.internal_notes ? (
                  <p className="text-sm">{order.internal_notes}</p>
                ) : (
                  <p className="text-muted-foreground text-sm">No internal notes</p>
                )}
                {order.client_notes && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-xs text-muted-foreground mb-1">Client Notes</p>
                    <p className="text-sm">{order.client_notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
