import type { ApiClient } from "./client";
import type { CreatePropertyInput, Property, PropertyFilters, UpdatePropertyInput } from "../types/property";

export function createPropertiesApi(apiClient: ApiClient) {
  return {
    list: async (filters?: PropertyFilters): Promise<Property[]> => {
      const params = new URLSearchParams();
      if (filters?.client_id) params.append("client_id", filters.client_id);
      const endpoint = params.toString() ? `/admin/properties?${params}` : "/admin/properties";
      return apiClient.get<Property[]>(endpoint);
    },
    getById: async (propertyId: string): Promise<Property> => {
      return apiClient.get<Property>(`/admin/properties/${propertyId}`);
    },
    create: async (input: CreatePropertyInput): Promise<Property> => {
      return apiClient.post<Property>("/admin/properties", input);
    },
    update: async (propertyId: string, input: UpdatePropertyInput): Promise<Property> => {
      return apiClient.patch<Property>(`/admin/properties/${propertyId}`, input);
    },
    remove: async (propertyId: string): Promise<{ deleted: boolean }> => {
      return apiClient.delete<{ deleted: boolean }>(`/admin/properties/${propertyId}`);
    },
  };
}
