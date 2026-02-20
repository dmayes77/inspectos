"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AdminPageHeader } from "@/layout/admin-page-header";
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
import { Edit, Loader2, Trash2 } from "lucide-react";
import { useInvoice, useDeleteInvoice } from "@/hooks/use-invoices";
import { useOrderById } from "@/hooks/use-orders";
import type { InspectionService } from "@/hooks/use-orders";
import { formatInvoiceNumber } from "@inspectos/shared/utils/invoices";
import { ClientInfoCard } from "@/components/shared/client-info-card";

function getStatusBadgeClasses(status: string) {
  switch (status) {
    case "paid":
      return "bg-green-100 text-green-800 border-green-200";
    case "sent":
      return "bg-brand-100 text-brand-700 border-brand-200";
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
      router.push("/app/invoices");
    } catch (error) {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-100">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !invoice) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">Invoice Not Found</h1>
        <p className="text-muted-foreground">The invoice you&apos;re looking for doesn&apos;t exist or you don&apos;t have access.</p>
      </div>
    );
  }

  const invoiceNumber = invoice.invoiceNumber || formatInvoiceNumber(invoice.invoiceId);
  const services: InspectionService[] = order?.services ?? [];

  return (
    <>
    <div className="space-y-6">
      <AdminPageHeader
        title={invoiceNumber}
        description={invoice.orderNumber ? `Order ${invoice.orderNumber}` : "Invoice overview"}
        meta={
          <>
            <Badge className={getStatusBadgeClasses(invoice.status)}>{invoice.status}</Badge>
            <span className="text-xs text-muted-foreground">${invoice.amount.toFixed(2)}</span>
          </>
        }
        actions={
          <Button asChild variant="outline">
            <Link href={`/app/invoices/${invoice.invoiceId}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
        }
      />

      <ClientInfoCard
        title="Client"
        client={invoice.clientId ? { id: invoice.clientId, name: invoice.clientName } : undefined}
        actionLabel="View Client Profile"
        actionHref={invoice.clientId ? `/app/contacts/${invoice.clientId}` : undefined}
        emptyLabel="No client assigned"
        emptyActionLabel="Assign Client"
        emptyActionHref={`/app/invoices/${invoice.invoiceId}/edit`}
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
              <Badge color="light" className="capitalize">
                {invoice.status}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Order</p>
              {invoice.orderId ? (
                <Link href={`/app/orders/${invoice.orderId}`} className="font-medium hover:underline">
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

      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium">Delete invoice</p>
          <p className="text-xs text-muted-foreground">Permanently remove this invoice and all associated data.</p>
        </div>
        <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </Button>
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
    </>
  );
}
