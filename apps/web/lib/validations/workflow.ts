import { z } from "zod";

const workflowActionSchema = z.object({
  type: z.enum(["send_email", "send_sms", "assign_tag", "remove_tag", "update_status", "webhook"]),
  config: z.record(z.string(), z.unknown()).optional(),
});

const workflowConditionSchema = z.object({
  field: z.string().optional(),
  operator: z.enum(["equals", "not_equals", "contains", "greater_than", "less_than"]).optional(),
  value: z.unknown().optional(),
});

export const createWorkflowSchema = z.object({
  name: z.string().min(1, "Workflow name is required").max(255, "Name is too long"),
  description: z.string().max(1000, "Description is too long").optional().nullable(),
  triggerScope: z.enum(["job", "inspection", "client", "lead", "invoice"], {
    message: "Invalid trigger scope",
  }),
  triggerType: z.enum(["status_changed", "tag_added", "tag_removed", "created", "updated"], {
    message: "Invalid trigger type",
  }),
  triggerTagId: z.string().uuid("Invalid tag ID").optional().nullable(),
  conditions: z.record(z.string(), workflowConditionSchema).optional().default({}),
  actions: z.array(workflowActionSchema).optional().default([]),
  delayMinutes: z.coerce.number().min(0, "Delay must be 0 or more").optional().default(0),
  isActive: z.boolean().optional().default(true),
});

export const updateWorkflowSchema = z.object({
  name: z.string().min(1, "Workflow name is required").max(255, "Name is too long").optional(),
  description: z.string().max(1000, "Description is too long").optional().nullable(),
  triggerScope: z.enum(["job", "inspection", "client", "lead", "invoice"], {
    message: "Invalid trigger scope",
  }).optional(),
  triggerType: z.enum(["status_changed", "tag_added", "tag_removed", "created", "updated"], {
    message: "Invalid trigger type",
  }).optional(),
  triggerTagId: z.string().uuid("Invalid tag ID").optional().nullable(),
  conditions: z.record(z.string(), workflowConditionSchema).optional(),
  actions: z.array(workflowActionSchema).optional(),
  delayMinutes: z.coerce.number().min(0, "Delay must be 0 or more").optional(),
  isActive: z.boolean().optional(),
});

export type CreateWorkflowInput = z.infer<typeof createWorkflowSchema>;
export type UpdateWorkflowInput = z.infer<typeof updateWorkflowSchema>;
