import type { CommunicationEntityType } from "../types/communication";

export const communicationsQueryKeys = {
  all: ["communications"] as const,
  threads: () => ["communications", "thread"] as const,
  thread: (entityType: CommunicationEntityType, entityId: string) =>
    ["communications", "thread", entityType, entityId] as const,
};
