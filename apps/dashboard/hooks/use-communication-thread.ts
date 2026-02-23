import { useQuery } from "@tanstack/react-query";
import type { CommunicationEntityType, CommunicationThread } from "@inspectos/shared/types/communication";
import { fetchCommunicationThread } from "@/lib/api/communications";

export function useCommunicationThread(entityType: CommunicationEntityType, entityId: string) {
  return useQuery<CommunicationThread>({
    queryKey: ["communication-thread", entityType, entityId],
    queryFn: () => fetchCommunicationThread(entityType, entityId),
    enabled: Boolean(entityType && entityId),
  });
}
