-- =====================================================
-- CRM Enhancements: lead details + client metrics
-- =====================================================

ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS type TEXT,
  ADD COLUMN IF NOT EXISTS inspections_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_inspection_date DATE,
  ADD COLUMN IF NOT EXISTS total_spent NUMERIC(10, 2) NOT NULL DEFAULT 0;

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS service_name TEXT,
  ADD COLUMN IF NOT EXISTS requested_date DATE,
  ADD COLUMN IF NOT EXISTS estimated_value NUMERIC(10, 2);

CREATE INDEX IF NOT EXISTS idx_leads_requested_date ON leads(tenant_id, requested_date);
CREATE INDEX IF NOT EXISTS idx_clients_last_inspection ON clients(tenant_id, last_inspection_date);
