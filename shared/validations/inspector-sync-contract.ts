import { z } from "zod";

export const inspectorSyncInspectionStatusSchema = z.enum([
  "draft",
  "in_progress",
  "completed",
  "submitted",
]);

export const inspectorSyncInspectionPayloadSchema = z.object({
  id: z.string().uuid("Inspection id must be a UUID"),
  job_id: z.string().uuid("Job id must be a UUID"),
  template_id: z.string().uuid("Template id must be a UUID"),
  template_version: z.number().int().positive(),
  inspector_id: z.string().uuid("Inspector id must be a UUID").nullable(),
  status: inspectorSyncInspectionStatusSchema,
  started_at: z.string().datetime().nullable(),
  completed_at: z.string().datetime().nullable(),
  weather_conditions: z.string().max(2000).nullable(),
  temperature: z.string().max(120).nullable(),
  present_parties: z.array(z.string()).nullable(),
  notes: z.string().max(10000).nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
}).superRefine((payload, ctx) => {
  if (payload.status !== "draft" && !payload.started_at) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["started_at"],
      message: "started_at is required when inspection is in progress, completed, or submitted",
    });
  }

  if ((payload.status === "completed" || payload.status === "submitted") && !payload.completed_at) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["completed_at"],
      message: "completed_at is required when inspection is completed or submitted",
    });
  }
});

export const inspectorSyncJobStatusPayloadSchema = z.object({
  status: z.enum(["scheduled", "in_progress", "completed", "cancelled", "pending_report"]),
});

export const inspectorSyncOutboxItemSchema = z.object({
  id: z.string().min(1),
  entity_type: z.enum(["inspection", "answer", "finding", "signature", "job_status"]),
  entity_id: z.string().min(1),
  operation: z.enum(["upsert", "delete"]),
  payload: z.record(z.string(), z.unknown()),
  created_at: z.string().datetime(),
});

export const inspectorSyncPushRequestSchema = z.object({
  tenant_id: z.string().uuid("tenant_id must be a UUID"),
  items: z.array(inspectorSyncOutboxItemSchema),
});

export type InspectorSyncInspectionPayload = z.infer<typeof inspectorSyncInspectionPayloadSchema>;
export type InspectorSyncJobStatusPayload = z.infer<typeof inspectorSyncJobStatusPayloadSchema>;
export type InspectorSyncPushRequest = z.infer<typeof inspectorSyncPushRequestSchema>;
