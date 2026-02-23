import { useDelete, useGet, usePost, usePut } from "@/hooks/crud";
import { useApiClient } from "@/lib/api/tenant-context";
import { createLeadsApi } from "@inspectos/shared/api";
import { leadsQueryKeys } from "@inspectos/shared/query";

export type Lead = {
  leadId: string;
  name: string;
  email: string;
  phone: string;
  stage: string;
  source: string;
  notes: string;
  serviceName: string;
  requestedDate: string;
  estimatedValue: number;
};

export function useLeads() {
  const apiClient = useApiClient();
  const leadsApi = createLeadsApi(apiClient);
  return useGet<Lead[]>(leadsQueryKeys.all, async () => {
    const result = await leadsApi.list<Lead>();
    return result ?? [];
  }, { initialData: [] });
}

export function useLeadById(leadId: string) {
  const apiClient = useApiClient();
  const leadsApi = createLeadsApi(apiClient);
  return useGet<Lead | null>(leadsQueryKeys.detail(leadId), async () => {
    try {
      return await leadsApi.getById<Lead>(leadId);
    } catch {
      return null;
    }
  });
}

export function useCreateLead() {
  const apiClient = useApiClient();
  const leadsApi = createLeadsApi(apiClient);
  return usePost<Lead, Partial<Lead>>(leadsQueryKeys.all, async (data) => {
    return await leadsApi.create<Lead>(data);
  });
}

export function useUpdateLead() {
  const apiClient = useApiClient();
  const leadsApi = createLeadsApi(apiClient);
  return usePut<Lead | null, { leadId: string } & Partial<Lead>>(leadsQueryKeys.all, async (data) => {
    return await leadsApi.update<Lead>(data.leadId, data);
  });
}

export function useDeleteLead() {
  const apiClient = useApiClient();
  const leadsApi = createLeadsApi(apiClient);
  return useDelete<boolean>(leadsQueryKeys.all, async (leadId: string) => {
    const result = await leadsApi.remove<{ deleted: boolean }>(leadId);
    return result.deleted ?? true;
  });
}
