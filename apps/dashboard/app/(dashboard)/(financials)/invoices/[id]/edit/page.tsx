"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { PageHeader } from "@/layout/page-header";
import { InvoiceForm, type InvoiceFormValues } from "@/components/invoices/invoice-form";
import { useInvoice, useUpdateInvoice } from "@/hooks/use-invoices";
import { Loader2 } from "lucide-react";
import { formatInvoiceNumber } from "@inspectos/shared/utils/invoices";
import { parseSlugIdSegment } from "@/lib/routing/slug-id";

export default function EditInvoicePage() {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const invoiceId = parseSlugIdSegment(params.id as string);
  const { data: invoice, isLoading, isError } = useInvoice(invoiceId);
  const updateInvoice = useUpdateInvoice(invoiceId);

  useEffect(() => {
    if (pathname.endsWith("/edit")) {
      router.replace(pathname.slice(0, -5));
    }
  }, [pathname, router]);

  if (pathname.endsWith("/edit")) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !invoice) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Invoice Not Found"
          description="The invoice you're looking for doesn't exist or you don't have access."
        />
      </div>
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
    <>
    <div className="space-y-6">
      <PageHeader
        title="Invoice"
        description="Adjust invoice details, status, and due dates."
      />

      <InvoiceForm
        initialValues={initialValues}
        onSubmit={handleSubmit}
        submitLabel="Save Changes"
        submittingLabel="Saving..."
        cancelHref="/invoices"
        isSubmitting={updateInvoice.isPending}
      />
    </div>
    </>
  );
}
