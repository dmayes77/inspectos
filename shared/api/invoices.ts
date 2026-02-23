import type { ApiClient } from "./client";
import type { CreateInvoiceInput, InvoiceDetail, InvoiceRecord, UpdateInvoiceInput } from "../types/invoice";

export function createInvoicesApi(apiClient: ApiClient) {
  return {
    list: async (): Promise<InvoiceRecord[]> => {
      return apiClient.get<InvoiceRecord[]>("/admin/invoices");
    },
    getById: async (invoiceId: string): Promise<InvoiceDetail> => {
      return apiClient.get<InvoiceDetail>(`/admin/invoices/${invoiceId}`);
    },
    create: async (input: CreateInvoiceInput): Promise<InvoiceDetail> => {
      return apiClient.post<InvoiceDetail>("/admin/invoices", input);
    },
    update: async (invoiceId: string, input: UpdateInvoiceInput): Promise<InvoiceDetail> => {
      return apiClient.patch<InvoiceDetail>(`/admin/invoices/${invoiceId}`, input);
    },
    remove: async (invoiceId: string): Promise<unknown> => {
      return apiClient.delete(`/admin/invoices/${invoiceId}`);
    },
  };
}
