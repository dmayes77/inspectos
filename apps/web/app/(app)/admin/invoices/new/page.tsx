"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { AdminShell } from "@/components/layout/admin-shell";
import { PageHeader } from "@/components/layout/page-header";
import { InvoiceForm, type InvoiceFormValues } from "@/components/invoices/invoice-form";
import { useCreateInvoice } from "@/hooks/use-invoices";
import { mockAdminUser } from "@/lib/constants/mock-users";

const initialValues: InvoiceFormValues = {
  orderId: "",
  clientId: "",
  status: "draft",
  amount: "",
  issuedDate: "",
  dueDate: "",
};

export default function NewInvoicePage() {
  const router = useRouter();
  const createInvoice = useCreateInvoice();

  const handleSubmit = async (values: InvoiceFormValues) => {
    const created = await createInvoice.mutateAsync({
      order_id: values.orderId,
      client_id: values.clientId || null,
      status: values.status,
      total: Number(values.amount),
      issued_at: values.issuedDate || null,
      due_at: values.dueDate || null,
    });

    router.push(`/admin/invoices/${created.invoiceId}`);
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
            </>
          }
          title="Create Invoice"
          description="Generate a new invoice and assign it to a client."
          backHref="/admin/invoices"
        />

        <InvoiceForm
          initialValues={initialValues}
          onSubmit={handleSubmit}
          submitLabel="Create Invoice"
          submittingLabel="Creating..."
          cancelHref="/admin/invoices"
          isSubmitting={createInvoice.isPending}
        />
      </div>
    </AdminShell>
  );
}
