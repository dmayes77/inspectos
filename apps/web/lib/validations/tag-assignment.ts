import { z } from "zod";

const tagAssignmentScopeSchema = z.enum(["lead", "client", "inspection", "invoice", "job", "payment", "service", "template"], {
  errorMap: () => ({ message: "Invalid tag scope" }),
});

export const createTagAssignmentSchema = z.object({
  scope: tagAssignmentScopeSchema,
  entityId: z.string().min(1, "Entity ID is required"),
  tagId: z.string().min(1, "Tag ID is required"),
});

export const tagAssignmentQuerySchema = z.object({
  scope: tagAssignmentScopeSchema,
  entityId: z.string().min(1, "Entity ID is required"),
});

export const tagAssignmentDeleteSchema = tagAssignmentQuerySchema.extend({
  tagId: z.string().min(1, "Tag ID is required"),
});

export type CreateTagAssignmentInput = z.infer<typeof createTagAssignmentSchema>;
export type TagAssignmentQueryInput = z.infer<typeof tagAssignmentQuerySchema>;
export type TagAssignmentDeleteInput = z.infer<typeof tagAssignmentDeleteSchema>;
