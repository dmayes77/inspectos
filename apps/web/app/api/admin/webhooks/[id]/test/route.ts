import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getTenantId } from "@/lib/supabase/admin-helpers";
import { validateRequestBody } from "@/lib/api/validate";
import { testWebhookSchema } from "@/lib/validations/webhook";
import { createHmac } from "crypto";

/**
 * POST /api/admin/webhooks/[id]/test
 * Test webhook by sending a sample payload
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const tenantId = getTenantId();
  const { id } = await params;

  const validation = await validateRequestBody(request, testWebhookSchema);
  if (validation.error) {
    return validation.error;
  }

  const { event } = validation.data;

  // Fetch webhook
  const { data: webhook, error: webhookError } = await supabaseAdmin
    .from("webhooks")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("id", id)
    .single();

  if (webhookError || !webhook) {
    return NextResponse.json(
      { error: { message: "Webhook not found" } },
      { status: 404 }
    );
  }

  // Build sample payload based on event type
  const samplePayload = buildSamplePayload(event, tenantId, webhook.id);

  // Generate signature
  const signature = webhook.secret
    ? createHmac("sha256", webhook.secret)
        .update(JSON.stringify(samplePayload))
        .digest("hex")
    : null;

  const deliveryId = crypto.randomUUID();

  try {
    const startTime = Date.now();

    const response = await fetch(webhook.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(signature && { "X-Webhook-Signature": `sha256=${signature}` }),
        "X-Webhook-Event": event,
        "X-Webhook-Delivery": deliveryId,
        ...webhook.headers,
      },
      body: JSON.stringify(samplePayload),
      signal: AbortSignal.timeout(webhook.retry_strategy.timeout || 30000),
    });

    const responseTime = Date.now() - startTime;
    const responseBody = await response.text();

    // Log delivery
    await supabaseAdmin.from("webhook_deliveries").insert({
      webhook_id: webhook.id,
      event_type: event,
      payload: samplePayload,
      response_status: response.status,
      response_body: responseBody.substring(0, 5000), // Limit storage
      response_time_ms: responseTime,
      error: response.ok ? null : `HTTP ${response.status}`,
      attempt_number: 1,
    });

    // Update webhook stats
    if (response.ok) {
      await supabaseAdmin
        .from("webhooks")
        .update({
          last_triggered_at: new Date().toISOString(),
          last_success_at: new Date().toISOString(),
          failure_count: 0,
        })
        .eq("id", webhook.id);
    } else {
      await supabaseAdmin
        .from("webhooks")
        .update({
          last_triggered_at: new Date().toISOString(),
          failure_count: webhook.failure_count + 1,
          last_error: `HTTP ${response.status}: ${responseBody.substring(0, 500)}`,
        })
        .eq("id", webhook.id);
    }

    return NextResponse.json({
      data: {
        success: response.ok,
        status: response.status,
        response_time_ms: responseTime,
        response_body: responseBody.substring(0, 1000),
        delivery_id: deliveryId,
      },
    });
  } catch (error) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const typedError = error as any;
    // Log failed delivery
    await supabaseAdmin.from("webhook_deliveries").insert({
      webhook_id: webhook.id,
      event_type: event,
      payload: samplePayload,
      response_status: null,
      response_body: null,
      response_time_ms: null,
      error: typedError.message,
      attempt_number: 1,
    });

    // Update webhook error
    await supabaseAdmin
      .from("webhooks")
      .update({
        last_triggered_at: new Date().toISOString(),
        failure_count: webhook.failure_count + 1,
        last_error: typedError.message,
      })
      .eq("id", webhook.id);

    return NextResponse.json(
      {
        data: {
          success: false,
          error: typedError.message,
          delivery_id: deliveryId,
        },
      },
      { status: 200 } // Still return 200, the webhook test completed
    );
  }
}

/**
 * Build sample payload for different event types
 */
function buildSamplePayload(event: string, tenantId: string, webhookId: string) {
  const deliveryId = crypto.randomUUID();
  const timestamp = new Date().toISOString();

  const basePayload = {
    event,
    timestamp,
    tenant_id: tenantId,
    metadata: {
      webhook_id: webhookId,
      delivery_id: deliveryId,
    },
  };

  // Customize data based on event type
  switch (event) {
    case "order.created":
    case "order.updated":
    case "order.completed":
      return {
        ...basePayload,
        data: {
          order: {
            id: "sample-order-id",
            order_number: "ORD-2024-SAMPLE",
            status: "pending",
            client: {
              id: "sample-client-id",
              name: "John Doe",
              email: "john@example.com",
            },
            property: {
              id: "sample-property-id",
              address: "123 Main St, City, State 12345",
            },
            services: [
              {
                id: "sample-service-id",
                name: "Home Inspection",
                price: 450.0,
              },
            ],
            scheduled_date: "2024-02-05",
            scheduled_time: "10:00",
            total: 450.0,
            created_at: timestamp,
          },
        },
      };

    case "inspection.created":
    case "inspection.started":
    case "inspection.completed":
      return {
        ...basePayload,
        data: {
          inspection: {
            id: "sample-inspection-id",
            order_id: "sample-order-id",
            status: "in_progress",
            inspector: {
              id: "sample-inspector-id",
              name: "Jane Inspector",
              email: "jane@example.com",
            },
            property: {
              id: "sample-property-id",
              address: "123 Main St, City, State 12345",
            },
            started_at: timestamp,
          },
        },
      };

    case "client.created":
    case "client.updated":
      return {
        ...basePayload,
        data: {
          client: {
            id: "sample-client-id",
            name: "John Doe",
            email: "john@example.com",
            phone: "555-1234",
            created_at: timestamp,
          },
        },
      };

    case "invoice.created":
    case "invoice.paid":
      return {
        ...basePayload,
        data: {
          invoice: {
            id: "sample-invoice-id",
            invoice_number: "INV-2024-SAMPLE",
            order_id: "sample-order-id",
            client: {
              id: "sample-client-id",
              name: "John Doe",
              email: "john@example.com",
            },
            total: 450.0,
            status: "paid",
            issued_at: timestamp,
            due_at: "2024-02-15T10:00:00Z",
          },
        },
      };

    default:
      return {
        ...basePayload,
        data: {
          message: "This is a test webhook payload",
        },
      };
  }
}
