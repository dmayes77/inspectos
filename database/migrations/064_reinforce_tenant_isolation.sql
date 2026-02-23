-- Reinforce strict tenant isolation:
-- one auth user can belong to exactly one tenant.
-- This is idempotent and safe to run in environments that may have missed prior hardening.

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

-- Ensure a global unique key on user_id to prevent cross-tenant bleed.
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
