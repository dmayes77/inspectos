import { useGet } from "@/hooks/crud";
import { fetchPayments, type PaymentRecord } from "@/lib/data/payments";

export function usePayments() {
  return useGet<PaymentRecord[]>("payments", async () => fetchPayments());
}
