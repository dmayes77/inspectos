-- =====================================================
-- Orders Schema - Replaces Jobs as central business unit
-- Order (1) -> Inspection (1) -> Services (many)
-- =====================================================

-- Orders table (replaces jobs as the business/scheduling unit)
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- Identification
  order_number TEXT NOT NULL, -- "ORD-2024-0001"

  -- People
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  agent_id UUID, -- Will reference agents table after 015 migration
  inspector_id UUID REFERENCES profiles(id) ON DELETE SET NULL,

  -- Property
  property_id UUID NOT NULL REFERENCES properties(id),

  -- Status workflow
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',        -- Order received, not scheduled
    'scheduled',      -- Appointment confirmed
    'in_progress',    -- Inspection underway
    'pending_report', -- Inspection done, generating report
    'delivered',      -- Report sent to client
    'completed',      -- Fully closed (paid + delivered)
    'cancelled'
  )),

  -- Scheduling
  scheduled_date DATE,
  scheduled_time TIME,
  duration_minutes INTEGER DEFAULT 120,
  completed_at TIMESTAMPTZ,

  -- Financial
  subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
  discount NUMERIC(10,2) NOT NULL DEFAULT 0,
  tax NUMERIC(10,2) NOT NULL DEFAULT 0,
  total NUMERIC(10,2) NOT NULL DEFAULT 0,
  payment_status TEXT NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN (
    'unpaid', 'partial', 'paid', 'refunded'
  )),

  -- Report delivery
  report_delivered_at TIMESTAMPTZ,

  -- Source/tracking
  source TEXT, -- 'booking', 'phone', 'agent_referral', 'website', 'repeat_client'

  -- Notes
  internal_notes TEXT,
  client_notes TEXT, -- Notes visible to client in portal

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(tenant_id, order_number)
);

CREATE INDEX idx_orders_tenant ON orders(tenant_id);
CREATE INDEX idx_orders_status ON orders(tenant_id, status);
CREATE INDEX idx_orders_client ON orders(client_id);
CREATE INDEX idx_orders_inspector ON orders(inspector_id);
CREATE INDEX idx_orders_property ON orders(property_id);
CREATE INDEX idx_orders_scheduled ON orders(scheduled_date);
CREATE INDEX idx_orders_number ON orders(tenant_id, order_number);
CREATE INDEX idx_orders_payment_status ON orders(tenant_id, payment_status);

-- Inspection services (multi-service per inspection)
-- Each service has its own template and can be tracked independently
CREATE TABLE inspection_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id UUID NOT NULL REFERENCES inspections(id) ON DELETE CASCADE,
  service_id UUID REFERENCES services(id) ON DELETE SET NULL,
  template_id UUID REFERENCES templates(id), -- Template for this service
  name TEXT NOT NULL, -- Cached service name at time of order
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  duration_minutes INTEGER,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',      -- Not started
    'in_progress',  -- Currently being performed
    'completed',    -- Done
    'skipped'       -- Skipped (e.g., not accessible)
  )),
  sort_order INTEGER DEFAULT 0,
  notes TEXT, -- Service-specific notes
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_inspection_services_inspection ON inspection_services(inspection_id);
CREATE INDEX idx_inspection_services_service ON inspection_services(service_id);
CREATE INDEX idx_inspection_services_template ON inspection_services(template_id);

-- Update inspections to reference orders (1:1 relationship)
ALTER TABLE inspections ADD COLUMN order_id UUID REFERENCES orders(id) ON DELETE CASCADE;
CREATE INDEX idx_inspections_order ON inspections(order_id);

-- Update answers to optionally link to inspection_service for multi-service support
ALTER TABLE answers ADD COLUMN inspection_service_id UUID REFERENCES inspection_services(id) ON DELETE CASCADE;
CREATE INDEX idx_answers_service ON answers(inspection_service_id);

-- Update findings to optionally link to inspection_service
ALTER TABLE findings ADD COLUMN inspection_service_id UUID REFERENCES inspection_services(id) ON DELETE CASCADE;
CREATE INDEX idx_findings_service ON findings(inspection_service_id);

-- Update invoices to reference orders
ALTER TABLE invoices ADD COLUMN order_id UUID REFERENCES orders(id) ON DELETE SET NULL;
CREATE INDEX idx_invoices_order ON invoices(order_id);

-- Update documents to reference orders
ALTER TABLE documents ADD COLUMN order_id UUID REFERENCES orders(id) ON DELETE SET NULL;
CREATE INDEX idx_documents_order ON documents(order_id);

-- Function to generate order number
CREATE OR REPLACE FUNCTION generate_order_number(p_tenant_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_number TEXT;
  v_candidate TEXT;
BEGIN
  LOOP
    v_number := LPAD(FLOOR(RANDOM() * 100000000)::INT::TEXT, 8, '0');
    v_candidate := 'ORD-' || SUBSTRING(v_number, 1, 4) || '-' || SUBSTRING(v_number, 5, 4);

    EXIT WHEN NOT EXISTS (
      SELECT 1
      FROM orders
      WHERE tenant_id = p_tenant_id
        AND order_number = v_candidate
    );
  END LOOP;

  RETURN v_candidate;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate order number
CREATE OR REPLACE FUNCTION set_order_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
    NEW.order_number := generate_order_number(NEW.tenant_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_order_number
  BEFORE INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION set_order_number();

-- Auto-update updated_at triggers
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_inspection_services_updated_at
  BEFORE UPDATE ON inspection_services
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Enable RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspection_services ENABLE ROW LEVEL SECURITY;

-- RLS Policies for orders
CREATE POLICY "Members can view orders" ON orders
  FOR SELECT USING (is_tenant_member(tenant_id));

CREATE POLICY "Members can insert orders" ON orders
  FOR INSERT WITH CHECK (is_tenant_member(tenant_id));

CREATE POLICY "Members can update orders" ON orders
  FOR UPDATE USING (is_tenant_member(tenant_id));

CREATE POLICY "Admins can delete orders" ON orders
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM tenant_members
      WHERE tenant_id = orders.tenant_id
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- RLS Policies for inspection_services
CREATE POLICY "Members can view inspection services" ON inspection_services
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM inspections i
      WHERE i.id = inspection_id
      AND is_tenant_member(i.tenant_id)
    )
  );

CREATE POLICY "Inspectors can manage inspection services" ON inspection_services
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM inspections i
      WHERE i.id = inspection_id
      AND (i.inspector_id = auth.uid() OR EXISTS (
        SELECT 1 FROM tenant_members
        WHERE tenant_id = i.tenant_id
        AND user_id = auth.uid()
        AND role IN ('owner', 'admin')
      ))
    )
  );
