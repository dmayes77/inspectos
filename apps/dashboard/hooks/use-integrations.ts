import { useGet, usePost, useDelete } from "@/hooks/crud";
import { useApiClient } from "@/lib/api/tenant-context";
import { createIntegrationsApi } from "@inspectos/shared/api";
import { integrationsQueryKeys } from "@inspectos/shared/query";

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
  const integrationsApi = createIntegrationsApi(apiClient);
  return useGet<Integration[]>(integrationsQueryKeys.all, async () => {
    return await integrationsApi.list<Integration>();
  });
}

export function useConnectIntegration() {
  const apiClient = useApiClient();
  const integrationsApi = createIntegrationsApi(apiClient);
  return usePost<Integration, { type: IntegrationType; provider: string; config?: Record<string, unknown> }>(
    integrationsQueryKeys.all,
    async ({ type, provider, config }) => {
      return await integrationsApi.connect<Integration>({ type, provider, config });
    }
  );
}

export function useDisconnectIntegration() {
  const apiClient = useApiClient();
  const integrationsApi = createIntegrationsApi(apiClient);
  return useDelete<void>(integrationsQueryKeys.all, async (id) => {
    await integrationsApi.disconnect(id);
  });
}
