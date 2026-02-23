import { createServiceClient } from "../supabase";
import { createHmac } from "crypto";
import type { Webhook } from "@inspectos/shared/types/webhook";
import type { WebhookEvent } from "@inspectos/shared/validations/webhook";

export interface WebhookDeliveryOptions {
  webhookId: string;
  eventType: WebhookEvent;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload: any;
  attemptNumber?: number;
}

/**
 * Deliver a webhook to its configured endpoint
 */
export async function deliverWebhook(options: WebhookDeliveryOptions) {
  const { webhookId, eventType, payload, attemptNumber = 1 } = options;

  const supabase = createServiceClient();

  // Fetch webhook configuration
  const { data: webhook, error: webhookError } = await supabase
    .from("webhooks")
    .select("*")
    .eq("id", webhookId)
    .single();

  if (webhookError || !webhook) {
    console.error(`Webhook ${webhookId} not found:`, webhookError);
    return;
  }

  // Don't attempt delivery if webhook is not active
  if (webhook.status !== "active") {
    console.log(`Webhook ${webhookId} is ${webhook.status}, skipping delivery`);
    return;
  }

  const deliveryId = crypto.randomUUID();

  // Build complete payload
  const completePayload = {
    event: eventType,
    timestamp: new Date().toISOString(),
    tenant_id: webhook.tenant_id,
    data: payload,
    metadata: {
      webhook_id: webhookId,
      delivery_id: deliveryId,
    },
  };

  // Generate signature if secret is configured
  const signature = webhook.secret
    ? createHmac("sha256", webhook.secret)
        .update(JSON.stringify(completePayload))
        .digest("hex")
    : null;

  const startTime = Date.now();

  try {
    const response = await fetch(webhook.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(signature && { "X-Webhook-Signature": `sha256=${signature}` }),
        "X-Webhook-Event": eventType,
        "X-Webhook-Delivery": deliveryId,
        "X-Webhook-Attempt": attemptNumber.toString(),
        ...webhook.headers,
      },
      body: JSON.stringify(completePayload),
      signal: AbortSignal.timeout(webhook.retry_strategy.timeout || 30000),
    });

    const responseTime = Date.now() - startTime;
    const responseBody = await response.text();

    // Log delivery
    await supabase.from("webhook_deliveries").insert({
      webhook_id: webhookId,
      event_type: eventType,
      payload: completePayload,
      response_status: response.status,
      response_body: responseBody.substring(0, 5000),
      response_time_ms: responseTime,
      error: response.ok ? null : `HTTP ${response.status}`,
      attempt_number: attemptNumber,
    });

    if (response.ok) {
      // Success - reset failure count
      await supabase
        .from("webhooks")
        .update({
          last_triggered_at: new Date().toISOString(),
          last_success_at: new Date().toISOString(),
          failure_count: 0,
          last_error: null,
        })
        .eq("id", webhookId);

      console.log(`Webhook ${webhookId} delivered successfully in ${responseTime}ms`);
    } else {
      // Failed - increment failure count
      await supabase
        .from("webhooks")
        .update({
          last_triggered_at: new Date().toISOString(),
          failure_count: webhook.failure_count + 1,
          last_error: `HTTP ${response.status}: ${responseBody.substring(0, 500)}`,
        })
        .eq("id", webhookId);

      console.error(`Webhook ${webhookId} delivery failed with status ${response.status}`);

      // Schedule retry if configured
      if (attemptNumber < webhook.retry_strategy.max_attempts) {
        await scheduleRetry(webhook, options, attemptNumber);
      }
    }
  } catch (error) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const typedError = error as any;
    const responseTime = Date.now() - startTime;

    // Log failed delivery
    await supabase.from("webhook_deliveries").insert({
      webhook_id: webhookId,
      event_type: eventType,
      payload: completePayload,
      response_status: null,
      response_body: null,
      response_time_ms: responseTime,
      error: typedError.message,
      attempt_number: attemptNumber,
    });

    // Update webhook error
    await supabase
      .from("webhooks")
      .update({
        last_triggered_at: new Date().toISOString(),
        failure_count: webhook.failure_count + 1,
        last_error: typedError.message,
      })
      .eq("id", webhookId);

    console.error(`Webhook ${webhookId} delivery error:`, typedError.message);

    // Schedule retry if configured
    if (attemptNumber < webhook.retry_strategy.max_attempts) {
      await scheduleRetry(webhook, options, attemptNumber);
    }
  }
}

/**
 * Schedule a retry with exponential backoff
 */
async function scheduleRetry(
  webhook: Webhook,
  options: WebhookDeliveryOptions,
  attemptNumber: number
) {
  const { backoff } = webhook.retry_strategy;
  const nextAttempt = attemptNumber + 1;

  // Calculate delay based on backoff strategy
  let delayMs: number;
  if (backoff === "exponential") {
    // Exponential: 1s, 2s, 4s, 8s, etc.
    delayMs = Math.pow(2, attemptNumber) * 1000;
  } else {
    // Linear: 1s, 2s, 3s, 4s, etc.
    delayMs = attemptNumber * 1000;
  }

  console.log(`Scheduling retry ${nextAttempt} for webhook ${webhook.id} in ${delayMs}ms`);

  // In a production environment, you'd use a job queue like BullMQ, pg-boss, or Inngest
  // For now, we'll use setTimeout (only works for short delays in serverless)
  setTimeout(() => {
    deliverWebhook({
      ...options,
      attemptNumber: nextAttempt,
    });
  }, delayMs);
}

/**
 * Trigger webhooks for a specific event
 */
export async function triggerWebhookEvent(
  eventType: WebhookEvent,
  tenantId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload: any
) {
  const supabase = createServiceClient();

  // Find all active webhooks subscribed to this event
  const { data: webhooks, error } = await supabase
    .from("webhooks")
    .select("id, events, status")
    .eq("tenant_id", tenantId)
    .eq("status", "active")
    .contains("events", [eventType]);

  if (error) {
    console.error("Error fetching webhooks:", error);
    return;
  }

  if (!webhooks || webhooks.length === 0) {
    console.log(`No active webhooks found for event ${eventType}`);
    return;
  }

  console.log(`Triggering ${webhooks.length} webhook(s) for event ${eventType}`);

  // Deliver to all matching webhooks
  const deliveryPromises = webhooks.map((webhook) =>
    deliverWebhook({
      webhookId: webhook.id,
      eventType,
      payload,
    })
  );

  // Don't await - fire and forget
  Promise.allSettled(deliveryPromises);
}
