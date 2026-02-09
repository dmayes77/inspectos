"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AdminShell } from "@/components/layout/admin-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Check, Download, Edit, Link2, Loader2, Send, Trash2 } from "lucide-react";
import { useInvoice, useDeleteInvoice } from "@/hooks/use-invoices";
import { useOrderById } from "@/hooks/use-orders";
import type { InspectionService } from "@/hooks/use-orders";
import { mockAdminUser } from "@inspectos/shared/constants/mock-users";
import { formatInvoiceNumber } from "@inspectos/shared/utils/invoices";
import { toast } from "sonner";
import { ClientInfoCard } from "@/components/shared/client-info-card";
import { RecordInformationCard } from "@/components/shared/record-information-card";

function getStatusBadgeClasses(status: string) {
  switch (status) {
    case "paid":
      return "bg-green-100 text-green-800 border-green-200";
    case "sent":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "overdue":
      return "bg-red-100 text-red-800 border-red-200";
    case "draft":
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
}

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const invoiceId = params.id as string;

  const { data: invoice, isLoading, isError } = useInvoice(invoiceId);
  const { data: order } = useOrderById(invoice?.orderId ?? "");
  const deleteInvoice = useDeleteInvoice();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteInvoice.mutateAsync(invoiceId);
      router.push("/admin/invoices");
    } catch (error) {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  if (isLoading) {
    return (
      <AdminShell user={mockAdminUser}>
        <div className="flex items-center justify-center min-h-100">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AdminShell>
    );
  }

  if (isError || !invoice) {
    return (
      <AdminShell user={mockAdminUser}>
        <div className="space-y-6">
          <PageHeader
            breadcrumb={
              <>
                <Link href="/admin/overview" className="hover:text-foreground">
                  Overview
                </Link>
                <span className="text-muted-foreground">/</span>
                <Link href="/admin/invoices" className="hover:text-foreground">
                  Invoices
                </Link>
              </>
            }
            title="Invoice Not Found"
            description="The invoice you're looking for doesn't exist or you don't have access."
            backHref="/admin/invoices"
          />
        </div>
      </AdminShell>
    );
  }

  const invoiceNumber = invoice.invoiceNumber || formatInvoiceNumber(invoice.invoiceId);
  const inspection = Array.isArray(order?.inspection) ? order?.inspection[0] : order?.inspection;
  const services: InspectionService[] = inspection?.services ?? [];

  return (
    <AdminShell user={mockAdminUser}>
      <div className="space-y-6">
        <PageHeader
          breadcrumb={
            <>
              <Link href="/admin/overview" className="hover:text-foreground">
                Overview
              </Link>
              <span className="text-muted-foreground">/</span>
              <Link href="/admin/invoices" className="hover:text-foreground">
                Invoices
              </Link>
              <span className="text-muted-foreground">/</span>
              <span>{invoiceNumber}</span>
            </>
          }
          title="Invoice Details"
          description={invoice.orderNumber ? `Order ${invoice.orderNumber}` : "Invoice overview"}
          meta={
            <>
              <Badge className={getStatusBadgeClasses(invoice.status)}>{invoice.status}</Badge>
              <span className="text-xs text-muted-foreground">${invoice.amount.toFixed(2)}</span>
            </>
          }
          backHref="/admin/invoices"
          actions={
            <>
              <Button asChild variant="outline">
                <Link href={`/admin/invoices/${invoice.invoiceId}/edit`}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Link>
              </Button>
              <Button
                variant="outline"
                className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </>
          }
        />

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <ClientInfoCard
              title="Client"
              client={invoice.clientId ? { id: invoice.clientId, name: invoice.clientName } : undefined}
              actionLabel="View Client Profile"
              actionHref={invoice.clientId ? `/admin/contacts/${invoice.clientId}` : undefined}
              emptyLabel="No client assigned"
              emptyActionLabel="Assign Client"
              emptyActionHref={`/admin/invoices/${invoice.invoiceId}/edit`}
            />

            <Card>
              <CardHeader>
                <CardTitle>Invoice Summary</CardTitle>
                <CardDescription>Key billing details for this invoice.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Invoice</p>
                    <p className="font-medium">{invoiceNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Status</p>
                    <Badge variant="outline" className="capitalize">
                      {invoice.status}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Order</p>
                    {invoice.orderId ? (
                      <Link href={`/admin/orders/${invoice.orderId}`} className="font-medium hover:underline">
                        {invoice.orderNumber || "View order"}
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Amount</p>
                    <p className="font-medium">${invoice.amount.toFixed(2)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Invoice Details</CardTitle>
                <CardDescription>Services included on this invoice.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {services.length > 0 ? (
                  services.map((service) => (
                    <div key={service.id} className="flex items-center justify-between text-sm">
                      <span className="font-medium">{service.name}</span>
                      <span className="text-muted-foreground">${service.price.toFixed(2)}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-muted-foreground">No services recorded for this order.</div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common invoice updates.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start" onClick={() => toast("Send invoice is coming soon.")}>
                  <Send className="mr-2 h-4 w-4" />
                  Send Invoice
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => toast("Invoice status update is coming soon.")}>
                  <Check className="mr-2 h-4 w-4" />
                  Mark as Sent
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => toast("Payment update is coming soon.")}>
                  <Check className="mr-2 h-4 w-4" />
                  Mark as Paid
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => toast("Invoice download is coming soon.")}>
                  <Download className="mr-2 h-4 w-4" />
                  Download PDF
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => toast("Payment link copy is coming soon.")}>
                  <Link2 className="mr-2 h-4 w-4" />
                  Copy Payment Link
                </Button>
              </CardContent>
            </Card>

            <RecordInformationCard createdAt={invoice.createdAt} updatedAt={invoice.updatedAt} />
          </div>
        </div>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Invoice</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to delete this invoice? This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Invoice"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminShell>
  );
}
