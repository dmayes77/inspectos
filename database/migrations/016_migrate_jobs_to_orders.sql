-- =====================================================
-- Migrate Existing Jobs to Orders
-- This migration backfills orders from existing jobs data
-- =====================================================

-- Step 1: Create orders from existing jobs
INSERT INTO orders (
  id,
  tenant_id,
  order_number,
  client_id,
  property_id,
  inspector_id,
  status,
  scheduled_date,
  scheduled_time,
  duration_minutes,
  internal_notes,
  source,
  created_at,
  updated_at
)
SELECT
  gen_random_uuid(),
  j.tenant_id,
  NULL,
  j.client_id,
  j.property_id,
  j.inspector_id,
  -- Map job status to order status
  CASE j.status
    WHEN 'scheduled' THEN 'scheduled'
    WHEN 'in_progress' THEN 'in_progress'
    WHEN 'completed' THEN 'completed'
    WHEN 'cancelled' THEN 'cancelled'
    ELSE 'pending'
  END,
  j.scheduled_date,
  j.scheduled_time,
  j.duration_minutes,
  j.notes,
  'legacy_migration',
  j.created_at,
  j.updated_at
FROM jobs j
-- Only migrate jobs that don't already have an order
WHERE NOT EXISTS (
  SELECT 1 FROM orders o
  WHERE o.tenant_id = j.tenant_id
  AND o.property_id = j.property_id
  AND o.scheduled_date = j.scheduled_date
  AND o.source = 'legacy_migration'
);

-- Step 2: Create a temporary mapping table to link jobs to orders
CREATE TEMP TABLE job_order_map AS
SELECT
  j.id as job_id,
  o.id as order_id
FROM jobs j
JOIN orders o ON
  o.tenant_id = j.tenant_id
  AND o.property_id = j.property_id
  AND o.scheduled_date = j.scheduled_date
  AND o.source = 'legacy_migration';

-- Step 3: Link existing inspections to their orders
UPDATE inspections i
SET order_id = jom.order_id
FROM job_order_map jom
WHERE i.job_id = jom.job_id
AND i.order_id IS NULL;

-- Step 4: Create inspection_services from existing inspections
-- Each inspection gets one service based on its template
INSERT INTO inspection_services (
  id,
  inspection_id,
  template_id,
  name,
  price,
  duration_minutes,
  status,
  sort_order,
  created_at,
  updated_at
)
SELECT
  gen_random_uuid(),
  i.id,
  i.template_id,
  COALESCE(t.name, 'Home Inspection'),
  COALESCE(s.price, 0),
  j.duration_minutes,
  CASE i.status
    WHEN 'completed' THEN 'completed'
    WHEN 'submitted' THEN 'completed'
    WHEN 'in_progress' THEN 'in_progress'
    ELSE 'pending'
  END,
  0,
  i.created_at,
  i.updated_at
FROM inspections i
JOIN job_order_map jom ON jom.job_id = i.job_id
JOIN jobs j ON j.id = i.job_id
LEFT JOIN templates t ON t.id = i.template_id
LEFT JOIN services s ON s.template_id = i.template_id AND s.tenant_id = i.tenant_id
WHERE NOT EXISTS (
  SELECT 1 FROM inspection_services ise
  WHERE ise.inspection_id = i.id
);

-- Step 5: Link invoices to orders
UPDATE invoices inv
SET order_id = i.order_id
FROM inspections i
WHERE inv.inspection_id = i.id
AND inv.order_id IS NULL
AND i.order_id IS NOT NULL;

-- Step 6: Link documents to orders
UPDATE documents d
SET order_id = i.order_id
FROM inspections i
WHERE d.inspection_id = i.id
AND d.order_id IS NULL
AND i.order_id IS NOT NULL;

-- Step 7: Calculate order totals from invoices
UPDATE orders o
SET
  subtotal = COALESCE(inv.total, 0),
  total = COALESCE(inv.total, 0),
  payment_status = CASE
    WHEN inv.status = 'paid' THEN 'paid'
    ELSE 'unpaid'
  END
FROM invoices inv
WHERE inv.order_id = o.id;

-- Clean up temp table
DROP TABLE IF EXISTS job_order_map;

-- Add a comment noting migration was complete
COMMENT ON TABLE orders IS 'Orders table - migrated from jobs';

-- Note: The jobs table is kept for reference but new code should use orders
-- After verifying migration, you may add a deprecation notice to jobs table:
-- COMMENT ON TABLE jobs IS 'DEPRECATED: Use orders table instead. Kept for historical reference.';
