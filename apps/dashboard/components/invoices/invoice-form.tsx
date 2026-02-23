"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Save } from "lucide-react";
import { useClients } from "@/hooks/use-clients";
import { useOrders } from "@/hooks/use-orders";
import { InlineClientDialog } from "@/components/orders/inline-client-dialog";
import { ResourceFormLayout } from "@/components/shared/resource-form-layout";
import {
  InvoiceFormErrors,
  InvoiceFormSections,
  InvoiceFormValues,
  validateInvoiceForm,
} from "@/components/invoices/invoice-form-sections";

export type { InvoiceFormValues } from "@/components/invoices/invoice-form-sections";

type InvoiceFormProps = {
  initialValues: InvoiceFormValues;
  onSubmit: (values: InvoiceFormValues) => Promise<void>;
  submitLabel: string;
  submittingLabel: string;
  cancelHref: string;
  isSubmitting: boolean;
};

export function InvoiceForm({
  initialValues,
  onSubmit,
  submitLabel,
  submittingLabel,
  cancelHref,
  isSubmitting,
}: InvoiceFormProps) {
  const router = useRouter();
  const { data: clientsData } = useClients();
  const clients = clientsData ?? [];
  const { data: orders = [] } = useOrders();
  const [form, setForm] = useState<InvoiceFormValues>(initialValues);
  const [errors, setErrors] = useState<InvoiceFormErrors>({});
  const [showClientDialog, setShowClientDialog] = useState(false);

  const selectedOrder = orders.find((order) => order.id === form.orderId);
  const selectedOrderClientId = selectedOrder?.client?.id ?? selectedOrder?.client_id ?? "";

  const handleClientCreated = (clientId: string) => {
    setForm((prev) => ({ ...prev, clientId }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const validationErrors = validateInvoiceForm(form);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;
    await onSubmit(form);
  };

  return (
    <>
      <form onSubmit={handleSubmit}>
        <ResourceFormLayout
          left={
            <InvoiceFormSections
              form={form}
              setForm={setForm}
              errors={errors}
              setErrors={setErrors}
              clients={clients}
              orders={orders}
              selectedOrderClientId={selectedOrderClientId}
              onOpenClientDialog={() => setShowClientDialog(true)}
            />
          }
          right={
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {submittingLabel}
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        {submitLabel}
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => router.push(cancelHref)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Tips</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-2">
                  <p>• Required fields are marked with an asterisk (*)</p>
                  <p>• Match the issued date to your accounting records</p>
                  <p>• Due dates help automate reminders and collections</p>
                </CardContent>
              </Card>
            </>
          }
        />
      </form>

      <InlineClientDialog
        open={showClientDialog}
        onOpenChange={setShowClientDialog}
        onClientCreated={handleClientCreated}
      />
    </>
  );
}
