-- Add a short, human-friendly business identifier to tenants.
-- Keeps existing UUID primary key for relational integrity.

CREATE OR REPLACE FUNCTION public.generate_business_id()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  chars CONSTANT text := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  candidate text;
  i integer;
BEGIN
  LOOP
    candidate := '';
    FOR i IN 1..8 LOOP
      candidate := candidate || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    END LOOP;

    EXIT WHEN NOT EXISTS (
      SELECT 1
      FROM public.tenants t
      WHERE t.business_id = candidate
    );
  END LOOP;

  RETURN candidate;
END;
$$;

ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS business_id text;

UPDATE public.tenants
SET business_id = public.generate_business_id()
WHERE business_id IS NULL
   OR business_id !~ '^[A-Z0-9]{8}$';

ALTER TABLE public.tenants
  ALTER COLUMN business_id SET DEFAULT public.generate_business_id();

ALTER TABLE public.tenants
  ALTER COLUMN business_id SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'tenants_business_id_format'
      AND conrelid = 'public.tenants'::regclass
  ) THEN
    ALTER TABLE public.tenants
      ADD CONSTRAINT tenants_business_id_format CHECK (business_id ~ '^[A-Z0-9]{8}$');
  END IF;
END
$$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_tenants_business_id
  ON public.tenants (business_id);
