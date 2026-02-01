# Webhook Event System Architecture

## Overview
This document outlines the architecture for the webhook event system that enables users to integrate with external services like Zapier, Make, and custom applications.

## Core Components

### 1. Database Schema

#### `webhooks` Table
```sql
CREATE TABLE webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  events TEXT[] NOT NULL, -- Array of event types to subscribe to
  secret VARCHAR(255), -- Optional signing secret
  headers JSONB, -- Custom headers to include
  status VARCHAR(20) DEFAULT 'active', -- active, paused, failed
  retry_strategy JSONB DEFAULT '{"max_attempts": 3, "backoff": "exponential"}',
  failure_count INTEGER DEFAULT 0,
  last_triggered_at TIMESTAMPTZ,
  last_error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id)
);

CREATE INDEX idx_webhooks_tenant ON webhooks(tenant_id);
CREATE INDEX idx_webhooks_status ON webhooks(status);
```

#### `webhook_deliveries` Table (for debugging/logs)
```sql
CREATE TABLE webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID NOT NULL REFERENCES webhooks(id) ON DELETE CASCADE,
  event_type VARCHAR(100) NOT NULL,
  payload JSONB NOT NULL,
  response_status INTEGER,
  response_body TEXT,
  error TEXT,
  attempt_number INTEGER DEFAULT 1,
  delivered_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_webhook_deliveries_webhook ON webhook_deliveries(webhook_id);
CREATE INDEX idx_webhook_deliveries_event ON webhook_deliveries(event_type);
CREATE INDEX idx_webhook_deliveries_delivered_at ON webhook_deliveries(delivered_at);
```

### 2. Event Types

#### Core Events
- `order.created` - New order created
- `order.updated` - Order details updated
- `order.completed` - Order marked as completed
- `order.cancelled` - Order cancelled

#### Inspection Events
- `inspection.created` - New inspection created
- `inspection.started` - Inspector started inspection
- `inspection.completed` - Inspection finished
- `inspection.submitted` - Inspection submitted for review

#### Client Events
- `client.created` - New client added
- `client.updated` - Client details updated

#### Invoice Events
- `invoice.created` - Invoice generated
- `invoice.paid` - Invoice payment received
- `invoice.overdue` - Invoice past due date

#### Schedule Events
- `schedule.created` - Inspection scheduled
- `schedule.updated` - Schedule modified
- `schedule.cancelled` - Appointment cancelled

### 3. Payload Structure

All webhook payloads follow this structure:
```typescript
{
  "event": "order.created",
  "timestamp": "2024-02-01T10:30:00Z",
  "tenant_id": "uuid",
  "data": {
    // Event-specific data
  },
  "metadata": {
    "webhook_id": "uuid",
    "delivery_id": "uuid"
  }
}
```

Example: `order.created` payload
```json
{
  "event": "order.created",
  "timestamp": "2024-02-01T10:30:00Z",
  "tenant_id": "550e8400-e29b-41d4-a716-446655440000",
  "data": {
    "order": {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "order_number": "ORD-2024-001",
      "status": "pending",
      "client": {
        "id": "uuid",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "property": {
        "id": "uuid",
        "address": "123 Main St, City, State 12345"
      },
      "services": [
        {
          "id": "uuid",
          "name": "Home Inspection",
          "price": 450.00
        }
      ],
      "scheduled_date": "2024-02-05",
      "scheduled_time": "10:00",
      "total": 450.00
    }
  },
  "metadata": {
    "webhook_id": "webhook-uuid",
    "delivery_id": "delivery-uuid"
  }
}
```

### 4. Security

#### Webhook Signing
- Generate HMAC-SHA256 signature of payload
- Include in `X-Webhook-Signature` header
- Format: `sha256=<signature>`
- Users can verify webhook authenticity

#### Authentication
- Support for custom headers (e.g., Authorization, API-Key)
- Optional basic auth via URL

### 5. Delivery Mechanism

#### Queue-Based Processing
```typescript
// Edge function or API route triggers webhook
await queueWebhook({
  eventType: 'order.created',
  tenantId: 'uuid',
  data: orderData
});
```

#### Retry Strategy
```typescript
{
  "max_attempts": 3,
  "backoff": "exponential", // 1s, 2s, 4s
  "timeout": 30000 // 30 seconds
}
```

#### Failure Handling
- After max retries, mark webhook as `failed`
- Store error in `last_error` column
- Increment `failure_count`
- Auto-pause webhook after 10 consecutive failures
- Send notification to user about webhook failures

### 6. Rate Limiting
- Per webhook: 100 requests per minute
- Per tenant: 1000 requests per minute
- Use sliding window algorithm

## API Endpoints

### Webhook Management
```
POST   /api/admin/webhooks          - Create webhook
GET    /api/admin/webhooks          - List webhooks
GET    /api/admin/webhooks/:id      - Get webhook details
PUT    /api/admin/webhooks/:id      - Update webhook
DELETE /api/admin/webhooks/:id      - Delete webhook
POST   /api/admin/webhooks/:id/test - Test webhook with sample payload
```

### Webhook Deliveries (Logs)
```
GET    /api/admin/webhooks/:id/deliveries - List delivery logs
GET    /api/admin/webhooks/deliveries/:id - Get delivery details
POST   /api/admin/webhooks/deliveries/:id/retry - Retry failed delivery
```

