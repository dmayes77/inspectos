-- Add a human-safe public identifier for vendors so UUIDs are not used in URLs.
CREATE OR REPLACE FUNCTION public.generate_vendor_public_id()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  chars CONSTANT text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  candidate text;
  i integer;
BEGIN
  LOOP
    candidate := '';
    FOR i IN 1..10 LOOP
      candidate := candidate || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    END LOOP;

    EXIT WHEN NOT EXISTS (
      SELECT 1
      FROM public.vendors v
      WHERE v.public_id = candidate
    );
  END LOOP;

  RETURN candidate;
END;
$$;

ALTER TABLE public.vendors
  ADD COLUMN IF NOT EXISTS public_id TEXT;

UPDATE public.vendors
SET public_id = public.generate_vendor_public_id()
WHERE public_id IS NULL
   OR public_id !~ '^[A-HJ-NP-Z2-9]{10}$';

ALTER TABLE public.vendors
  ALTER COLUMN public_id SET DEFAULT public.generate_vendor_public_id();

ALTER TABLE public.vendors
  ALTER COLUMN public_id SET NOT NULL;

ALTER TABLE public.vendors
  DROP CONSTRAINT IF EXISTS vendors_public_id_format;

ALTER TABLE public.vendors
  ADD CONSTRAINT vendors_public_id_format CHECK (public_id ~ '^[A-HJ-NP-Z2-9]{10}$');

CREATE UNIQUE INDEX IF NOT EXISTS idx_vendors_public_id
  ON public.vendors(public_id);
