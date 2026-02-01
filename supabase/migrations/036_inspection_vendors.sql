-- Migration: Add inspection_vendors join table
CREATE TABLE IF NOT EXISTS inspection_vendors (
  inspection_id UUID REFERENCES inspections(id) ON DELETE CASCADE,
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (inspection_id, vendor_id)
);

CREATE INDEX IF NOT EXISTS idx_inspection_vendors_inspection ON inspection_vendors(inspection_id);
CREATE INDEX IF NOT EXISTS idx_inspection_vendors_vendor ON inspection_vendors(vendor_id);

-- Enable row-level security if needed
ALTER TABLE inspection_vendors ENABLE ROW LEVEL SECURITY;

-- Policy: allow tenant members to view and manage
CREATE POLICY "Members can view inspection_vendors" ON inspection_vendors FOR SELECT USING (is_tenant_member((SELECT tenant_id FROM inspections WHERE id = inspection_id)));
CREATE POLICY "Members can manage inspection_vendors" ON inspection_vendors FOR ALL USING (is_tenant_member((SELECT tenant_id FROM inspections WHERE id = inspection_id)));