## Implementation Phases

### Phase 1: Core Infrastructure (Week 1)
- [ ] Database migrations
- [ ] Webhook CRUD API endpoints
- [ ] Basic webhook configuration UI
- [ ] Manual webhook testing

### Phase 2: Event Integration (Week 2)
- [ ] Event emitter service
- [ ] Integrate with order lifecycle
- [ ] Integrate with inspection lifecycle
- [ ] Payload builders for each event type

### Phase 3: Delivery & Reliability (Week 3)
- [ ] Queue-based delivery system
- [ ] Retry logic with exponential backoff
- [ ] Webhook signing
- [ ] Delivery logs and debugging UI

### Phase 4: Advanced Features (Week 4)
- [ ] Webhook templates (common integrations)
- [ ] Event filtering
- [ ] Batch webhooks
- [ ] Webhook health monitoring
- [ ] Auto-pause on failures

## UI Components

### 1. Webhooks List Page (`/admin/automations/webhooks`)
- Table showing all configured webhooks
- Status badges (active, paused, failed)
- Quick actions (test, pause, delete)
- "Create Webhook" button

### 2. Create/Edit Webhook Form
- Name and description
- Webhook URL
- Event selection (checkboxes)
- Custom headers configuration
- Secret key (auto-generated or custom)
- Test webhook button
- Save & activate

### 3. Webhook Details Page
- Overview (name, URL, status, events)
- Delivery logs table
- Recent deliveries chart
- Quick test button
- Edit/Delete actions

### 4. Delivery Logs
- Timestamp
- Event type
- HTTP status
- Response time
- Payload preview
- Retry button for failed deliveries

## Integration Examples

### Zapier Integration
1. User creates a Zap
2. Zapier provides webhook URL
3. User configures webhook in Inspectos with that URL
4. Selects events (e.g., `inspection.completed`)
5. Zapier receives data and maps to other apps

### Make (Integromat)
Similar flow to Zapier with webhook trigger

### Custom Integration
Developers can:
1. Set up webhook endpoint
2. Verify signature using provided secret
3. Process event data
4. Return 200 OK to acknowledge

## Monitoring & Analytics

### Webhook Health Dashboard
- Total webhooks (active/paused/failed)
- Delivery success rate
- Average response time
- Events triggered (last 24h/7d/30d)
- Failed deliveries requiring attention

### Per-Webhook Metrics
- Success rate (last 100 deliveries)
- Average response time
- Last successful delivery
- Failure streak

## Code Examples

### Triggering a Webhook
```typescript
// In your order creation logic
await triggerWebhookEvent('order.created', tenantId, {
  order: serializedOrder
});
```

### Event Emitter Service
```typescript
// lib/webhooks/event-emitter.ts
export async function triggerWebhookEvent(
  eventType: string,
  tenantId: string,
  data: any
) {
  // Find all active webhooks for this tenant subscribed to this event
  const webhooks = await getActiveWebhooksForEvent(tenantId, eventType);

  for (const webhook of webhooks) {
    await queueWebhookDelivery({
      webhookId: webhook.id,
      eventType,
      payload: buildPayload(eventType, data, webhook)
    });
  }
}
```

### Webhook Delivery Worker
```typescript
// lib/webhooks/delivery-worker.ts
export async function deliverWebhook(delivery: WebhookDelivery) {
  const { webhook, payload } = delivery;

  const signature = generateSignature(payload, webhook.secret);

  try {
    const response = await fetch(webhook.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': signature,
        'X-Webhook-Event': delivery.eventType,
        ...webhook.headers
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(30000)
    });

    await logDelivery({
      webhookId: webhook.id,
      deliveryId: delivery.id,
      status: response.status,
      responseBody: await response.text(),
      success: response.ok
    });

    if (!response.ok && delivery.attemptNumber < webhook.retryStrategy.maxAttempts) {
      await scheduleRetry(delivery);
    }
  } catch (error) {
    await logDelivery({
      webhookId: webhook.id,
      deliveryId: delivery.id,
      error: error.message,
      success: false
    });

    if (delivery.attemptNumber < webhook.retryStrategy.maxAttempts) {
      await scheduleRetry(delivery);
    }
  }
}
```

## Security Considerations

1. **Rate Limiting**: Prevent abuse
2. **Signature Verification**: Ensure webhook authenticity
3. **HTTPS Only**: Require secure URLs
4. **Timeout**: Prevent hanging requests
5. **IP Allowlisting**: Optional feature for enterprise
6. **Audit Logging**: Track webhook configuration changes

## Best Practices for Users

1. Always verify webhook signatures
2. Return 2xx status code quickly
3. Process webhook asynchronously
4. Implement idempotency (handle duplicate deliveries)
5. Monitor webhook health regularly
6. Use descriptive names for webhooks
7. Test webhooks before activating

## Future Enhancements

- [ ] Webhook templates for popular integrations
- [ ] GraphQL subscriptions
- [ ] Conditional webhooks (filters)
- [ ] Batch event delivery
- [ ] Webhook marketplace
- [ ] Real-time webhook testing UI
- [ ] Webhook analytics dashboard
- [ ] Multi-region webhook delivery
