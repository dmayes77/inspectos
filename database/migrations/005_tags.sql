-- =====================================================
-- Tags and tag scopes
-- =====================================================

CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  scope TEXT NOT NULL CHECK (scope IN ('lead', 'client', 'inspection', 'invoice', 'job', 'service', 'template')),
  tag_type TEXT NOT NULL DEFAULT 'custom' CHECK (tag_type IN ('stage', 'status', 'segment', 'source', 'priority', 'custom')),
  description TEXT,
  color TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, scope, name)
);

CREATE INDEX IF NOT EXISTS idx_tags_tenant ON tags(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tags_scope ON tags(tenant_id, scope);
CREATE INDEX IF NOT EXISTS idx_tags_type ON tags(tenant_id, tag_type);

ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can view tags" ON tags FOR SELECT USING (is_tenant_member(tenant_id));
CREATE POLICY "Members can manage tags" ON tags FOR ALL USING (is_tenant_member(tenant_id));
