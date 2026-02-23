-- =====================================================
-- Update Order Number Generator to Random 8-Digit Format
-- =====================================================

CREATE OR REPLACE FUNCTION generate_order_number(p_tenant_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_number TEXT;
  v_candidate TEXT;
BEGIN
  LOOP
    v_number := LPAD(FLOOR(RANDOM() * 100000000)::INT::TEXT, 8, '0');
    v_candidate := 'ORD-' || SUBSTRING(v_number, 1, 4) || '-' || SUBSTRING(v_number, 5, 4);

    EXIT WHEN NOT EXISTS (
      SELECT 1
      FROM orders
      WHERE tenant_id = p_tenant_id
        AND order_number = v_candidate
    );
  END LOOP;

  RETURN v_candidate;
END;
$$ LANGUAGE plpgsql;

-- Re-number existing orders to random format
DO $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN SELECT id, tenant_id FROM orders LOOP
    UPDATE orders
    SET order_number = generate_order_number(rec.tenant_id)
    WHERE id = rec.id;
  END LOOP;
END $$;
