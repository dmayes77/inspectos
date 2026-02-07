import { z } from "zod";

export const INTEGRATION_TYPES = ["email", "sms", "payments", "accounting", "payroll", "calendar"] as const;
export const INTEGRATION_STATUSES = ["connected", "disconnected", "error", "pending"] as const;

export type IntegrationType = typeof INTEGRATION_TYPES[number];
export type IntegrationStatus = typeof INTEGRATION_STATUSES[number];

export const createIntegrationSchema = z.object({
  type: z.enum(INTEGRATION_TYPES, { message: "Invalid integration type" }),
  provider: z.string().min(1, "Provider is required").max(100, "Provider name is too long"),
  config: z.record(z.string(), z.unknown()).optional(),
});

export const updateIntegrationSchema = z.object({
  config: z.record(z.string(), z.unknown()).optional(),
  status: z.enum(INTEGRATION_STATUSES).optional(),
});

export type CreateIntegrationInput = z.infer<typeof createIntegrationSchema>;
export type UpdateIntegrationInput = z.infer<typeof updateIntegrationSchema>;
