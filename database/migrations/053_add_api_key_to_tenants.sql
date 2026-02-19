-- Add persisted API keys for business-level API access.

CREATE OR REPLACE FUNCTION public.generate_business_api_key()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  candidate text;
BEGIN
  LOOP
    candidate := 'isk_' || encode(gen_random_bytes(16), 'hex');
    EXIT WHEN NOT EXISTS (
      SELECT 1
      FROM public.tenants t
      WHERE t.api_key = candidate
    );
  END LOOP;

  RETURN candidate;
END;
$$;

ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS api_key text;

UPDATE public.tenants
SET api_key = public.generate_business_api_key()
WHERE api_key IS NULL
   OR api_key !~ '^isk_[a-f0-9]{32}$';

ALTER TABLE public.tenants
  ALTER COLUMN api_key SET DEFAULT public.generate_business_api_key();

ALTER TABLE public.tenants
  ALTER COLUMN api_key SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'tenants_api_key_format'
      AND conrelid = 'public.tenants'::regclass
  ) THEN
    ALTER TABLE public.tenants
      ADD CONSTRAINT tenants_api_key_format CHECK (api_key ~ '^isk_[a-f0-9]{32}$');
  END IF;
END
$$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_tenants_api_key
  ON public.tenants (api_key);
