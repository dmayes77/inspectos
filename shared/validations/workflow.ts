import { z } from "zod";
import { WEBHOOK_EVENTS } from "./webhook";

const workflowScopes = ["lead", "client", "inspection", "invoice", "job", "payment", "service", "template"] as const;
const workflowTriggerTypes = ["tag_added", "tag_removed", "status_changed", "event"] as const;
const workflowActions = ["send_email", "add_tag", "remove_tag", "wait", "notify", "convert_lead_to_client", "webhook"] as const;

const workflowActionSchema = z.object({
  type: z.enum(workflowActions),
  config: z.record(z.string(), z.unknown()).optional(),
});

const workflowConditionSchema = z.object({
  field: z.string().optional(),
  operator: z.enum(["equals", "not_equals", "contains", "greater_than", "less_than"]).optional(),
  value: z.unknown().optional(),
});

const workflowBaseFields = {
  name: z.string().min(1, "Workflow name is required").max(255, "Name is too long"),
  description: z.string().max(1000, "Description is too long").optional().nullable(),
  triggerScope: z.enum(workflowScopes, {
    message: "Invalid trigger scope",
  }),
  triggerType: z.enum(workflowTriggerTypes, {
    message: "Invalid trigger type",
  }),
  triggerTagId: z.string().uuid("Invalid tag ID").optional().nullable(),
  eventType: z.enum(WEBHOOK_EVENTS).optional().nullable(),
  conditions: z.record(z.string(), workflowConditionSchema).optional().default({}),
  actions: z.array(workflowActionSchema).optional().default([]),
  delayMinutes: z.coerce.number().min(0, "Delay must be 0 or more").optional().default(0),
  isActive: z.boolean().optional().default(true),
};

export const createWorkflowSchema = z
  .object(workflowBaseFields)
  .refine(
    (data) => data.triggerType !== "event" || Boolean(data.eventType),
    {
      message: "Event type is required when trigger type is event",
      path: ["eventType"],
    }
  );

export const updateWorkflowSchema = z
  .object({
    name: workflowBaseFields.name.optional(),
    description: workflowBaseFields.description.optional(),
    triggerScope: workflowBaseFields.triggerScope.optional(),
    triggerType: workflowBaseFields.triggerType.optional(),
    triggerTagId: workflowBaseFields.triggerTagId.optional(),
    eventType: workflowBaseFields.eventType.optional(),
    conditions: workflowBaseFields.conditions.optional(),
    actions: workflowBaseFields.actions.optional(),
    delayMinutes: workflowBaseFields.delayMinutes.optional(),
    isActive: workflowBaseFields.isActive.optional(),
  })
  .refine((data) => data.triggerType !== "event" || Boolean(data.eventType), {
    message: "Event type is required when trigger type is event",
    path: ["eventType"],
  });

export type CreateWorkflowInput = z.infer<typeof createWorkflowSchema>;
export type UpdateWorkflowInput = z.infer<typeof updateWorkflowSchema>;
