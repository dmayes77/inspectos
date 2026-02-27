-- Track who should be treated as the order's primary contact.
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS primary_contact_type TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'orders_primary_contact_type_check'
  ) THEN
    ALTER TABLE public.orders
      ADD CONSTRAINT orders_primary_contact_type_check
      CHECK (primary_contact_type IN ('agent', 'client') OR primary_contact_type IS NULL);
  END IF;
END
$$;

UPDATE public.orders
SET primary_contact_type =
  CASE
    WHEN agent_id IS NOT NULL THEN 'agent'
    WHEN client_id IS NOT NULL THEN 'client'
    ELSE NULL
  END
WHERE primary_contact_type IS NULL;
