import { useGet, usePost, usePut, useDelete } from "@/hooks/crud";
import { useApiClient } from "@/lib/api/tenant-context";
import { createAgenciesApi } from "@inspectos/shared/api";
import { agenciesQueryKeys } from "@inspectos/shared/query";
import type { Agency, AgencyFilters, AgencyStatus, CreateAgencyInput, UpdateAgencyInput } from "@inspectos/shared/types/agency";

export type { Agency, AgencyFilters, AgencyStatus, CreateAgencyInput, UpdateAgencyInput };

export function useAgencies(filters?: AgencyFilters) {
  const apiClient = useApiClient();
  const agenciesApi = createAgenciesApi(apiClient);
  return useGet<Agency[]>(
    agenciesQueryKeys.list(filters),
    async () => {
      return await agenciesApi.list(filters);
    }
  );
}

export function useAgencyById(agencyId: string) {
  const apiClient = useApiClient();
  const agenciesApi = createAgenciesApi(apiClient);
  return useGet<Agency | null>(
    agenciesQueryKeys.detail(agencyId),
    async () => {
      try {
        return await agenciesApi.getById(agencyId);
      } catch {
        return null;
      }
    },
    { enabled: !!agencyId }
  );
}

export function useCreateAgency() {
  const apiClient = useApiClient();
  const agenciesApi = createAgenciesApi(apiClient);
  return usePost<Agency, CreateAgencyInput>(agenciesQueryKeys.all, async (data) => {
    return await agenciesApi.create(data);
  });
}

export function useUpdateAgency() {
  const apiClient = useApiClient();
  const agenciesApi = createAgenciesApi(apiClient);
  return usePut<Agency, UpdateAgencyInput>(agenciesQueryKeys.all, async (data) => {
    return await agenciesApi.update(data);
  });
}

export function useDeleteAgency() {
  const apiClient = useApiClient();
  const agenciesApi = createAgenciesApi(apiClient);
  return useDelete<boolean>(agenciesQueryKeys.all, async (id: string) => {
    return await agenciesApi.remove(id);
  });
}
