import { useGet, usePost } from "@/hooks/crud";
import { fetchPayments, recordPayment, type PaymentRecord, type RecordPaymentInput } from "@/lib/data/payments";

export function usePayments() {
  return useGet<PaymentRecord[]>("payments", async () => fetchPayments());
}

export function useRecordPayment() {
  return usePost<unknown, RecordPaymentInput>("payments", async (input) => recordPayment(input));
}
