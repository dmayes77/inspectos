-- =====================================================
-- Order-level custom inspection building blocks
-- =====================================================

CREATE TABLE IF NOT EXISTS mobile_inspection_custom_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  name text NOT NULL,
  sort_order integer NOT NULL DEFAULT 1000,
  created_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mobile_inspection_custom_sections_lookup
  ON mobile_inspection_custom_sections (tenant_id, order_id, sort_order, created_at);

ALTER TABLE mobile_inspection_custom_sections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view custom inspection sections" ON mobile_inspection_custom_sections;
CREATE POLICY "Members can view custom inspection sections"
ON mobile_inspection_custom_sections FOR SELECT
TO authenticated
USING (
  is_tenant_member(tenant_id)
);

DROP POLICY IF EXISTS "Members can manage custom inspection sections" ON mobile_inspection_custom_sections;
CREATE POLICY "Members can manage custom inspection sections"
ON mobile_inspection_custom_sections FOR ALL
TO authenticated
USING (
  is_tenant_member(tenant_id)
)
WITH CHECK (
  is_tenant_member(tenant_id)
);

CREATE TABLE IF NOT EXISTS mobile_inspection_custom_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  section_id uuid NOT NULL REFERENCES mobile_inspection_custom_sections(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  item_type text NOT NULL DEFAULT 'text',
  options jsonb,
  is_required boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 1000,
  created_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mobile_inspection_custom_items_lookup
  ON mobile_inspection_custom_items (tenant_id, order_id, section_id, sort_order, created_at);

ALTER TABLE mobile_inspection_custom_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view custom inspection items" ON mobile_inspection_custom_items;
CREATE POLICY "Members can view custom inspection items"
ON mobile_inspection_custom_items FOR SELECT
TO authenticated
USING (
  is_tenant_member(tenant_id)
);

DROP POLICY IF EXISTS "Members can manage custom inspection items" ON mobile_inspection_custom_items;
CREATE POLICY "Members can manage custom inspection items"
ON mobile_inspection_custom_items FOR ALL
TO authenticated
USING (
  is_tenant_member(tenant_id)
)
WITH CHECK (
  is_tenant_member(tenant_id)
);

CREATE TABLE IF NOT EXISTS mobile_inspection_custom_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  custom_item_id uuid NOT NULL REFERENCES mobile_inspection_custom_items(id) ON DELETE CASCADE,
  value text,
  notes text,
  created_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  updated_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT mobile_inspection_custom_answers_unique UNIQUE (tenant_id, order_id, custom_item_id)
);

CREATE INDEX IF NOT EXISTS idx_mobile_inspection_custom_answers_lookup
  ON mobile_inspection_custom_answers (tenant_id, order_id, custom_item_id, updated_at DESC);

ALTER TABLE mobile_inspection_custom_answers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view custom inspection answers" ON mobile_inspection_custom_answers;
CREATE POLICY "Members can view custom inspection answers"
ON mobile_inspection_custom_answers FOR SELECT
TO authenticated
USING (
  is_tenant_member(tenant_id)
);

DROP POLICY IF EXISTS "Members can manage custom inspection answers" ON mobile_inspection_custom_answers;
CREATE POLICY "Members can manage custom inspection answers"
ON mobile_inspection_custom_answers FOR ALL
TO authenticated
USING (
  is_tenant_member(tenant_id)
)
WITH CHECK (
  is_tenant_member(tenant_id)
);

