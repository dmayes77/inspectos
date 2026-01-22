-- =====================================================
-- Agencies & Agents Schema
-- Real estate agencies and their agents who refer inspections
-- =====================================================

-- Agencies (real estate brokerages)
CREATE TABLE agencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- Agency details
  name TEXT NOT NULL,
  license_number TEXT,

  -- Contact info
  email TEXT,
  phone TEXT,
  website TEXT,

  -- Address
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,

  -- Status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  notes TEXT,

  -- Metrics (denormalized for performance)
  total_referrals INTEGER NOT NULL DEFAULT 0,
  total_revenue NUMERIC(10,2) NOT NULL DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_agencies_tenant ON agencies(tenant_id);
CREATE INDEX idx_agencies_status ON agencies(tenant_id, status);
CREATE INDEX idx_agencies_name ON agencies(tenant_id, name);

-- Agents (real estate agents)
CREATE TABLE agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- Agency relationship (nullable - independent agents exist)
  agency_id UUID REFERENCES agencies(id) ON DELETE SET NULL,

  -- Agent details
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  license_number TEXT,

  -- Portal access via magic links
  magic_link_token TEXT,
  magic_link_expires_at TIMESTAMPTZ,
  last_portal_access_at TIMESTAMPTZ,

  -- Status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  notes TEXT,

  -- Preferences
  preferred_report_format TEXT DEFAULT 'pdf' CHECK (preferred_report_format IN ('pdf', 'html', 'both')),
  notify_on_schedule BOOLEAN NOT NULL DEFAULT TRUE,
  notify_on_complete BOOLEAN NOT NULL DEFAULT TRUE,
  notify_on_report BOOLEAN NOT NULL DEFAULT TRUE,

  -- Metrics (denormalized)
  total_referrals INTEGER NOT NULL DEFAULT 0,
  total_revenue NUMERIC(10,2) NOT NULL DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_agents_tenant ON agents(tenant_id);
CREATE INDEX idx_agents_agency ON agents(agency_id);
CREATE INDEX idx_agents_email ON agents(tenant_id, email);
CREATE INDEX idx_agents_status ON agents(tenant_id, status);
CREATE INDEX idx_agents_magic_link ON agents(magic_link_token) WHERE magic_link_token IS NOT NULL;
CREATE INDEX idx_agents_name ON agents(tenant_id, name);

-- Add foreign key for orders.agent_id now that agents table exists
ALTER TABLE orders
  ADD CONSTRAINT orders_agent_id_fkey
  FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE SET NULL;

CREATE INDEX idx_orders_agent ON orders(agent_id);

-- Extend clients table for portal access
ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS magic_link_token TEXT,
  ADD COLUMN IF NOT EXISTS magic_link_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_portal_access_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS portal_access_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS preferred_report_format TEXT DEFAULT 'pdf',
  ADD COLUMN IF NOT EXISTS notify_on_schedule BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS notify_on_complete BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS notify_on_report BOOLEAN NOT NULL DEFAULT TRUE;

CREATE INDEX idx_clients_magic_link ON clients(magic_link_token) WHERE magic_link_token IS NOT NULL;

-- Portal sessions table for tracking magic link sessions
CREATE TABLE portal_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- Polymorphic: either client or agent
  session_type TEXT NOT NULL CHECK (session_type IN ('client', 'agent')),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,

  -- Session data
  token TEXT NOT NULL UNIQUE,
  ip_address TEXT,
  user_agent TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  last_accessed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Ensure only one type is set
  CHECK (
    (session_type = 'client' AND client_id IS NOT NULL AND agent_id IS NULL) OR
    (session_type = 'agent' AND agent_id IS NOT NULL AND client_id IS NULL)
  )
);

CREATE INDEX idx_portal_sessions_token ON portal_sessions(token);
CREATE INDEX idx_portal_sessions_client ON portal_sessions(client_id);
CREATE INDEX idx_portal_sessions_agent ON portal_sessions(agent_id);
CREATE INDEX idx_portal_sessions_expires ON portal_sessions(expires_at);

-- Function to generate magic link token
CREATE OR REPLACE FUNCTION generate_magic_link_token()
RETURNS TEXT AS $$
BEGIN
  RETURN encode(gen_random_bytes(32), 'hex');
END;
$$ LANGUAGE plpgsql;

-- Function to clean up expired portal sessions
CREATE OR REPLACE FUNCTION cleanup_expired_portal_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM portal_sessions WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Auto-update updated_at triggers
CREATE TRIGGER update_agencies_updated_at
  BEFORE UPDATE ON agencies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_agents_updated_at
  BEFORE UPDATE ON agents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Enable RLS
ALTER TABLE agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE portal_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for agencies
CREATE POLICY "Members can view agencies" ON agencies
  FOR SELECT USING (is_tenant_member(tenant_id));

CREATE POLICY "Members can insert agencies" ON agencies
  FOR INSERT WITH CHECK (is_tenant_member(tenant_id));

CREATE POLICY "Members can update agencies" ON agencies
  FOR UPDATE USING (is_tenant_member(tenant_id));

CREATE POLICY "Admins can delete agencies" ON agencies
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM tenant_members
      WHERE tenant_id = agencies.tenant_id
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- RLS Policies for agents
CREATE POLICY "Members can view agents" ON agents
  FOR SELECT USING (is_tenant_member(tenant_id));

CREATE POLICY "Members can insert agents" ON agents
  FOR INSERT WITH CHECK (is_tenant_member(tenant_id));

CREATE POLICY "Members can update agents" ON agents
  FOR UPDATE USING (is_tenant_member(tenant_id));

CREATE POLICY "Admins can delete agents" ON agents
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM tenant_members
      WHERE tenant_id = agents.tenant_id
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- Agents can view their own record via magic link
CREATE POLICY "Agents can view own via magic link" ON agents
  FOR SELECT USING (
    magic_link_token IS NOT NULL
    AND magic_link_expires_at > NOW()
  );

-- RLS Policies for portal_sessions
CREATE POLICY "Members can view portal sessions" ON portal_sessions
  FOR SELECT USING (is_tenant_member(tenant_id));

CREATE POLICY "Members can manage portal sessions" ON portal_sessions
  FOR ALL USING (is_tenant_member(tenant_id));

-- Clients can view their own orders via portal session
CREATE POLICY "Clients can view own orders via portal" ON orders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM clients c
      WHERE c.id = orders.client_id
      AND c.magic_link_token IS NOT NULL
      AND c.magic_link_expires_at > NOW()
    )
  );

-- Agents can view orders they referred via portal
CREATE POLICY "Agents can view referred orders via portal" ON orders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM agents a
      WHERE a.id = orders.agent_id
      AND a.magic_link_token IS NOT NULL
      AND a.magic_link_expires_at > NOW()
    )
  );
