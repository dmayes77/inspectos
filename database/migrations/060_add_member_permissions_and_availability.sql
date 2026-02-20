-- Persist member-level custom permissions and availability settings.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS custom_permissions text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS weekly_availability jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS availability_exceptions jsonb NOT NULL DEFAULT '[]'::jsonb;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'profiles_weekly_availability_array'
      AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_weekly_availability_array
      CHECK (jsonb_typeof(weekly_availability) = 'array');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'profiles_availability_exceptions_array'
      AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_availability_exceptions_array
      CHECK (jsonb_typeof(availability_exceptions) = 'array');
  END IF;
END
$$;
