import type { ApiClient } from "./client";
import type { Agency, AgencyFilters, CreateAgencyInput, UpdateAgencyInput } from "../types/agency";

export function createAgenciesApi(apiClient: ApiClient) {
  return {
    list: async (filters?: AgencyFilters): Promise<Agency[]> => {
      const params = new URLSearchParams();
      if (filters?.status) params.append("status", filters.status);
      if (filters?.search) params.append("search", filters.search);
      const endpoint = params.toString() ? `/admin/agencies?${params}` : "/admin/agencies";
      return apiClient.get<Agency[]>(endpoint);
    },
    getById: async (agencyId: string): Promise<Agency> => {
      return apiClient.get<Agency>(`/admin/agencies/${agencyId}`);
    },
    create: async (data: CreateAgencyInput): Promise<Agency> => {
      return apiClient.post<Agency>("/admin/agencies", data);
    },
    update: async (data: UpdateAgencyInput): Promise<Agency> => {
      const { id, ...updateData } = data;
      return apiClient.put<Agency>(`/admin/agencies/${id}`, updateData);
    },
    remove: async (agencyId: string): Promise<boolean> => {
      const result = await apiClient.delete<{ deleted: boolean }>(`/admin/agencies/${agencyId}`);
      return result.deleted ?? true;
    },
  };
}
