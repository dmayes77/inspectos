-- =====================================================
-- Update Order Number Format to ORD-XXXX-XXXX
-- =====================================================

CREATE OR REPLACE FUNCTION generate_order_number(p_tenant_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_number TEXT;
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) + 1 INTO v_count
  FROM orders
  WHERE tenant_id = p_tenant_id;

  v_number := LPAD(v_count::TEXT, 8, '0');
  RETURN 'ORD-' || SUBSTRING(v_number, 1, 4) || '-' || SUBSTRING(v_number, 5, 4);
END;
$$ LANGUAGE plpgsql;

-- Re-number existing orders to the new format (sequential per tenant)
WITH ranked AS (
  SELECT
    id,
    tenant_id,
    ROW_NUMBER() OVER (PARTITION BY tenant_id ORDER BY created_at, id) AS rn
  FROM orders
)
UPDATE orders
SET order_number = 'ORD-' ||
  SUBSTRING(LPAD(ranked.rn::TEXT, 8, '0'), 1, 4) || '-' ||
  SUBSTRING(LPAD(ranked.rn::TEXT, 8, '0'), 5, 4)
FROM ranked
WHERE orders.id = ranked.id;
