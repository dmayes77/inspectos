-- Attach a handful of unassigned orders to the seeded agent for portal testing
DO $$
DECLARE
  v_tenant_id UUID := 'f54f7c28-2dc7-4bc3-9c23-0a1dca0bd4e3';
  v_agent_email TEXT := 'dmayes77@gmail.com';
  v_agent_id UUID;
BEGIN
  SELECT a.id
  INTO v_agent_id
  FROM public.agents a
  WHERE a.tenant_id = v_tenant_id
    AND LOWER(BTRIM(a.email)) = LOWER(BTRIM(v_agent_email))
  ORDER BY a.created_at ASC
  LIMIT 1;

  IF v_agent_id IS NULL THEN
    RAISE NOTICE 'No matching agent found for %, skipping order assignment.', v_agent_email;
    RETURN;
  END IF;

  WITH candidate_orders AS (
    SELECT o.id
    FROM public.orders o
    WHERE o.tenant_id = v_tenant_id
      AND o.agent_id IS NULL
    ORDER BY o.created_at DESC
    LIMIT 8
  )
  UPDATE public.orders o
  SET
    agent_id = v_agent_id,
    updated_at = NOW()
  FROM candidate_orders c
  WHERE o.id = c.id;
END $$;
