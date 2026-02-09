-- =====================================================
-- Tags assignments + Email templates + Workflows
-- =====================================================

CREATE TABLE IF NOT EXISTS tag_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  scope TEXT NOT NULL CHECK (scope IN ('lead', 'client', 'inspection', 'invoice', 'job', 'payment', 'service', 'template')),
  entity_id UUID NOT NULL,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, scope, entity_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_tag_assignments_tenant ON tag_assignments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tag_assignments_scope ON tag_assignments(tenant_id, scope);
CREATE INDEX IF NOT EXISTS idx_tag_assignments_entity ON tag_assignments(entity_id);

CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  category TEXT,
  description TEXT,
  is_system BOOLEAN NOT NULL DEFAULT FALSE,
  system_key TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, name),
  UNIQUE(tenant_id, system_key)
);

CREATE INDEX IF NOT EXISTS idx_email_templates_tenant ON email_templates(tenant_id);
CREATE INDEX IF NOT EXISTS idx_email_templates_category ON email_templates(tenant_id, category);

CREATE TABLE IF NOT EXISTS workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  trigger_scope TEXT NOT NULL CHECK (trigger_scope IN ('lead', 'client', 'inspection', 'invoice', 'job', 'payment', 'service', 'template')),
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('tag_added', 'tag_removed', 'status_changed', 'event')),
  trigger_tag_id UUID REFERENCES tags(id) ON DELETE SET NULL,
  conditions JSONB DEFAULT '{}',
  actions JSONB DEFAULT '[]',
  delay_minutes INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_system BOOLEAN NOT NULL DEFAULT FALSE,
  system_key TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, system_key)
);

CREATE INDEX IF NOT EXISTS idx_workflows_tenant ON workflows(tenant_id);
CREATE INDEX IF NOT EXISTS idx_workflows_trigger_scope ON workflows(tenant_id, trigger_scope);
CREATE INDEX IF NOT EXISTS idx_workflows_trigger_tag ON workflows(trigger_tag_id);

CREATE TABLE IF NOT EXISTS workflow_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  scope TEXT NOT NULL CHECK (scope IN ('lead', 'client', 'inspection', 'invoice', 'job', 'payment', 'service', 'template')),
  entity_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  result JSONB DEFAULT '{}',
  error TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_workflow_runs_tenant ON workflow_runs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_workflow_runs_workflow ON workflow_runs(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_runs_status ON workflow_runs(status);

ALTER TABLE tag_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view tag assignments" ON tag_assignments FOR SELECT USING (is_tenant_member(tenant_id));
CREATE POLICY "Members can manage tag assignments" ON tag_assignments FOR ALL USING (is_tenant_member(tenant_id));

CREATE POLICY "Members can view email templates" ON email_templates FOR SELECT USING (is_tenant_member(tenant_id));
CREATE POLICY "Members can manage email templates" ON email_templates FOR ALL USING (is_tenant_member(tenant_id));

CREATE POLICY "Members can view workflows" ON workflows FOR SELECT USING (is_tenant_member(tenant_id));
CREATE POLICY "Members can manage workflows" ON workflows FOR ALL USING (is_tenant_member(tenant_id));

CREATE POLICY "Members can view workflow runs" ON workflow_runs FOR SELECT USING (is_tenant_member(tenant_id));
CREATE POLICY "Members can manage workflow runs" ON workflow_runs FOR ALL USING (is_tenant_member(tenant_id));
