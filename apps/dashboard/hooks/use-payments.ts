import { useGet, usePost } from "@/hooks/crud";
import { useApiClient } from "@/lib/api/tenant-context";
import { createPaymentsApi } from "@inspectos/shared/api";
import { paymentsQueryKeys } from "@inspectos/shared/query";
import type { PaymentRecord, RecordPaymentInput } from "@inspectos/shared/types/payment";

export type { PaymentRecord, RecordPaymentInput };

export function usePayments() {
  const apiClient = useApiClient();
  const paymentsApi = createPaymentsApi(apiClient);
  return useGet<PaymentRecord[]>(paymentsQueryKeys.all, async () => {
    return await paymentsApi.list();
  });
}

export function useRecordPayment() {
  const apiClient = useApiClient();
  const paymentsApi = createPaymentsApi(apiClient);
  return usePost<unknown, RecordPaymentInput>(paymentsQueryKeys.all, async (input) => {
    return await paymentsApi.record(input);
  });
}
