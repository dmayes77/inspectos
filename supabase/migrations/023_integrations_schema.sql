-- =====================================================
-- Integrations Schema
-- =====================================================

CREATE TABLE integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- Integration type and provider
  type TEXT NOT NULL CHECK (type IN ('email', 'sms', 'payments', 'accounting', 'payroll', 'calendar')),
  provider TEXT NOT NULL, -- e.g., 'sendgrid', 'twilio', 'stripe', 'quickbooks', 'gusto'

  -- Status
  status TEXT NOT NULL DEFAULT 'disconnected' CHECK (status IN ('connected', 'disconnected', 'error', 'pending')),

  -- Configuration (stored as JSON, sensitive data should be encrypted)
  config JSONB DEFAULT '{}'::jsonb,

  -- Metadata
  connected_at TIMESTAMPTZ,
  last_sync_at TIMESTAMPTZ,
  error_message TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Only one integration per type per tenant
  UNIQUE(tenant_id, type)
);

CREATE INDEX idx_integrations_tenant ON integrations(tenant_id);
CREATE INDEX idx_integrations_type ON integrations(tenant_id, type);

-- Trigger for updated_at
CREATE TRIGGER update_integrations_updated_at
  BEFORE UPDATE ON integrations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS policies
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view integrations" ON integrations
  FOR SELECT USING (is_tenant_member(tenant_id));

CREATE POLICY "Admins can manage integrations" ON integrations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM tenant_members
      WHERE tenant_id = integrations.tenant_id
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );
