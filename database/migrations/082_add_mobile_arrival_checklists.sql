-- =====================================================
-- Mobile Arrival Checklist Drafts (offline-first sync)
-- =====================================================

CREATE TABLE IF NOT EXISTS mobile_arrival_checklists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  checklist jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT mobile_arrival_checklists_unique UNIQUE (tenant_id, order_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_mobile_arrival_checklists_lookup
  ON mobile_arrival_checklists (tenant_id, order_id, user_id);

ALTER TABLE mobile_arrival_checklists ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own arrival checklist drafts" ON mobile_arrival_checklists;
CREATE POLICY "Users can view own arrival checklist drafts"
ON mobile_arrival_checklists FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  AND is_tenant_member(tenant_id)
);

DROP POLICY IF EXISTS "Users can insert own arrival checklist drafts" ON mobile_arrival_checklists;
CREATE POLICY "Users can insert own arrival checklist drafts"
ON mobile_arrival_checklists FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND is_tenant_member(tenant_id)
);

DROP POLICY IF EXISTS "Users can update own arrival checklist drafts" ON mobile_arrival_checklists;
CREATE POLICY "Users can update own arrival checklist drafts"
ON mobile_arrival_checklists FOR UPDATE
TO authenticated
USING (
  user_id = auth.uid()
  AND is_tenant_member(tenant_id)
)
WITH CHECK (
  user_id = auth.uid()
  AND is_tenant_member(tenant_id)
);

DROP POLICY IF EXISTS "Users can delete own arrival checklist drafts" ON mobile_arrival_checklists;
CREATE POLICY "Users can delete own arrival checklist drafts"
ON mobile_arrival_checklists FOR DELETE
TO authenticated
USING (
  user_id = auth.uid()
  AND is_tenant_member(tenant_id)
);
