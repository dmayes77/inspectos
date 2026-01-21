-- =====================================================
-- ERP Extensions: Services, CRM, Billing, Ops
-- =====================================================

-- Ensure UUID extension exists
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -------------------------------
-- SERVICES & PACKAGES
-- -------------------------------
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'core' CHECK (category IN ('core', 'addon')),
  price NUMERIC(10, 2),
  duration_minutes INTEGER DEFAULT 60,
  template_id UUID REFERENCES templates(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_services_tenant ON services(tenant_id);
CREATE INDEX idx_services_category ON services(tenant_id, category);

CREATE TABLE packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10, 2),
  duration_minutes INTEGER DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_packages_tenant ON packages(tenant_id);

CREATE TABLE package_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(package_id, service_id)
);

CREATE INDEX idx_package_items_package ON package_items(package_id);

-- -------------------------------
-- CRM
-- -------------------------------
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  stage TEXT NOT NULL DEFAULT 'new' CHECK (stage IN ('new', 'qualified', 'quoted', 'scheduled', 'won', 'lost')),
  source TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_leads_tenant ON leads(tenant_id);
CREATE INDEX idx_leads_stage ON leads(tenant_id, stage);

CREATE TABLE lead_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_lead_events_lead ON lead_events(lead_id);

-- -------------------------------
-- BILLING
-- -------------------------------
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  inspection_id UUID REFERENCES inspections(id) ON DELETE SET NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'void')),
  total NUMERIC(10, 2) NOT NULL DEFAULT 0,
  issued_at TIMESTAMPTZ,
  due_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_invoices_tenant ON invoices(tenant_id);
CREATE INDEX idx_invoices_status ON invoices(tenant_id, status);

CREATE TABLE invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  service_id UUID REFERENCES services(id) ON DELETE SET NULL,
  description TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_invoice_items_invoice ON invoice_items(invoice_id);

CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  method TEXT NOT NULL DEFAULT 'card' CHECK (method IN ('card', 'ach', 'check', 'cash')),
  status TEXT NOT NULL DEFAULT 'succeeded' CHECK (status IN ('pending', 'succeeded', 'failed', 'refunded')),
  paid_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payments_invoice ON payments(invoice_id);

-- -------------------------------
-- DOCUMENTS
-- -------------------------------
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  inspection_id UUID REFERENCES inspections(id) ON DELETE SET NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  doc_type TEXT NOT NULL DEFAULT 'report',
  url TEXT NOT NULL,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_documents_tenant ON documents(tenant_id);

-- -------------------------------
-- SCHEDULING
-- -------------------------------
CREATE TABLE schedule_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  inspector_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  inspection_id UUID REFERENCES inspections(id) ON DELETE SET NULL,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'blocked', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_schedule_tenant ON schedule_blocks(tenant_id);
CREATE INDEX idx_schedule_inspector ON schedule_blocks(inspector_id, starts_at);

-- -------------------------------
-- OPERATIONS
-- -------------------------------
CREATE TABLE assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  serial TEXT,
  assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'maintenance', 'retired')),
  next_service_at DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_assets_tenant ON assets(tenant_id);

CREATE TABLE inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  sku TEXT,
  name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  reorder_level INTEGER NOT NULL DEFAULT 0,
  unit TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_inventory_tenant ON inventory(tenant_id);

CREATE TABLE vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  vendor_type TEXT,
  email TEXT,
  phone TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_vendors_tenant ON vendors(tenant_id);

-- -------------------------------
-- COMPLIANCE / AUDIT
-- -------------------------------
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id UUID,
  payload JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_tenant ON audit_logs(tenant_id);

-- -------------------------------
-- RLS ENABLEMENT
-- -------------------------------
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE package_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- -------------------------------
-- RLS POLICIES
-- -------------------------------
CREATE POLICY "Members can view services" ON services FOR SELECT USING (is_tenant_member(tenant_id));
CREATE POLICY "Members can manage services" ON services FOR ALL USING (is_tenant_member(tenant_id));

CREATE POLICY "Members can view packages" ON packages FOR SELECT USING (is_tenant_member(tenant_id));
CREATE POLICY "Members can manage packages" ON packages FOR ALL USING (is_tenant_member(tenant_id));
CREATE POLICY "Members can view package items" ON package_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM packages p WHERE p.id = package_id AND is_tenant_member(p.tenant_id))
);
CREATE POLICY "Members can manage package items" ON package_items FOR ALL USING (
  EXISTS (SELECT 1 FROM packages p WHERE p.id = package_id AND is_tenant_member(p.tenant_id))
);

CREATE POLICY "Members can view leads" ON leads FOR SELECT USING (is_tenant_member(tenant_id));
CREATE POLICY "Members can manage leads" ON leads FOR ALL USING (is_tenant_member(tenant_id));
CREATE POLICY "Members can view lead events" ON lead_events FOR SELECT USING (is_tenant_member(tenant_id));
CREATE POLICY "Members can manage lead events" ON lead_events FOR ALL USING (is_tenant_member(tenant_id));

CREATE POLICY "Members can view invoices" ON invoices FOR SELECT USING (is_tenant_member(tenant_id));
CREATE POLICY "Members can manage invoices" ON invoices FOR ALL USING (is_tenant_member(tenant_id));
CREATE POLICY "Members can view invoice items" ON invoice_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM invoices i WHERE i.id = invoice_id AND is_tenant_member(i.tenant_id))
);
CREATE POLICY "Members can manage invoice items" ON invoice_items FOR ALL USING (
  EXISTS (SELECT 1 FROM invoices i WHERE i.id = invoice_id AND is_tenant_member(i.tenant_id))
);
CREATE POLICY "Members can view payments" ON payments FOR SELECT USING (is_tenant_member(tenant_id));
CREATE POLICY "Members can manage payments" ON payments FOR ALL USING (is_tenant_member(tenant_id));

CREATE POLICY "Members can view documents" ON documents FOR SELECT USING (is_tenant_member(tenant_id));
CREATE POLICY "Members can manage documents" ON documents FOR ALL USING (is_tenant_member(tenant_id));

CREATE POLICY "Members can view schedules" ON schedule_blocks FOR SELECT USING (is_tenant_member(tenant_id));
CREATE POLICY "Members can manage schedules" ON schedule_blocks FOR ALL USING (is_tenant_member(tenant_id));

CREATE POLICY "Members can view assets" ON assets FOR SELECT USING (is_tenant_member(tenant_id));
CREATE POLICY "Members can manage assets" ON assets FOR ALL USING (is_tenant_member(tenant_id));

CREATE POLICY "Members can view inventory" ON inventory FOR SELECT USING (is_tenant_member(tenant_id));
CREATE POLICY "Members can manage inventory" ON inventory FOR ALL USING (is_tenant_member(tenant_id));

CREATE POLICY "Members can view vendors" ON vendors FOR SELECT USING (is_tenant_member(tenant_id));
CREATE POLICY "Members can manage vendors" ON vendors FOR ALL USING (is_tenant_member(tenant_id));

CREATE POLICY "Members can view audit logs" ON audit_logs FOR SELECT USING (is_tenant_member(tenant_id));
