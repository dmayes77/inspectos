import type { ApiClient } from "./client";
import type { PaymentRecord, RecordPaymentInput } from "../types/payment";

export function createPaymentsApi(apiClient: ApiClient) {
  return {
    list: async (): Promise<PaymentRecord[]> => {
      return apiClient.get<PaymentRecord[]>("/admin/payments");
    },
    record: async (input: RecordPaymentInput): Promise<unknown> => {
      return apiClient.post("/admin/payments", input);
    },
  };
}
