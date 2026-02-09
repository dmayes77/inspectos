import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiClient } from "@/lib/api/tenant-context";
import type { CreateWebhookInput, UpdateWebhookInput } from "@inspectos/shared/validations/webhook";

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
