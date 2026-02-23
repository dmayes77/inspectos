import { useGet, usePost } from "@/hooks/crud";
import { useApiClient } from "@/lib/api/tenant-context";

export type PaymentRecord = {
  paymentId: string;
  invoiceId: string;
  clientName: string;
  amount: number;
  method: string;
  status: string;
  paidDate: string;
};

export type RecordPaymentInput = {
  order_id: string;
  amount: number;
  method: string;
  notes?: string;
};

export function usePayments() {
  const apiClient = useApiClient();
  return useGet<PaymentRecord[]>("payments", async () => {
    return await apiClient.get<PaymentRecord[]>('/admin/payments');
  });
}

export function useRecordPayment() {
  const apiClient = useApiClient();
  return usePost<unknown, RecordPaymentInput>("payments", async (input) => {
    return await apiClient.post('/admin/payments', input);
  });
}
