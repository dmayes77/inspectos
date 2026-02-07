import { shouldUseExternalApi } from "@/lib/api/feature-flags";
import { createApiClient } from "@/lib/api/client";

function getTenantSlug(): string {
  const isDevelopment = process.env.NODE_ENV === 'development';
  if (typeof window !== "undefined") {
    const pathParts = window.location.pathname.split("/");
    return pathParts[1] || "default";
  }
  return "default";
}

export type Webhook = {
  id: string;
  tenant_id: string;
  name: string;
  url: string;
  description?: string | null;
  events: string[];
  secret?: string | null;
  headers?: Record<string, string>;
  status: string;
  retry_strategy?: {
    max_attempts: number;
    backoff: string;
    timeout: number;
  };
  failure_count?: number;
  last_triggered_at?: string | null;
  last_success_at?: string | null;
  last_error?: string | null;
  created_at?: string;
  updated_at?: string;
  created_by?: string | null;
};

export type WebhookWithDeliveries = Webhook & {
  recent_deliveries: Array<{
    id: string;
    webhook_id: string;
    event_type: string;
    payload: Record<string, unknown>;
    response_status?: number;
    response_body?: string;
    response_time_ms?: number;
    error?: string;
    attempt_number: number;
    delivered_at: string;
  }>;
};

export async function fetchWebhooks(): Promise<Webhook[]> {
  if (shouldUseExternalApi("webhooks")) {
    const apiClient = createApiClient(getTenantSlug());
    return await apiClient.get<Webhook[]>("/admin/webhooks");
  } else {
    const response = await fetch("/api/admin/webhooks");
    if (!response.ok) {
      throw new Error("Failed to load webhooks.");
    }
    const result = await response.json();
    return result.data ?? [];
  }
}

export async function fetchWebhookById(id: string): Promise<WebhookWithDeliveries> {
  if (shouldUseExternalApi("webhooks")) {
    const apiClient = createApiClient(getTenantSlug());
    return await apiClient.get<WebhookWithDeliveries>(`/admin/webhooks/${id}`);
  } else {
    const response = await fetch(`/api/admin/webhooks/${id}`);
    if (!response.ok) {
      throw new Error("Failed to load webhook.");
    }
    const result = await response.json();
    return result.data;
  }
}

export async function createWebhook(data: Partial<Webhook>): Promise<Webhook> {
  if (shouldUseExternalApi("webhooks")) {
    const apiClient = createApiClient(getTenantSlug());
    return await apiClient.post<Webhook>("/admin/webhooks", data);
  } else {
    const response = await fetch("/api/admin/webhooks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error("Failed to create webhook.");
    }
    const result = await response.json();
    return result.data;
  }
}

export async function updateWebhook(id: string, data: Partial<Webhook>): Promise<Webhook> {
  if (shouldUseExternalApi("webhooks")) {
    const apiClient = createApiClient(getTenantSlug());
    return await apiClient.put<Webhook>(`/admin/webhooks/${id}`, data);
  } else {
    const response = await fetch(`/api/admin/webhooks/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error("Failed to update webhook.");
    }
    const result = await response.json();
    return result.data;
  }
}

export async function deleteWebhook(id: string): Promise<boolean> {
  if (shouldUseExternalApi("webhooks")) {
    const apiClient = createApiClient(getTenantSlug());
    return await apiClient.delete<boolean>(`/admin/webhooks/${id}`);
  } else {
    const response = await fetch(`/api/admin/webhooks/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      throw new Error("Failed to delete webhook.");
    }
    const result = await response.json();
    return result.success ?? true;
  }
}
