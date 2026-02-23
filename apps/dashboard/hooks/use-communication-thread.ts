import { useQuery } from "@tanstack/react-query";
import type { CommunicationEntityType, CommunicationThread } from "@inspectos/shared/types/communication";

export function useCommunicationThread(entityType: CommunicationEntityType, entityId: string) {
  return useQuery<CommunicationThread>({
    queryKey: ["communication-thread", entityType, entityId],
    queryFn: async () => {
      const response = await fetch(`/api/admin/communications/threads/${entityType}/${entityId}`);
      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody.error?.message || "Failed to load communication thread");
      }
      const result = await response.json();
      return result.data as CommunicationThread;
    },
    enabled: Boolean(entityType && entityId),
  });
}
