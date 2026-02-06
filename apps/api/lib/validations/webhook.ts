import { z } from "zod";

/**
 * Available webhook event types
 */
export const WEBHOOK_EVENTS = [
  // Order events
  "order.created",
  "order.updated",
  "order.completed",
  "order.cancelled",

  // Inspection events
  "inspection.created",
  "inspection.updated",
  "inspection.started",
  "inspection.completed",
  "inspection.submitted",

  // Client events
  "client.created",
  "client.updated",

  // Invoice events
  "invoice.created",
  "invoice.updated",
  "invoice.paid",
  "invoice.overdue",

  // Schedule events
  "schedule.created",
  "schedule.updated",
  "schedule.cancelled",
] as const;

export type WebhookEvent = typeof WEBHOOK_EVENTS[number];

/**
 * Webhook retry strategy configuration
 */
export const retryStrategySchema = z.object({
  max_attempts: z.number().int().min(1).max(10).default(3),
  backoff: z.enum(["linear", "exponential"]).default("exponential"),
  timeout: z.number().int().min(5000).max(60000).default(30000), // 5-60 seconds
});

/**
 * Validation schema for creating a webhook
 */
export const createWebhookSchema = z.object({
  name: z.string().min(1, "Name is required").max(255, "Name is too long"),
  url: z.string().url("Invalid webhook URL").refine(
    (url: string) => url.startsWith("https://"),
    "Webhook URL must use HTTPS"
  ),
  description: z.string().max(1000).optional().nullable(),
  events: z.array(z.enum(WEBHOOK_EVENTS)).min(1, "Select at least one event"),
  secret: z.string().min(16).max(255).optional().nullable(),
  headers: z.record(z.string(), z.string()).optional(),
  retry_strategy: retryStrategySchema.optional(),
});

/**
 * Validation schema for updating a webhook
 */
export const updateWebhookSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  url: z.string().url().refine(
    (url: string) => url.startsWith("https://"),
    "Webhook URL must use HTTPS"
  ).optional(),
  description: z.string().max(1000).optional().nullable(),
  events: z.array(z.enum(WEBHOOK_EVENTS)).min(1).optional(),
  secret: z.string().min(16).max(255).optional().nullable(),
  headers: z.record(z.string(), z.string()).optional(),
  status: z.enum(["active", "paused", "failed"]).optional(),
  retry_strategy: retryStrategySchema.optional(),
});

/**
 * Test webhook schema
 */
export const testWebhookSchema = z.object({
  event: z.enum(WEBHOOK_EVENTS),
});

export type CreateWebhookInput = z.infer<typeof createWebhookSchema>;
export type UpdateWebhookInput = z.infer<typeof updateWebhookSchema>;
export type TestWebhookInput = z.infer<typeof testWebhookSchema>;
export type RetryStrategy = z.infer<typeof retryStrategySchema>;
