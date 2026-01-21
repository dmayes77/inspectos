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
