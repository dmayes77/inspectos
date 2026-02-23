import { toast } from "sonner";
import { useGet, usePost, usePatch, useDelete } from "@/hooks/crud";
import { useApiClient } from "@/lib/api/tenant-context";

export type InvoiceRecord = {
  invoiceId: string;
  invoiceNumber?: string;
  clientName: string;
  clientId?: string;
  orderId?: string | null;
  orderNumber?: string;
  amount: number;
  issuedDate: string;
  dueDate: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
};

export type InvoiceDetail = InvoiceRecord & {
  clientId: string | null;
  orderId: string | null;
};

export interface CreateInvoiceInput {
  client_id: string | null;
  order_id: string;
  status: string;
  total: number;
  issued_at?: string | null;
  due_at?: string | null;
}

export interface UpdateInvoiceInput {
  client_id?: string | null;
  order_id?: string;
  status?: string;
  total?: number;
  issued_at?: string | null;
  due_at?: string | null;
}

export function useInvoices() {
  const apiClient = useApiClient();
  return useGet<InvoiceRecord[]>("invoices", () => apiClient.get<InvoiceRecord[]>("/admin/invoices"));
}

export function useInvoice(invoiceId: string) {
  const apiClient = useApiClient();
  return useGet<InvoiceDetail>(
    ["invoices", invoiceId],
    () => apiClient.get<InvoiceDetail>(`/admin/invoices/${invoiceId}`),
    { enabled: !!invoiceId, refetchOnMount: "always", refetchOnWindowFocus: true },
  );
}

export function useCreateInvoice() {
  const apiClient = useApiClient();
  return usePost<InvoiceDetail, CreateInvoiceInput>(
    "invoices",
    (input) => apiClient.post<InvoiceDetail>("/admin/invoices", input),
    {
      onSuccess: () => toast.success("Invoice created successfully"),
      onError: (error: unknown) => toast.error(error instanceof Error ? error.message : "Failed to create invoice"),
    },
  );
}

export function useUpdateInvoice(invoiceId: string) {
  const apiClient = useApiClient();
  return usePatch<InvoiceDetail, UpdateInvoiceInput>(
    "invoices",
    (input) => apiClient.patch<InvoiceDetail>(`/admin/invoices/${invoiceId}`, input),
    {
      onSuccess: () => toast.success("Invoice updated successfully"),
      onError: (error: unknown) => toast.error(error instanceof Error ? error.message : "Failed to update invoice"),
    },
  );
}

export function useDeleteInvoice() {
  const apiClient = useApiClient();
  return useDelete<unknown>(
    "invoices",
    (invoiceId) => apiClient.delete(`/admin/invoices/${invoiceId}`),
    {
      onSuccess: () => toast.success("Invoice deleted successfully"),
      onError: (error: unknown) => toast.error(error instanceof Error ? error.message : "Failed to delete invoice"),
    },
  );
}
