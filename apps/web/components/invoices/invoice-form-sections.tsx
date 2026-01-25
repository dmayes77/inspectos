"use client";

import { Dispatch, SetStateAction } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, User } from "lucide-react";

export type InvoiceFormValues = {
  orderId: string;
  clientId: string;
  status: string;
  amount: string;
  issuedDate: string;
  dueDate: string;
};

export type InvoiceFormErrors = Partial<Record<keyof InvoiceFormValues, string>>;

export type InvoiceFormClient = {
  clientId: string;
  name: string;
};

export type InvoiceFormOrder = {
  id: string;
  order_number: string;
  total: number;
  created_at: string;
  scheduled_date: string | null;
  client?: { id: string; name: string | null } | null;
  client_id?: string | null;
};

const statusOptions = [
  { value: "draft", label: "Draft" },
  { value: "sent", label: "Sent" },
  { value: "overdue", label: "Overdue" },
  { value: "paid", label: "Paid" },
];

const toDateInput = (value?: string | null) => {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString().slice(0, 10);
};

export function validateInvoiceForm(values: InvoiceFormValues): InvoiceFormErrors {
  const nextErrors: InvoiceFormErrors = {};
  const amountValue = Number(values.amount);

  if (!values.orderId) {
    nextErrors.orderId = "Order is required";
  }
  if (!values.clientId) {
    nextErrors.clientId = "Client is required";
  }
  if (!Number.isFinite(amountValue) || amountValue <= 0) {
    nextErrors.amount = "Amount must be greater than zero";
  }
  if (!values.issuedDate) {
    nextErrors.issuedDate = "Issued date is required";
  }

  return nextErrors;
}

type InvoiceFormSectionsProps = {
  form: InvoiceFormValues;
  setForm: Dispatch<SetStateAction<InvoiceFormValues>>;
  errors: InvoiceFormErrors;
  setErrors: Dispatch<SetStateAction<InvoiceFormErrors>>;
  clients: InvoiceFormClient[];
  orders: InvoiceFormOrder[];
  selectedOrderClientId: string;
  onOpenClientDialog: () => void;
};

export function InvoiceFormSections({
  form,
  setForm,
  errors,
  setErrors,
  clients,
  orders,
  selectedOrderClientId,
  onOpenClientDialog,
}: InvoiceFormSectionsProps) {
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Invoice Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="order">
              Order <span className="text-destructive">*</span>
            </Label>
            <Select
              value={form.orderId}
              onValueChange={(value) => {
                const order = orders.find((item) => item.id === value);
                setForm((prev) => ({
                  ...prev,
                  orderId: value,
                  clientId: order?.client?.id ?? order?.client_id ?? prev.clientId,
                  amount: order?.total ? order.total.toFixed(2) : prev.amount,
                  issuedDate: order?.created_at ? toDateInput(order.created_at) : prev.issuedDate,
                  dueDate: order?.scheduled_date ?? prev.dueDate,
                }));
                setErrors((prev) => ({ ...prev, orderId: "" }));
              }}
            >
              <SelectTrigger id="order">
                <SelectValue placeholder="Select an order..." />
              </SelectTrigger>
              <SelectContent>
                {orders.map((order) => (
                  <SelectItem key={order.id} value={order.id}>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{order.order_number}</span>
                      <span className="text-xs text-muted-foreground">
                        {order.client?.name ?? "No client"}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.orderId && <p className="text-sm text-destructive">{errors.orderId}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={form.status}
                onValueChange={(value) => setForm((prev) => ({ ...prev, status: value }))}
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">
                Amount <span className="text-destructive">*</span>
              </Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={form.amount}
                onChange={(event) => {
                  setForm((prev) => ({ ...prev, amount: event.target.value }));
                  setErrors((prev) => ({ ...prev, amount: "" }));
                }}
                placeholder="0.00"
                className={errors.amount ? "border-destructive" : ""}
              />
              {errors.amount && <p className="text-sm text-destructive">{errors.amount}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="issued-date">
                Issued Date <span className="text-destructive">*</span>
              </Label>
              <Input
                id="issued-date"
                type="date"
                value={form.issuedDate}
                onChange={(event) => {
                  setForm((prev) => ({ ...prev, issuedDate: event.target.value }));
                  setErrors((prev) => ({ ...prev, issuedDate: "" }));
                }}
                className={errors.issuedDate ? "border-destructive" : ""}
              />
              {errors.issuedDate && <p className="text-sm text-destructive">{errors.issuedDate}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="due-date">Due Date</Label>
              <Input
                id="due-date"
                type="date"
                value={form.dueDate}
                onChange={(event) => setForm((prev) => ({ ...prev, dueDate: event.target.value }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Client</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="client">
              Client <span className="text-destructive">*</span>
            </Label>
            <div className="flex items-center gap-2">
              <Select
                value={form.clientId || undefined}
                onValueChange={(value) => {
                  setForm((prev) => ({ ...prev, clientId: value }));
                  setErrors((prev) => ({ ...prev, clientId: "" }));
                }}
                disabled={!!selectedOrderClientId}
              >
                <SelectTrigger id="client" className="flex-1">
                  <SelectValue placeholder="Select a client..." />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.clientId} value={client.clientId}>
                      <div className="flex items-center gap-2">
                        <User className="h-3.5 w-3.5 text-muted-foreground" />
                        {client.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.clientId && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setForm((prev) => ({ ...prev, clientId: "" }))}
                  className="shrink-0"
                  disabled={!!selectedOrderClientId}
                >
                  <span className="sr-only">Clear client</span>
                  ×
                </Button>
              )}
            </div>
            {errors.clientId && <p className="text-sm text-destructive">{errors.clientId}</p>}
            {selectedOrderClientId && (
              <p className="text-xs text-muted-foreground">
                Client is linked to the selected order.
              </p>
            )}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full"
            onClick={onOpenClientDialog}
            disabled={!!selectedOrderClientId}
          >
            <Plus className="mr-2 h-4 w-4" />
            Create New Client
          </Button>
        </CardContent>
      </Card>
    </>
  );
}
