-- Seed/update an agent record for agent portal testing
DO $$
DECLARE
  v_tenant_id UUID := 'f54f7c28-2dc7-4bc3-9c23-0a1dca0bd4e3';
  v_email TEXT := 'dmayes77@gmail.com';
  v_existing_agent_id UUID;
BEGIN
  SELECT a.id
  INTO v_existing_agent_id
  FROM public.agents a
  WHERE a.tenant_id = v_tenant_id
    AND LOWER(BTRIM(a.email)) = LOWER(BTRIM(v_email))
  ORDER BY a.created_at ASC
  LIMIT 1;

  IF v_existing_agent_id IS NULL THEN
    INSERT INTO public.agents (
      tenant_id,
      name,
      email,
      phone,
      license_number,
      status,
      notes,
      preferred_report_format,
      notify_on_schedule,
      notify_on_complete,
      notify_on_report,
      portal_access_enabled
    ) VALUES (
      v_tenant_id,
      'David Mayes',
      v_email,
      '(555) 010-7788',
      'TX-RE-7788',
      'active',
      'Seeded for agent portal testing',
      'pdf',
      TRUE,
      TRUE,
      TRUE,
      TRUE
    );
  ELSE
    UPDATE public.agents
    SET
      name = 'David Mayes',
      phone = '(555) 010-7788',
      license_number = 'TX-RE-7788',
      status = 'active',
      notes = 'Seeded for agent portal testing',
      preferred_report_format = 'pdf',
      notify_on_schedule = TRUE,
      notify_on_complete = TRUE,
      notify_on_report = TRUE,
      portal_access_enabled = TRUE,
      updated_at = NOW()
    WHERE id = v_existing_agent_id;
  END IF;
END $$;
