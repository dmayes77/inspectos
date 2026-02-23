-- Migration: Webhooks System
-- This enables users to configure webhooks for integration with external services like Zapier

-- Create webhooks table
CREATE TABLE webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  events TEXT[] NOT NULL, -- Array of event types to subscribe to
  secret VARCHAR(255), -- Optional signing secret for HMAC verification
  headers JSONB DEFAULT '{}'::jsonb, -- Custom headers to include in requests
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'failed')),
  retry_strategy JSONB DEFAULT '{"max_attempts": 3, "backoff": "exponential", "timeout": 30000}'::jsonb,
  failure_count INTEGER DEFAULT 0,
  last_triggered_at TIMESTAMPTZ,
  last_success_at TIMESTAMPTZ,
  last_error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

-- Create indexes for webhooks
CREATE INDEX idx_webhooks_tenant ON webhooks(tenant_id);
CREATE INDEX idx_webhooks_status ON webhooks(status);
CREATE INDEX idx_webhooks_events ON webhooks USING GIN(events);

-- Create webhook_deliveries table for logging and debugging
CREATE TABLE webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID NOT NULL REFERENCES webhooks(id) ON DELETE CASCADE,
  event_type VARCHAR(100) NOT NULL,
  payload JSONB NOT NULL,
  response_status INTEGER,
  response_body TEXT,
  response_time_ms INTEGER,
  error TEXT,
  attempt_number INTEGER DEFAULT 1,
  delivered_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for webhook deliveries
CREATE INDEX idx_webhook_deliveries_webhook ON webhook_deliveries(webhook_id);
CREATE INDEX idx_webhook_deliveries_event ON webhook_deliveries(event_type);
CREATE INDEX idx_webhook_deliveries_delivered_at ON webhook_deliveries(delivered_at DESC);
CREATE INDEX idx_webhook_deliveries_status ON webhook_deliveries(response_status) WHERE response_status IS NOT NULL;

-- Add comments for documentation
COMMENT ON TABLE webhooks IS 'Webhook configurations for external integrations like Zapier, Make, and custom applications';
COMMENT ON COLUMN webhooks.events IS 'Array of event types this webhook subscribes to (e.g., order.created, inspection.completed)';
COMMENT ON COLUMN webhooks.secret IS 'Secret key used for HMAC-SHA256 signing of webhook payloads';
COMMENT ON COLUMN webhooks.headers IS 'Custom HTTP headers to include in webhook requests (e.g., Authorization, API-Key)';
COMMENT ON COLUMN webhooks.retry_strategy IS 'JSON configuration for retry behavior: max_attempts, backoff strategy, timeout';
COMMENT ON COLUMN webhooks.failure_count IS 'Number of consecutive delivery failures. Auto-pauses webhook after threshold.';

COMMENT ON TABLE webhook_deliveries IS 'Log of webhook delivery attempts for debugging and monitoring';
COMMENT ON COLUMN webhook_deliveries.payload IS 'Complete payload sent to the webhook endpoint';
COMMENT ON COLUMN webhook_deliveries.response_time_ms IS 'Time in milliseconds for the webhook endpoint to respond';

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_webhooks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER webhooks_updated_at
BEFORE UPDATE ON webhooks
FOR EACH ROW
EXECUTE FUNCTION update_webhooks_updated_at();

-- Function to auto-pause webhook after consecutive failures
CREATE OR REPLACE FUNCTION check_webhook_failures()
RETURNS TRIGGER AS $$
BEGIN
  -- If this delivery failed and webhook has 10+ consecutive failures, pause it
  IF NEW.error IS NOT NULL THEN
    UPDATE webhooks
    SET status = 'failed',
        last_error = NEW.error
    WHERE id = NEW.webhook_id
      AND status = 'active'
      AND failure_count >= 10;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to check for repeated failures
CREATE TRIGGER webhook_failure_check
AFTER INSERT ON webhook_deliveries
FOR EACH ROW
EXECUTE FUNCTION check_webhook_failures();
