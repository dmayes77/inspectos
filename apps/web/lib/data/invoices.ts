import { shouldUseExternalApi } from "@/lib/api/feature-flags";
import { createApiClient } from "@/lib/api/client";

/**
 * Get tenant slug from environment
 * TODO: In production, this should come from user session or URL
 */
function getTenantSlug(): string {
  const isDevelopment = process.env.NODE_ENV === 'development';
  if (isDevelopment && process.env.NEXT_PUBLIC_SUPABASE_TENANT_ID) {
    return process.env.NEXT_PUBLIC_SUPABASE_TENANT_ID;
  }
  return "default";
}

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

export async function fetchInvoices(): Promise<InvoiceRecord[]> {
  if (shouldUseExternalApi("invoices")) {
    const apiClient = createApiClient(getTenantSlug());
    return await apiClient.get<InvoiceRecord[]>("/admin/invoices");
  } else {
    const response = await fetch("/api/admin/invoices");
    if (!response.ok) {
      throw new Error("Failed to load invoices.");
    }
    return response.json();
  }
}

export async function fetchInvoice(invoiceId: string): Promise<InvoiceDetail> {
  if (shouldUseExternalApi("invoices")) {
    const apiClient = createApiClient(getTenantSlug());
    return await apiClient.get<InvoiceDetail>(`/admin/invoices/${invoiceId}`);
  } else {
    const response = await fetch(`/api/admin/invoices/${invoiceId}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "Failed to load invoice.");
    }
    const result = await response.json();
    return result.data;
  }
}

export async function createInvoice(input: CreateInvoiceInput): Promise<InvoiceDetail> {
  if (shouldUseExternalApi("invoices")) {
    const apiClient = createApiClient(getTenantSlug());
    return await apiClient.post<InvoiceDetail>("/admin/invoices", input);
  } else {
    const response = await fetch("/api/admin/invoices", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "Failed to create invoice.");
    }

    const result = await response.json();
    return result.data;
  }
}

export async function updateInvoice(invoiceId: string, input: UpdateInvoiceInput): Promise<InvoiceDetail> {
  if (shouldUseExternalApi("invoices")) {
    const apiClient = createApiClient(getTenantSlug());
    return await apiClient.patch<InvoiceDetail>(`/admin/invoices/${invoiceId}`, input);
  } else {
    const response = await fetch(`/api/admin/invoices/${invoiceId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "Failed to update invoice.");
    }

    const result = await response.json();
    return result.data;
  }
}

export async function deleteInvoice(invoiceId: string): Promise<void> {
  if (shouldUseExternalApi("invoices")) {
    const apiClient = createApiClient(getTenantSlug());
    await apiClient.delete(`/admin/invoices/${invoiceId}`);
  } else {
    const response = await fetch(`/api/admin/invoices/${invoiceId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "Failed to delete invoice.");
    }
  }
}
