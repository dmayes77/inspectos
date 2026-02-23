import { useQuery } from "@tanstack/react-query";
import type { CommunicationEntityType, CommunicationThread } from "@inspectos/shared/types/communication";
import { createCommunicationsApi } from "@inspectos/shared/api";
import { communicationsQueryKeys } from "@inspectos/shared/query";
import { useApiClient } from "@/lib/api/tenant-context";

export function useCommunicationThread(entityType: CommunicationEntityType, entityId: string) {
  const apiClient = useApiClient();
  const communicationsApi = createCommunicationsApi(apiClient);

  return useQuery<CommunicationThread>({
    queryKey: communicationsQueryKeys.thread(entityType, entityId),
    queryFn: () => communicationsApi.getThread(entityType, entityId),
    enabled: Boolean(entityType && entityId),
  });
}
