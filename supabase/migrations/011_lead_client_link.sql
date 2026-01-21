-- =====================================================
-- Leads link to clients after conversion
-- =====================================================

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_leads_client ON leads(tenant_id, client_id);
