export function formatInvoiceNumber(invoiceId?: string | null): string {
  if (!invoiceId) return "INV-";
  return `INV-${invoiceId.slice(0, 8).toUpperCase()}`;
}
