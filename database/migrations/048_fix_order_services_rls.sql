-- Fix order_services (formerly inspection_services) RLS policies.
-- The old policies referenced inspection_id which was dropped in migration 043.
-- Replace with policies that use order_id → orders.tenant_id.

DROP POLICY IF EXISTS "Members can view inspection services" ON order_services;
DROP POLICY IF EXISTS "Inspectors can manage inspection services" ON order_services;

CREATE POLICY "Members can view order services"
ON order_services FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM orders o
    WHERE o.id = order_id
      AND is_tenant_member(o.tenant_id)
  )
);

CREATE POLICY "Members can manage order services"
ON order_services FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM orders o
    WHERE o.id = order_id
      AND is_tenant_member(o.tenant_id)
  )
);
