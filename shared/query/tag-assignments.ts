export const tagAssignmentsQueryKeys = {
  all: ["tag-assignments"] as const,
  list: (scope: string, entityId: string) => ["tag-assignments", scope, entityId] as const,
};
