import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiClient } from "@/lib/api/tenant-context";
import type { CreateWebhookInput, UpdateWebhookInput } from "@inspectos/shared/validations/webhook";
import type { Webhook, WebhookDelivery } from "@inspectos/shared/types/webhook";

export type WebhookWithDeliveries = Webhook & {
  recent_deliveries: WebhookDelivery[];
};

export type { Webhook };

export function useWebhooks() {
  const apiClient = useApiClient();

  return useQuery<Webhook[]>({
    queryKey: ["webhooks"],
    queryFn: async () => apiClient.get<Webhook[]>('/admin/webhooks'),
  });
}

export function useWebhook(id: string) {
  const apiClient = useApiClient();

  return useQuery<WebhookWithDeliveries>({
    queryKey: ["webhooks", id],
    queryFn: async () => apiClient.get<WebhookWithDeliveries>(`/admin/webhooks/${id}`),
    enabled: !!id,
  });
}

export function useCreateWebhook() {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateWebhookInput) => apiClient.post<Webhook>('/admin/webhooks', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["webhooks"] });
    },
  });
}

export function useUpdateWebhook() {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: UpdateWebhookInput & { id: string }) =>
      apiClient.put<Webhook>(`/admin/webhooks/${id}`, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["webhooks"] });
      queryClient.invalidateQueries({ queryKey: ["webhooks", variables.id] });
    },
  });
}

export function useDeleteWebhook() {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => apiClient.delete<boolean>(`/admin/webhooks/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["webhooks"] });
    },
  });
}

export function useTestWebhook() {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, event }: { id: string; event: string }) => {
      return await apiClient.post<{
        message: string;
        event: string;
        webhook_id: string;
      }>(`/admin/webhooks/${id}/test`, { event });
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["webhooks", variables.id] });
    },
  });
}
