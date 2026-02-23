import { toast } from "sonner";
import { useGet, usePost, usePatch, useDelete } from "@/hooks/crud";
import { useApiClient } from "@/lib/api/tenant-context";
import { createInvoicesApi } from "@inspectos/shared/api";
import { invoicesQueryKeys } from "@inspectos/shared/query";
import type { CreateInvoiceInput, InvoiceDetail, InvoiceRecord, UpdateInvoiceInput } from "@inspectos/shared/types/invoice";

export type { CreateInvoiceInput, InvoiceDetail, InvoiceRecord, UpdateInvoiceInput };

export function useInvoices() {
  const apiClient = useApiClient();
  const invoicesApi = createInvoicesApi(apiClient);
  return useGet<InvoiceRecord[]>(invoicesQueryKeys.all, () => invoicesApi.list());
}

export function useInvoice(invoiceId: string) {
  const apiClient = useApiClient();
  const invoicesApi = createInvoicesApi(apiClient);
  return useGet<InvoiceDetail>(
    invoicesQueryKeys.detail(invoiceId),
    () => invoicesApi.getById(invoiceId),
    { enabled: !!invoiceId, refetchOnMount: "always", refetchOnWindowFocus: true },
  );
}

export function useCreateInvoice() {
  const apiClient = useApiClient();
  const invoicesApi = createInvoicesApi(apiClient);
  return usePost<InvoiceDetail, CreateInvoiceInput>(
    invoicesQueryKeys.all,
    (input) => invoicesApi.create(input),
    {
      onSuccess: () => toast.success("Invoice created successfully"),
      onError: (error: unknown) => toast.error(error instanceof Error ? error.message : "Failed to create invoice"),
    },
  );
}

export function useUpdateInvoice(invoiceId: string) {
  const apiClient = useApiClient();
  const invoicesApi = createInvoicesApi(apiClient);
  return usePatch<InvoiceDetail, UpdateInvoiceInput>(
    invoicesQueryKeys.all,
    (input) => invoicesApi.update(invoiceId, input),
    {
      onSuccess: () => toast.success("Invoice updated successfully"),
      onError: (error: unknown) => toast.error(error instanceof Error ? error.message : "Failed to update invoice"),
    },
  );
}

export function useDeleteInvoice() {
  const apiClient = useApiClient();
  const invoicesApi = createInvoicesApi(apiClient);
  return useDelete<unknown>(
    invoicesQueryKeys.all,
    (invoiceId) => invoicesApi.remove(invoiceId),
    {
      onSuccess: () => toast.success("Invoice deleted successfully"),
      onError: (error: unknown) => toast.error(error instanceof Error ? error.message : "Failed to delete invoice"),
    },
  );
}
