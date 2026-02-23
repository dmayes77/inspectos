import { useGet, usePost, usePut, useDelete } from "@/hooks/crud";
import { useApiClient } from "@/lib/api/tenant-context";
import type { CreateWebhookInput, UpdateWebhookInput } from "@inspectos/shared/validations/webhook";
import type { Webhook, WebhookDelivery } from "@inspectos/shared/types/webhook";

export type WebhookWithDeliveries = Webhook & {
  recent_deliveries: WebhookDelivery[];
};

export type { Webhook };

export function useWebhooks() {
  const apiClient = useApiClient();
  return useGet<Webhook[]>("webhooks", () => apiClient.get<Webhook[]>('/admin/webhooks'));
}

export function useWebhook(id: string) {
  const apiClient = useApiClient();
  return useGet<WebhookWithDeliveries>(
    ["webhooks", id],
    () => apiClient.get<WebhookWithDeliveries>(`/admin/webhooks/${id}`),
    { enabled: !!id },
  );
}

export function useCreateWebhook() {
  const apiClient = useApiClient();
  return usePost<Webhook, CreateWebhookInput>(
    "webhooks",
    (data) => apiClient.post<Webhook>('/admin/webhooks', data),
  );
}

export function useUpdateWebhook() {
  const apiClient = useApiClient();
  return usePut<Webhook, UpdateWebhookInput & { id: string }>(
    "webhooks",
    ({ id, ...data }) => apiClient.put<Webhook>(`/admin/webhooks/${id}`, data),
  );
}

export function useDeleteWebhook() {
  const apiClient = useApiClient();
  return useDelete<boolean>(
    "webhooks",
    (id) => apiClient.delete<boolean>(`/admin/webhooks/${id}`),
  );
}

export function useTestWebhook() {
  const apiClient = useApiClient();
  return usePost<{ message: string; event: string; webhook_id: string }, { id: string; event: string }>(
    "webhooks",
    ({ id, event }) => apiClient.post(`/admin/webhooks/${id}/test`, { event }),
  );
}
