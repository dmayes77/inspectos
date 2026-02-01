import { WebhookEvent, RetryStrategy } from "../validations/webhook";

export interface Webhook {
  id: string;
  tenant_id: string;
  name: string;
  url: string;
  description: string | null;
  events: WebhookEvent[];
  secret: string | null;
  headers: Record<string, string>;
  status: "active" | "paused" | "failed";
  retry_strategy: RetryStrategy;
  failure_count: number;
  last_triggered_at: string | null;
  last_success_at: string | null;
  last_error: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface WebhookDelivery {
  id: string;
  webhook_id: string;
  event_type: WebhookEvent;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload: any;
  response_status: number | null;
  response_body: string | null;
  response_time_ms: number | null;
  error: string | null;
  attempt_number: number;
  delivered_at: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface WebhookPayload<T = any> {
  event: WebhookEvent;
  timestamp: string;
  tenant_id: string;
  data: T;
  metadata: {
    webhook_id: string;
    delivery_id: string;
  };
}

export interface WebhookStats {
  total_deliveries: number;
  successful_deliveries: number;
  failed_deliveries: number;
  success_rate: number;
  average_response_time: number;
  last_delivery_at: string | null;
}
