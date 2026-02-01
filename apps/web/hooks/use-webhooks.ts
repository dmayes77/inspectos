import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Webhook } from "@/lib/types/webhook";
import type { CreateWebhookInput, UpdateWebhookInput } from "@/lib/validations/webhook";

export function useWebhooks() {
  return useQuery<Webhook[]>({
    queryKey: ["webhooks"],
    queryFn: async () => {
      const response = await fetch("/api/admin/webhooks");
      if (!response.ok) {
        throw new Error("Failed to fetch webhooks");
      }
      const result = await response.json();
      return result.data ?? [];
    },
  });
}

export function useWebhook(id: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return useQuery<Webhook & { recent_deliveries?: any[] }>({
    queryKey: ["webhooks", id],
    queryFn: async () => {
      const response = await fetch(`/api/admin/webhooks/${id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch webhook");
      }
      const result = await response.json();
      return result.data;
    },
    enabled: !!id,
  });
}

export function useCreateWebhook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateWebhookInput) => {
      const response = await fetch("/api/admin/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || "Failed to create webhook");
      }

      const result = await response.json();
      return result.data as Webhook;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["webhooks"] });
    },
  });
}

export function useUpdateWebhook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: UpdateWebhookInput & { id: string }) => {
      const response = await fetch(`/api/admin/webhooks/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || "Failed to update webhook");
      }

      const result = await response.json();
      return result.data as Webhook;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["webhooks"] });
      queryClient.invalidateQueries({ queryKey: ["webhooks", variables.id] });
    },
  });
}

export function useDeleteWebhook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/admin/webhooks/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || "Failed to delete webhook");
      }

      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["webhooks"] });
    },
  });
}

export function useTestWebhook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, event }: { id: string; event: string }) => {
      const response = await fetch(`/api/admin/webhooks/${id}/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || "Failed to test webhook");
      }

      const result = await response.json();
      return result.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["webhooks", variables.id] });
    },
  });
}
