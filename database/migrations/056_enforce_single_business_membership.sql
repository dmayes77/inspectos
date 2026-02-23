-- Enforce single-business auth model:
-- 1) Global unique email at profile layer (case-insensitive)
-- 2) One business membership per user across tenant_members

-- Resolve duplicate profile emails (case-insensitive) by suffixing duplicates.
WITH ranked AS (
  SELECT
    id,
    email,
    LOWER(email) AS email_lower,
    ROW_NUMBER() OVER (PARTITION BY LOWER(email) ORDER BY created_at NULLS LAST, id) AS rn
  FROM public.profiles
  WHERE email IS NOT NULL
), updates AS (
  SELECT
    id,
    CASE
      WHEN rn = 1 THEN email
      ELSE CONCAT(
        SPLIT_PART(email, '@', 1),
        '+dup',
        rn - 1,
        '@',
        SPLIT_PART(email, '@', 2)
      )
    END AS next_email
  FROM ranked
)
UPDATE public.profiles p
SET email = u.next_email
FROM updates u
WHERE p.id = u.id
  AND p.email IS DISTINCT FROM u.next_email;

-- Keep only one membership per user (earliest created_at, then lowest id).
WITH ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY user_id
      ORDER BY created_at ASC NULLS LAST, id ASC
    ) AS rn
  FROM public.tenant_members
)
DELETE FROM public.tenant_members tm
USING ranked r
WHERE tm.id = r.id
  AND r.rn > 1;

-- Add unique constraint for one membership per user.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'tenant_members_user_id_unique'
      AND conrelid = 'public.tenant_members'::regclass
  ) THEN
    ALTER TABLE public.tenant_members
      ADD CONSTRAINT tenant_members_user_id_unique UNIQUE (user_id);
  END IF;
END
$$;

-- Add case-insensitive unique index for profile emails.
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_email_lower_unique
  ON public.profiles (LOWER(email));
