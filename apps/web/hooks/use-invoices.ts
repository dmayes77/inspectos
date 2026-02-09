import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useApiClient } from "@/lib/api/tenant-context";

const INVOICES_KEY = "invoices";

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
  return useQuery<InvoiceRecord[]>({
    queryKey: [INVOICES_KEY],
    queryFn: () => apiClient.get<InvoiceRecord[]>("/admin/invoices"),
  });
}

export function useInvoice(invoiceId: string) {
  const apiClient = useApiClient();
  return useQuery<InvoiceDetail>({
    queryKey: [INVOICES_KEY, invoiceId],
    queryFn: () => apiClient.get<InvoiceDetail>(`/admin/invoices/${invoiceId}`),
    enabled: !!invoiceId,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });
}

export function useCreateInvoice() {
  const queryClient = useQueryClient();
  const apiClient = useApiClient();

  return useMutation({
    mutationFn: (input: CreateInvoiceInput) => apiClient.post<InvoiceDetail>("/admin/invoices", input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [INVOICES_KEY] });
      toast.success("Invoice created successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create invoice");
    },
  });
}

export function useUpdateInvoice(invoiceId: string) {
  const queryClient = useQueryClient();
  const apiClient = useApiClient();

  return useMutation({
    mutationFn: (input: UpdateInvoiceInput) => apiClient.patch<InvoiceDetail>(`/admin/invoices/${invoiceId}`, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [INVOICES_KEY] });
      queryClient.invalidateQueries({ queryKey: [INVOICES_KEY, invoiceId] });
      toast.success("Invoice updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update invoice");
    },
  });
}

export function useDeleteInvoice() {
  const queryClient = useQueryClient();
  const apiClient = useApiClient();

  return useMutation({
    mutationFn: (invoiceId: string) => apiClient.delete(`/admin/invoices/${invoiceId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [INVOICES_KEY] });
      toast.success("Invoice deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete invoice");
    },
  });
}
