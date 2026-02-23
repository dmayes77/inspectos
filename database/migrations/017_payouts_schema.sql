-- =====================================================
-- Payouts Schema - Inspector Compensation Tracking
-- Calculated from Orders and Services
-- =====================================================

-- Pay rules define how inspectors are compensated
CREATE TABLE pay_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- Rule identification
  name TEXT NOT NULL,
  description TEXT,

  -- Rule type
  rule_type TEXT NOT NULL DEFAULT 'percentage' CHECK (rule_type IN (
    'percentage',    -- Percentage of service price
    'flat_rate',     -- Flat amount per service
    'hourly'         -- Hourly rate
  )),

  -- Values
  percentage NUMERIC(5,2), -- For percentage type (e.g., 50.00 = 50%)
  flat_amount NUMERIC(10,2), -- For flat_rate type
  hourly_rate NUMERIC(10,2), -- For hourly type

  -- Applicability
  applies_to TEXT NOT NULL DEFAULT 'all' CHECK (applies_to IN (
    'all',          -- All services
    'specific'      -- Specific services only
  )),

  -- Status
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pay_rules_tenant ON pay_rules(tenant_id);
CREATE INDEX idx_pay_rules_active ON pay_rules(tenant_id, is_active);

-- Link pay rules to specific services
CREATE TABLE pay_rule_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pay_rule_id UUID NOT NULL REFERENCES pay_rules(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(pay_rule_id, service_id)
);

CREATE INDEX idx_pay_rule_services_rule ON pay_rule_services(pay_rule_id);
CREATE INDEX idx_pay_rule_services_service ON pay_rule_services(service_id);

-- Inspector pay rule assignments
CREATE TABLE inspector_pay_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  inspector_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  pay_rule_id UUID NOT NULL REFERENCES pay_rules(id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
  effective_to DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, inspector_id, pay_rule_id, effective_from)
);

CREATE INDEX idx_inspector_pay_rules_inspector ON inspector_pay_rules(inspector_id);
CREATE INDEX idx_inspector_pay_rules_tenant ON inspector_pay_rules(tenant_id);

-- Payouts track calculated earnings and payout status
CREATE TABLE payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  inspector_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Period
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,

  -- Amounts
  gross_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  deductions NUMERIC(10,2) NOT NULL DEFAULT 0,
  net_amount NUMERIC(10,2) NOT NULL DEFAULT 0,

  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',      -- Calculated but not yet paid
    'approved',     -- Approved for payment
    'processing',   -- Payment in progress
    'paid',         -- Payment completed
    'cancelled'     -- Cancelled
  )),

  -- Payment info
  paid_at TIMESTAMPTZ,
  payment_method TEXT,
  payment_reference TEXT,

  -- Notes
  notes TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payouts_tenant ON payouts(tenant_id);
CREATE INDEX idx_payouts_inspector ON payouts(inspector_id);
CREATE INDEX idx_payouts_status ON payouts(tenant_id, status);
CREATE INDEX idx_payouts_period ON payouts(period_start, period_end);

-- Payout line items link to orders/services
CREATE TABLE payout_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payout_id UUID NOT NULL REFERENCES payouts(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  inspection_service_id UUID REFERENCES inspection_services(id) ON DELETE SET NULL,

  -- Calculation details
  description TEXT NOT NULL,
  service_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  calculated_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  pay_rule_id UUID REFERENCES pay_rules(id) ON DELETE SET NULL,

  -- Date of work
  work_date DATE NOT NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payout_items_payout ON payout_items(payout_id);
CREATE INDEX idx_payout_items_order ON payout_items(order_id);

-- Auto-update updated_at triggers
CREATE TRIGGER update_pay_rules_updated_at
  BEFORE UPDATE ON pay_rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_inspector_pay_rules_updated_at
  BEFORE UPDATE ON inspector_pay_rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_payouts_updated_at
  BEFORE UPDATE ON payouts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Enable RLS
ALTER TABLE pay_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE pay_rule_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspector_pay_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE payout_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Members can view pay rules" ON pay_rules
  FOR SELECT USING (is_tenant_member(tenant_id));

CREATE POLICY "Admins can manage pay rules" ON pay_rules
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM tenant_members
      WHERE tenant_id = pay_rules.tenant_id
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Members can view pay rule services" ON pay_rule_services
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM pay_rules pr WHERE pr.id = pay_rule_id AND is_tenant_member(pr.tenant_id))
  );

CREATE POLICY "Admins can manage pay rule services" ON pay_rule_services
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM pay_rules pr
      JOIN tenant_members tm ON tm.tenant_id = pr.tenant_id
      WHERE pr.id = pay_rule_id
      AND tm.user_id = auth.uid()
      AND tm.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Members can view inspector pay rules" ON inspector_pay_rules
  FOR SELECT USING (is_tenant_member(tenant_id));

CREATE POLICY "Admins can manage inspector pay rules" ON inspector_pay_rules
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM tenant_members
      WHERE tenant_id = inspector_pay_rules.tenant_id
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Members can view payouts" ON payouts
  FOR SELECT USING (is_tenant_member(tenant_id));

-- Inspectors can view their own payouts
CREATE POLICY "Inspectors can view own payouts" ON payouts
  FOR SELECT USING (inspector_id = auth.uid());

CREATE POLICY "Admins can manage payouts" ON payouts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM tenant_members
      WHERE tenant_id = payouts.tenant_id
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Members can view payout items" ON payout_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM payouts p WHERE p.id = payout_id AND is_tenant_member(p.tenant_id))
  );

CREATE POLICY "Inspectors can view own payout items" ON payout_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM payouts p WHERE p.id = payout_id AND p.inspector_id = auth.uid())
  );

CREATE POLICY "Admins can manage payout items" ON payout_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM payouts p
      JOIN tenant_members tm ON tm.tenant_id = p.tenant_id
      WHERE p.id = payout_id
      AND tm.user_id = auth.uid()
      AND tm.role IN ('owner', 'admin')
    )
  );
