import { useGet, usePost, usePut, useDelete } from "@/hooks/crud";
import { useApiClient } from "@/lib/api/tenant-context";

export type AgencyStatus = "active" | "inactive";

export interface Agency {
  id: string;
  tenant_id: string;
  name: string;
  logo_url: string | null;
  license_number: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  status: AgencyStatus;
  notes: string | null;
  total_referrals: number;
  total_revenue: number;
  created_at: string;
  updated_at: string;
  agents?: Array<{
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    status: string;
    total_referrals: number;
  }>;
  _count?: {
    agents: number;
    orders: number;
  };
}

export interface CreateAgencyInput {
  name: string;
  logo_url?: string | null;
  license_number?: string | null;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  state?: string | null;
  zip_code?: string | null;
  status?: AgencyStatus;
  notes?: string | null;
}

export interface UpdateAgencyInput {
  id: string;
  name?: string;
  logo_url?: string | null;
  license_number?: string | null;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  state?: string | null;
  zip_code?: string | null;
  status?: AgencyStatus;
  notes?: string | null;
}

export interface AgencyFilters {
  status?: AgencyStatus;
  search?: string;
}

export function useAgencies(filters?: AgencyFilters) {
  const apiClient = useApiClient();
  return useGet<Agency[]>(
    `agencies-${JSON.stringify(filters ?? {})}`,
    async () => {
      const params = new URLSearchParams();
      if (filters?.status) params.append("status", filters.status);
      if (filters?.search) params.append("search", filters.search);
      const endpoint = params.toString() ? `/admin/agencies?${params}` : "/admin/agencies";
      return await apiClient.get<Agency[]>(endpoint);
    }
  );
}

export function useAgencyById(agencyId: string) {
  const apiClient = useApiClient();
  return useGet<Agency | null>(
    `agency-${agencyId}`,
    async () => {
      try {
        return await apiClient.get<Agency>(`/admin/agencies/${agencyId}`);
      } catch {
        return null;
      }
    },
    { enabled: !!agencyId }
  );
}

export function useCreateAgency() {
  const apiClient = useApiClient();
  return usePost<Agency, CreateAgencyInput>("agencies", async (data) => {
    return await apiClient.post<Agency>('/admin/agencies', data);
  });
}

export function useUpdateAgency() {
  const apiClient = useApiClient();
  return usePut<Agency, UpdateAgencyInput>("agencies", async (data) => {
    const { id, ...updateData } = data;
    return await apiClient.put<Agency>(`/admin/agencies/${id}`, updateData);
  });
}

export function useDeleteAgency() {
  const apiClient = useApiClient();
  return useDelete<boolean>("agencies", async (id: string) => {
    const result = await apiClient.delete<{ deleted: boolean }>(`/admin/agencies/${id}`);
    return result.deleted ?? true;
  });
}
