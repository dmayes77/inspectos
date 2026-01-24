import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  fetchInvoices,
  fetchInvoice,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  type InvoiceRecord,
  type InvoiceDetail,
  type CreateInvoiceInput,
  type UpdateInvoiceInput,
} from "@/lib/data/invoices";

const INVOICES_KEY = "invoices";

export function useInvoices() {
  return useQuery<InvoiceRecord[]>({
    queryKey: [INVOICES_KEY],
    queryFn: () => fetchInvoices(),
  });
}

export function useInvoice(invoiceId: string) {
  return useQuery<InvoiceDetail>({
    queryKey: [INVOICES_KEY, invoiceId],
    queryFn: () => fetchInvoice(invoiceId),
    enabled: !!invoiceId,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });
}

export function useCreateInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateInvoiceInput) => createInvoice(input),
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

  return useMutation({
    mutationFn: (input: UpdateInvoiceInput) => updateInvoice(invoiceId, input),
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

  return useMutation({
    mutationFn: (invoiceId: string) => deleteInvoice(invoiceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [INVOICES_KEY] });
      toast.success("Invoice deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete invoice");
    },
  });
}
