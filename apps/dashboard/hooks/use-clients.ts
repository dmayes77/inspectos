import { useGet, usePost, usePut, useDelete } from "@/hooks/crud";
import { useApiClient } from "@/lib/api/tenant-context";
import { createClientsApi } from "@inspectos/shared/api";
import { clientsQueryKeys } from "@inspectos/shared/query";
import type { CRMClient as Client, CreateCRMClientInput, UpdateCRMClientInput } from "@inspectos/shared/types/crm-client";

export type { CRMClientProperty as ClientProperty } from "@inspectos/shared/types/crm-client";
export type { CRMClient as Client } from "@inspectos/shared/types/crm-client";

export function useClients() {
  const apiClient = useApiClient();
  const clientsApi = createClientsApi(apiClient);
  return useGet<Client[]>(clientsQueryKeys.all, async () => {
    return await clientsApi.list();
  });
}

export function useCreateClient() {
  const apiClient = useApiClient();
  const clientsApi = createClientsApi(apiClient);
  return usePost<Client, CreateCRMClientInput>(clientsQueryKeys.all, async (data) => {
    return await clientsApi.create(data);
  });
}

export function useUpdateClient() {
  const apiClient = useApiClient();
  const clientsApi = createClientsApi(apiClient);
  return usePut<Client | null, UpdateCRMClientInput>(
    clientsQueryKeys.all,
    async (data) => {
      return await clientsApi.update(data);
    }
  );
}

export function useDeleteClient() {
  const apiClient = useApiClient();
  const clientsApi = createClientsApi(apiClient);
  return useDelete<boolean>(clientsQueryKeys.all, async (clientId: string) => {
    return await clientsApi.remove(clientId);
  });
}

export function useClientById(clientId?: string) {
  const apiClient = useApiClient();
  const clientsApi = createClientsApi(apiClient);
  return useGet<Client | null>(
    clientId ? clientsQueryKeys.detail(clientId) : ["clients", "detail", "undefined"],
    async () => {
      try {
        return await clientsApi.getById(clientId ?? "");
      } catch {
        return null;
      }
    },
    { enabled: Boolean(clientId) }
  );
}
