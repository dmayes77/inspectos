"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/layout/page-header";
import { InvoiceForm, type InvoiceFormValues } from "@/components/invoices/invoice-form";
import { useCreateInvoice } from "@/hooks/use-invoices";

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
    <>
    <div className="space-y-6">
      <PageHeader
        title="Create Invoice"
        description="Generate a new invoice and assign it to a client."
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
    </>
  );
}
