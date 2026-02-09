"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { AdminShell } from "@/components/layout/admin-shell";
import { PageHeader } from "@/components/layout/page-header";
import { InvoiceForm, type InvoiceFormValues } from "@/components/invoices/invoice-form";
import { useInvoice, useUpdateInvoice } from "@/hooks/use-invoices";
import { mockAdminUser } from "@inspectos/shared/constants/mock-users";
import { Loader2 } from "lucide-react";
import { formatInvoiceNumber } from "@inspectos/shared/utils/invoices";

export default function EditInvoicePage() {
  const params = useParams();
  const invoiceId = params.id as string;
  const { data: invoice, isLoading, isError } = useInvoice(invoiceId);
  const updateInvoice = useUpdateInvoice(invoiceId);

  if (isLoading) {
    return (
      <AdminShell user={mockAdminUser}>
        <div className="flex items-center justify-center min-h-[400px]">
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

  const initialValues: InvoiceFormValues = {
    orderId: invoice.orderId ?? "",
    clientId: invoice.clientId ?? "",
    status: invoice.status || "draft",
    amount: invoice.amount?.toString() ?? "",
    issuedDate: invoice.issuedDate || "",
    dueDate: invoice.dueDate || "",
  };

  const handleSubmit = async (values: InvoiceFormValues) => {
    await updateInvoice.mutateAsync({
      order_id: values.orderId,
      client_id: values.clientId || null,
      status: values.status,
      total: Number(values.amount),
      issued_at: values.issuedDate || null,
      due_at: values.dueDate || null,
    });
  };

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
              <Link href={`/admin/invoices/${invoice.invoiceId}`} className="hover:text-foreground">
                {invoice.invoiceNumber || formatInvoiceNumber(invoice.invoiceId)}
              </Link>
            </>
          }
          title="Edit Invoice"
          description="Adjust invoice details, status, and due dates."
          backHref={`/admin/invoices/${invoice.invoiceId}`}
        />

        <InvoiceForm
          initialValues={initialValues}
          onSubmit={handleSubmit}
          submitLabel="Save Changes"
          submittingLabel="Saving..."
          cancelHref="/admin/invoices"
          isSubmitting={updateInvoice.isPending}
        />
      </div>
    </AdminShell>
  );
}
