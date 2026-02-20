-- Use a human-safe public ID alphabet to avoid ambiguous characters.
-- Allowed chars: A-H, J-N, P-Z, 2-9 (excludes 0, 1, I, L, O)

CREATE OR REPLACE FUNCTION public.generate_business_id()
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
      FROM public.tenants t
      WHERE t.business_id = candidate
    );
  END LOOP;

  RETURN candidate;
END;
$$;

ALTER TABLE public.tenants
  DROP CONSTRAINT IF EXISTS tenants_business_id_format;

UPDATE public.tenants
SET business_id = public.generate_business_id()
WHERE business_id IS NULL
   OR business_id !~ '^[A-HJ-NP-Z2-9]{10}$';

ALTER TABLE public.tenants
  ADD CONSTRAINT tenants_business_id_format CHECK (business_id ~ '^[A-HJ-NP-Z2-9]{10}$');

CREATE OR REPLACE FUNCTION public.generate_member_id()
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
      FROM public.profiles p
      WHERE p.member_id = candidate
    );
  END LOOP;

  RETURN candidate;
END;
$$;

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_member_id_format;

UPDATE public.profiles
SET member_id = public.generate_member_id()
WHERE member_id IS NULL
   OR member_id !~ '^[A-HJ-NP-Z2-9]{10}$';

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_member_id_format CHECK (member_id ~ '^[A-HJ-NP-Z2-9]{10}$');

