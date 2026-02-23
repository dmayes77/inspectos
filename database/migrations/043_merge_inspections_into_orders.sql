-- =============================================================================
-- Migration 043: Merge inspections table into orders
-- =============================================================================
-- Rationale: orders and inspections have a strict 1:1 relationship. Every order
-- IS an inspection job. Keeping them as separate tables creates redundant status
-- fields, duplicated completed_at, and unnecessary joins on every query.
--
-- Changes:
--   1. Add inspection field columns to orders
--   2. Copy inspection data into orders
--   3. Add order_id FK to all child tables (answers, findings, signatures,
--      media_assets, inspection_services, inspection_assignments)
--   4. Populate order_id on child tables via inspections.order_id
--   5. Drop inspection_id from child tables
--   6. Rename inspection_services → order_services
--   7. Drop the inspections table
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Step 1: Add inspection-specific columns to orders
-- -----------------------------------------------------------------------------
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS template_id        uuid REFERENCES templates(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS template_version   integer,
  ADD COLUMN IF NOT EXISTS started_at         timestamptz,
  ADD COLUMN IF NOT EXISTS weather_conditions text,
  ADD COLUMN IF NOT EXISTS temperature        text,
  ADD COLUMN IF NOT EXISTS present_parties    jsonb,
  ADD COLUMN IF NOT EXISTS field_notes        text,
  ADD COLUMN IF NOT EXISTS selected_type_ids  text[];

-- -----------------------------------------------------------------------------
-- Step 2: Copy inspection data into orders (only for inspections with order_id)
-- -----------------------------------------------------------------------------
UPDATE orders o
SET
  template_id        = i.template_id,
  template_version   = i.template_version,
  started_at         = i.started_at,
  weather_conditions = i.weather_conditions,
  temperature        = i.temperature,
  present_parties    = i.present_parties,
  field_notes        = i.notes,
  selected_type_ids  = i.selected_type_ids,
  -- Reconcile completed_at: prefer existing orders value, fall back to inspection
  completed_at       = COALESCE(o.completed_at, i.completed_at)
FROM inspections i
WHERE i.order_id = o.id;

-- -----------------------------------------------------------------------------
-- Step 3: Add order_id FK columns to all child tables
-- -----------------------------------------------------------------------------

-- answers
ALTER TABLE answers
  ADD COLUMN IF NOT EXISTS order_id uuid REFERENCES orders(id) ON DELETE CASCADE;

-- findings
ALTER TABLE findings
  ADD COLUMN IF NOT EXISTS order_id uuid REFERENCES orders(id) ON DELETE CASCADE;

-- signatures
ALTER TABLE signatures
  ADD COLUMN IF NOT EXISTS order_id uuid REFERENCES orders(id) ON DELETE CASCADE;

-- media_assets (nullable — can exist attached to a finding/answer without a direct order reference)
ALTER TABLE media_assets
  ADD COLUMN IF NOT EXISTS order_id uuid REFERENCES orders(id) ON DELETE CASCADE;

-- inspection_services
ALTER TABLE inspection_services
  ADD COLUMN IF NOT EXISTS order_id uuid REFERENCES orders(id) ON DELETE CASCADE;

-- inspection_assignments
ALTER TABLE inspection_assignments
  ADD COLUMN IF NOT EXISTS order_id uuid REFERENCES orders(id) ON DELETE CASCADE;

-- -----------------------------------------------------------------------------
-- Step 4: Populate order_id on child tables via inspections.order_id
-- -----------------------------------------------------------------------------
UPDATE answers a
SET order_id = i.order_id
FROM inspections i
WHERE i.id = a.inspection_id AND i.order_id IS NOT NULL;

UPDATE findings f
SET order_id = i.order_id
FROM inspections i
WHERE i.id = f.inspection_id AND i.order_id IS NOT NULL;

UPDATE signatures s
SET order_id = i.order_id
FROM inspections i
WHERE i.id = s.inspection_id AND i.order_id IS NOT NULL;

UPDATE media_assets m
SET order_id = i.order_id
FROM inspections i
WHERE i.id = m.inspection_id AND i.order_id IS NOT NULL;

UPDATE inspection_services svc
SET order_id = i.order_id
FROM inspections i
WHERE i.id = svc.inspection_id AND i.order_id IS NOT NULL;

-- Drop broken trigger on inspection_assignments (references updated_at which doesn't exist)
DROP TRIGGER IF EXISTS update_inspection_assignments_updated_at ON inspection_assignments;

UPDATE inspection_assignments ia
SET order_id = i.order_id
FROM inspections i
WHERE i.id = ia.inspection_id AND i.order_id IS NOT NULL;

-- -----------------------------------------------------------------------------
-- Step 5: Drop old inspection_id FK columns from child tables
-- CASCADE drops any RLS policies referencing the column (recreated in step 9)
-- -----------------------------------------------------------------------------
ALTER TABLE answers             DROP COLUMN IF EXISTS inspection_id CASCADE;
ALTER TABLE findings            DROP COLUMN IF EXISTS inspection_id CASCADE;
ALTER TABLE signatures          DROP COLUMN IF EXISTS inspection_id CASCADE;
ALTER TABLE media_assets        DROP COLUMN IF EXISTS inspection_id CASCADE;
ALTER TABLE inspection_services DROP COLUMN IF EXISTS inspection_id CASCADE;
ALTER TABLE inspection_assignments DROP COLUMN IF EXISTS inspection_id CASCADE;

-- -----------------------------------------------------------------------------
-- Step 6: Rename inspection_services → order_services
-- -----------------------------------------------------------------------------
ALTER TABLE inspection_services RENAME TO order_services;

-- Rename the index references that mention inspection
ALTER INDEX IF EXISTS idx_inspection_services_inspection_id RENAME TO idx_order_services_order_id;

-- -----------------------------------------------------------------------------
-- Step 7: Drop the inspections table (cascade drops remaining FKs/indexes)
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS inspections CASCADE;

-- -----------------------------------------------------------------------------
-- Step 8: Create indexes on new order_id columns
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_answers_order           ON answers(order_id);
CREATE INDEX IF NOT EXISTS idx_findings_order          ON findings(order_id);
CREATE INDEX IF NOT EXISTS idx_signatures_order        ON signatures(order_id);
CREATE INDEX IF NOT EXISTS idx_media_assets_order      ON media_assets(order_id);
CREATE INDEX IF NOT EXISTS idx_order_services_order    ON order_services(order_id);
CREATE INDEX IF NOT EXISTS idx_inspection_assignments_order ON inspection_assignments(order_id);

-- -----------------------------------------------------------------------------
-- Step 9: Update RLS policies that referenced inspections
-- (policies on answers/findings/signatures referenced inspections.tenant_id)
-- Re-create them pointing to orders instead
-- -----------------------------------------------------------------------------

-- answers policies
DROP POLICY IF EXISTS "Tenant members can view answers"     ON answers;
DROP POLICY IF EXISTS "Inspectors can view own answers"     ON answers;
DROP POLICY IF EXISTS "Tenant members can manage answers"   ON answers;
DROP POLICY IF EXISTS "Inspectors can manage own answers"   ON answers;

CREATE POLICY "Tenant members can view answers" ON answers
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM orders o WHERE o.id = order_id AND is_tenant_member(o.tenant_id))
  );

