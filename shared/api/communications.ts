import type { ApiClient } from "./client";
import type { CommunicationEntityType, CommunicationThread } from "../types/communication";

export function createCommunicationsApi(apiClient: ApiClient) {
  return {
    getThread: async (entityType: CommunicationEntityType, entityId: string): Promise<CommunicationThread> => {
      return apiClient.get<CommunicationThread>(`/admin/communications/threads/${entityType}/${entityId}`);
    },
  };
}
