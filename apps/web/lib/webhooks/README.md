# Webhook System Integration Guide

This guide shows how to integrate webhook triggers into your application's business logic.

## Overview

The webhook system allows you to notify external services (like Zapier, Make, or custom applications) when important events occur in your application.

## How to Trigger Webhooks

### Basic Usage

```typescript
import { triggerWebhookEvent } from "@/lib/webhooks/delivery";
import { buildOrderCreatedPayload } from "@/lib/webhooks/payloads";

// After creating an order
const order = await createOrder(data);

// Trigger webhook
await triggerWebhookEvent(
  "order.created",
  tenantId,
  buildOrderCreatedPayload(order)
);
```

### Integration Points

#### 1. Order Lifecycle

**In `/api/admin/orders/route.ts` (POST endpoint)**

```typescript
// After order is successfully created
const { data: completeOrder } = await supabaseAdmin
  .from("orders")
  .select("*")
  .eq("id", order.id)
  .single();

// Trigger webhook
await triggerWebhookEvent(
  "order.created",
  tenantId,
  buildOrderCreatedPayload(completeOrder)
);
```

**In `/api/admin/orders/[id]/route.ts` (PUT endpoint)**

```typescript
// After order is updated
const { data: updatedOrder } = await supabaseAdmin
  .from("orders")
  .update(updateData)
  .eq("id", id)
  .select("*")
  .single();

await triggerWebhookEvent(
  "order.updated",
  tenantId,
  buildOrderUpdatedPayload(updatedOrder)
);

// If status changed to completed
if (updateData.status === "completed" && previousStatus !== "completed") {
  await triggerWebhookEvent(
    "order.completed",
    tenantId,
    buildOrderCompletedPayload(updatedOrder)
  );
}

// If status changed to cancelled
if (updateData.status === "cancelled" && previousStatus !== "cancelled") {
  await triggerWebhookEvent(
    "order.cancelled",
    tenantId,
    buildOrderCancelledPayload(updatedOrder)
  );
}
```

#### 2. Inspection Lifecycle

**After inspection is created**

```typescript
import { buildInspectionPayload } from "@/lib/webhooks/payloads";

await triggerWebhookEvent(
  "inspection.created",
  tenantId,
  buildInspectionPayload(inspection)
);
```

**When inspection is started**

```typescript
// When inspector starts inspection
await triggerWebhookEvent(
  "inspection.started",
  tenantId,
  buildInspectionPayload(inspection)
);
```

**When inspection is completed**

```typescript
// When inspection is marked as completed
await triggerWebhookEvent(
  "inspection.completed",
  tenantId,
  buildInspectionPayload(inspection)
);
```

**When inspection is submitted**

```typescript
// When inspection is submitted for review
await triggerWebhookEvent(
  "inspection.submitted",
  tenantId,
  buildInspectionPayload(inspection)
);
```

#### 3. Client Events

```typescript
import { buildClientPayload } from "@/lib/webhooks/payloads";

// After client created
await triggerWebhookEvent(
  "client.created",
  tenantId,
  buildClientPayload(client)
);

// After client updated
await triggerWebhookEvent(
  "client.updated",
  tenantId,
  buildClientPayload(client)
);
```

#### 4. Invoice Events

```typescript
import { buildInvoicePayload } from "@/lib/webhooks/payloads";

// After invoice created
await triggerWebhookEvent(
  "invoice.created",
  tenantId,
  buildInvoicePayload(invoice)
);

// When invoice is paid
await triggerWebhookEvent(
  "invoice.paid",
  tenantId,
  buildInvoicePayload(invoice)
);

// When invoice becomes overdue (scheduled job)
await triggerWebhookEvent(
  "invoice.overdue",
  tenantId,
  buildInvoicePayload(invoice)
);
```

#### 5. Schedule Events

```typescript
import { buildSchedulePayload } from "@/lib/webhooks/payloads";

// After schedule created
await triggerWebhookEvent(
  "schedule.created",
  tenantId,
  buildSchedulePayload(schedule)
);

// After schedule updated
await triggerWebhookEvent(
  "schedule.updated",
  tenantId,
  buildSchedulePayload(schedule)
);

// When schedule is cancelled
await triggerWebhookEvent(
  "schedule.cancelled",
  tenantId,
  buildSchedulePayload(schedule)
);
```

## Best Practices

### 1. Fire and Forget

Webhook delivery is asynchronous and non-blocking:

```typescript
// ✅ Good - doesn't block the response
await createOrder(data);
triggerWebhookEvent("order.created", tenantId, payload); // No await
return NextResponse.json({ data: order });
```

### 2. Error Handling

The webhook system handles errors internally and logs them. You don't need to catch errors:

```typescript
// ✅ This is safe - errors won't crash your API
triggerWebhookEvent("order.created", tenantId, payload);
```

### 3. Complete Data

Always fetch complete related data before triggering webhooks:

```typescript
// ❌ Bad - missing related data
const order = await createOrderInDb(data);
triggerWebhookEvent("order.created", tenantId, order);

// ✅ Good - includes all relations
const order = await supabase
  .from("orders")
  .select("*, client(*), property(*), inspection(services(*))")
  .eq("id", orderId)
  .single();
triggerWebhookEvent("order.created", tenantId, buildOrderCreatedPayload(order));
```

### 4. Avoid Duplicate Events

Check if status actually changed before triggering completion events:

```typescript
// ❌ Bad - might trigger multiple times
await updateOrder(id, { status: "completed" });
triggerWebhookEvent("order.completed", tenantId, payload);

// ✅ Good - only triggers on status change
if (updateData.status === "completed" && previousStatus !== "completed") {
  triggerWebhookEvent("order.completed", tenantId, payload);
}
```

## Testing Webhooks

Users can test webhooks from the UI at `/admin/automations/webhooks` using the test button, or via API:

```bash
POST /api/admin/webhooks/{id}/test
{
  "event": "order.created"
}
```

## Webhook Signature Verification

Recipients should verify webhook signatures to ensure authenticity:

```typescript
// Example verification (recipient side)
import crypto from "crypto";

function verifyWebhook(payload: string, signature: string, secret: string): boolean {
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");

  return signature === `sha256=${expectedSignature}`;
}

// In your webhook handler
const signature = request.headers.get("X-Webhook-Signature");
const payload = await request.text();

if (!verifyWebhook(payload, signature, process.env.WEBHOOK_SECRET)) {
  return new Response("Invalid signature", { status: 401 });
}
```

## Monitoring

Webhook delivery logs are stored in the `webhook_deliveries` table and visible in the UI. Monitor:

- Success rate
- Response times
- Failed deliveries
- Error messages

Webhooks are automatically paused after 10 consecutive failures.

## Production Considerations

For production deployments, consider:

1. **Queue System**: Use a job queue (BullMQ, pg-boss, Inngest) instead of setTimeout for retries
2. **Rate Limiting**: Implement per-webhook rate limits
3. **Dead Letter Queue**: Store failed deliveries for manual review
4. **Monitoring**: Set up alerts for webhook failures
5. **Compliance**: Log webhook deliveries for audit trails

## Common Integration Examples

### Zapier

Users configure a Zapier webhook URL and select events. Zapier receives the payload and can:
- Send to Slack
- Update Google Sheets
- Create tasks in Asana
- Add to CRM
- Send emails

### Make (Integromat)

Similar to Zapier, users set up a Make webhook trigger and connect to 1000+ apps.

### Custom Integration

Developers can build custom integrations by:
1. Setting up an HTTPS endpoint
2. Configuring it in your app's webhook settings
3. Verifying signatures
4. Processing event data
