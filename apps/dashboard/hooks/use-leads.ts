import { useDelete, useGet, usePost, usePut } from "@/hooks/crud";
import { useApiClient } from "@/lib/api/tenant-context";

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
  return useGet<Lead[]>("leads", async () => {
    const result = await apiClient.get<Lead[]>('/admin/leads');
    return result ?? [];
  }, { initialData: [] });
}

export function useLeadById(leadId: string) {
  const apiClient = useApiClient();
  return useGet<Lead | null>(`lead-${leadId}`, async () => {
    try {
      return await apiClient.get<Lead>(`/admin/leads/${leadId}`);
    } catch {
      return null;
    }
  });
}

export function useCreateLead() {
  const apiClient = useApiClient();
  return usePost<Lead, Partial<Lead>>("leads", async (data) => {
    return await apiClient.post<Lead>('/admin/leads', data);
  });
}

export function useUpdateLead() {
  const apiClient = useApiClient();
  return usePut<Lead | null, { leadId: string } & Partial<Lead>>("leads", async (data) => {
    return await apiClient.put<Lead>(`/admin/leads/${data.leadId}`, data);
  });
}

export function useDeleteLead() {
  const apiClient = useApiClient();
  return useDelete<boolean>("leads", async (leadId: string) => {
    const result = await apiClient.delete<{ deleted: boolean }>(`/admin/leads/${leadId}`);
    return result.deleted ?? true;
  });
}
