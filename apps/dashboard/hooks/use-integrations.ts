import { useGet, usePost, useDelete } from "@/hooks/crud";
import { useApiClient } from "@/lib/api/tenant-context";

export type IntegrationType = 'email' | 'sms' | 'payments' | 'accounting' | 'payroll' | 'calendar';
export type IntegrationStatus = 'connected' | 'disconnected' | 'error' | 'pending';

export type Integration = {
  id: string;
  type: IntegrationType;
  provider: string;
  status: IntegrationStatus;
  config: Record<string, unknown>;
  connected_at: string | null;
  last_sync_at: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
};

export function useIntegrations() {
  const apiClient = useApiClient();
  return useGet<Integration[]>("integrations", async () => {
    return await apiClient.get<Integration[]>('/admin/integrations');
  });
}

export function useConnectIntegration() {
  const apiClient = useApiClient();
  return usePost<Integration, { type: IntegrationType; provider: string; config?: Record<string, unknown> }>(
    "integrations",
    async ({ type, provider, config }) => {
      return await apiClient.post<Integration>('/admin/integrations', { type, provider, config });
    }
  );
}

export function useDisconnectIntegration() {
  const apiClient = useApiClient();
  return useDelete<void>("integrations", async (id) => {
    await apiClient.delete(`/admin/integrations/${id}`);
  });
}
