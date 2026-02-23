import { useGet, usePost, usePut, useDelete } from "@/hooks/crud";
import { useApiClient } from "@/lib/api/tenant-context";
import type { CreateWebhookInput, UpdateWebhookInput } from "@inspectos/shared/validations/webhook";
import type { Webhook, WebhookDelivery } from "@inspectos/shared/types/webhook";
import { createWebhooksApi } from "@inspectos/shared/api";
import { webhooksQueryKeys } from "@inspectos/shared/query";

export type WebhookWithDeliveries = Webhook & {
  recent_deliveries: WebhookDelivery[];
};

export type { Webhook };

export function useWebhooks() {
  const apiClient = useApiClient();
  const webhooksApi = createWebhooksApi(apiClient);
  return useGet<Webhook[]>(webhooksQueryKeys.all, () => webhooksApi.list<Webhook>());
}

export function useWebhook(id: string) {
  const apiClient = useApiClient();
  const webhooksApi = createWebhooksApi(apiClient);
  return useGet<WebhookWithDeliveries>(
    webhooksQueryKeys.detail(id),
    () => webhooksApi.getById<WebhookWithDeliveries>(id),
    { enabled: !!id },
  );
}

export function useCreateWebhook() {
  const apiClient = useApiClient();
  const webhooksApi = createWebhooksApi(apiClient);
  return usePost<Webhook, CreateWebhookInput>(
    webhooksQueryKeys.all,
    (data) => webhooksApi.create<Webhook>(data),
  );
}

export function useUpdateWebhook() {
  const apiClient = useApiClient();
  const webhooksApi = createWebhooksApi(apiClient);
  return usePut<Webhook, UpdateWebhookInput & { id: string }>(
    webhooksQueryKeys.all,
    ({ id, ...data }) => webhooksApi.update<Webhook>(id, data),
  );
}

export function useDeleteWebhook() {
  const apiClient = useApiClient();
  const webhooksApi = createWebhooksApi(apiClient);
  return useDelete<boolean>(
    webhooksQueryKeys.all,
    (id) => webhooksApi.remove<boolean>(id),
  );
}

export function useTestWebhook() {
  const apiClient = useApiClient();
  const webhooksApi = createWebhooksApi(apiClient);
  return usePost<{ message: string; event: string; webhook_id: string }, { id: string; event: string }>(
    webhooksQueryKeys.all,
    ({ id, event }) => webhooksApi.test<{ message: string; event: string; webhook_id: string }>(id, event),
  );
}
