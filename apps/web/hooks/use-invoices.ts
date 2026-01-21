import { useGet } from "@/hooks/crud";
import { fetchInvoices, type InvoiceRecord } from "@/lib/data/invoices";

export function useInvoices() {
  return useGet<InvoiceRecord[]>("invoices", async () => fetchInvoices());
}
