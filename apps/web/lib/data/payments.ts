export type PaymentRecord = {
  paymentId: string;
  invoiceId: string;
  clientName: string;
  amount: number;
  method: string;
  status: string;
  paidDate: string;
};

export async function fetchPayments(): Promise<PaymentRecord[]> {
  const response = await fetch("/api/admin/payments");
  if (!response.ok) {
    throw new Error("Failed to load payments.");
  }
  return response.json();
}

export type RecordPaymentInput = {
  order_id: string;
  amount: number;
  method: string;
  notes?: string;
};

export async function recordPayment(input: RecordPaymentInput): Promise<unknown> {
  const response = await fetch("/api/admin/payments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || "Failed to record payment.");
  }
  return response.json();
}