CREATE POLICY "Tenant members can manage answers" ON answers
  FOR ALL USING (
    EXISTS (SELECT 1 FROM orders o WHERE o.id = order_id AND is_tenant_member(o.tenant_id))
  );

-- findings policies
DROP POLICY IF EXISTS "Tenant members can view findings"   ON findings;
DROP POLICY IF EXISTS "Inspectors can view own findings"   ON findings;
DROP POLICY IF EXISTS "Tenant members can manage findings" ON findings;
DROP POLICY IF EXISTS "Inspectors can manage own findings" ON findings;

CREATE POLICY "Tenant members can view findings" ON findings
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM orders o WHERE o.id = order_id AND is_tenant_member(o.tenant_id))
  );

CREATE POLICY "Tenant members can manage findings" ON findings
  FOR ALL USING (
    EXISTS (SELECT 1 FROM orders o WHERE o.id = order_id AND is_tenant_member(o.tenant_id))
  );

-- signatures policies
DROP POLICY IF EXISTS "Tenant members can view signatures"   ON signatures;
DROP POLICY IF EXISTS "Inspectors can view own signatures"   ON signatures;
DROP POLICY IF EXISTS "Tenant members can manage signatures" ON signatures;
DROP POLICY IF EXISTS "Inspectors can manage own signatures" ON signatures;

CREATE POLICY "Tenant members can view signatures" ON signatures
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM orders o WHERE o.id = order_id AND is_tenant_member(o.tenant_id))
  );

CREATE POLICY "Tenant members can manage signatures" ON signatures
  FOR ALL USING (
    EXISTS (SELECT 1 FROM orders o WHERE o.id = order_id AND is_tenant_member(o.tenant_id))
  );
