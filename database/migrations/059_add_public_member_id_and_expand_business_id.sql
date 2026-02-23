-- Public identifier model:
-- 1) Expand tenants.business_id from 8 to 10 alphanumeric chars
-- 2) Add profiles.member_id as 10-char alphanumeric public member identifier

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
    FOR i IN 1..10 LOOP
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

ALTER TABLE public.tenants
  DROP CONSTRAINT IF EXISTS tenants_business_id_format;

UPDATE public.tenants
SET business_id = public.generate_business_id()
WHERE business_id IS NULL
   OR business_id !~ '^[A-Z0-9]{10}$';

ALTER TABLE public.tenants
  ALTER COLUMN business_id SET DEFAULT public.generate_business_id();

ALTER TABLE public.tenants
  ALTER COLUMN business_id SET NOT NULL;

ALTER TABLE public.tenants
  ADD CONSTRAINT tenants_business_id_format CHECK (business_id ~ '^[A-Z0-9]{10}$');

CREATE UNIQUE INDEX IF NOT EXISTS idx_tenants_business_id
  ON public.tenants (business_id);

CREATE OR REPLACE FUNCTION public.generate_member_id()
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
    FOR i IN 1..10 LOOP
      candidate := candidate || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    END LOOP;

    EXIT WHEN NOT EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.member_id = candidate
    );
  END LOOP;

  RETURN candidate;
END;
$$;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS member_id text;

UPDATE public.profiles
SET member_id = public.generate_member_id()
WHERE member_id IS NULL
   OR member_id !~ '^[A-Z0-9]{10}$';

ALTER TABLE public.profiles
  ALTER COLUMN member_id SET DEFAULT public.generate_member_id();

ALTER TABLE public.profiles
  ALTER COLUMN member_id SET NOT NULL;

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_member_id_format;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_member_id_format CHECK (member_id ~ '^[A-Z0-9]{10}$');

CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_member_id
  ON public.profiles (member_id);
