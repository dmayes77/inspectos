import type { ApiClient } from "./client";
import type { Inspection } from "../types/inspection";

export function createInspectionsApi(apiClient: ApiClient) {
  return {
    list: async (): Promise<Inspection[]> => {
      const result = await apiClient.get<Inspection[]>("/admin/inspections");
      return result ?? [];
    },
    create: async (data: Record<string, unknown>): Promise<Inspection> => {
      return apiClient.post<Inspection>("/admin/inspections", data);
    },
    update: async (inspectionId: string, data: Record<string, unknown>): Promise<Inspection> => {
      return apiClient.put<Inspection>(`/admin/inspections/${inspectionId}`, data);
    },
    remove: async (inspectionId: string): Promise<boolean> => {
      const result = await apiClient.delete<{ deleted: boolean } | boolean>(`/admin/inspections/${inspectionId}`);
      return typeof result === "boolean" ? result : (result.deleted ?? true);
    },
  };
}
