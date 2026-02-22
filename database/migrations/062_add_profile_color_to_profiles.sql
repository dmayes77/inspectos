-- Add member color used for schedule and assignment visual coding.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS profile_color text NOT NULL DEFAULT '#CBD5E1';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'profiles_profile_color_hex'
      AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_profile_color_hex
      CHECK (profile_color ~ '^#[0-9A-Fa-f]{6}$');
  END IF;
END
$$;
