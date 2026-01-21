export type InvoiceRecord = {
  invoiceId: string;
  clientName: string;
  amount: number;
  issuedDate: string;
  dueDate: string;
  status: string;
};

export async function fetchInvoices(): Promise<InvoiceRecord[]> {
  const response = await fetch("/api/admin/invoices");
  if (!response.ok) {
    throw new Error("Failed to load invoices.");
  }
  return response.json();
}
