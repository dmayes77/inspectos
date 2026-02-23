-- Prevent duplicate agents per tenant by email.
-- 1) Merge existing duplicates by normalized email (keep earliest row).
-- 2) Repoint dependent rows (orders, portal_sessions) to kept agent ids.
-- 3) Enforce uniqueness at DB level for future inserts.

WITH ranked AS (
  SELECT
    id,
    tenant_id,
    LOWER(BTRIM(email)) AS normalized_email,
    FIRST_VALUE(id) OVER (
      PARTITION BY tenant_id, LOWER(BTRIM(email))
      ORDER BY created_at ASC NULLS LAST, id ASC
    ) AS keep_id,
    ROW_NUMBER() OVER (
      PARTITION BY tenant_id, LOWER(BTRIM(email))
      ORDER BY created_at ASC NULLS LAST, id ASC
    ) AS rn
  FROM public.agents
  WHERE email IS NOT NULL
    AND BTRIM(email) <> ''
),
dupes AS (
  SELECT id, keep_id
  FROM ranked
  WHERE rn > 1
)
UPDATE public.orders o
SET agent_id = d.keep_id
FROM dupes d
WHERE o.agent_id = d.id;

WITH ranked AS (
  SELECT
    id,
    tenant_id,
    LOWER(BTRIM(email)) AS normalized_email,
    FIRST_VALUE(id) OVER (
      PARTITION BY tenant_id, LOWER(BTRIM(email))
      ORDER BY created_at ASC NULLS LAST, id ASC
    ) AS keep_id,
    ROW_NUMBER() OVER (
      PARTITION BY tenant_id, LOWER(BTRIM(email))
      ORDER BY created_at ASC NULLS LAST, id ASC
    ) AS rn
  FROM public.agents
  WHERE email IS NOT NULL
    AND BTRIM(email) <> ''
),
dupes AS (
  SELECT id, keep_id
  FROM ranked
  WHERE rn > 1
)
UPDATE public.portal_sessions ps
SET agent_id = d.keep_id
FROM dupes d
WHERE ps.agent_id = d.id;

WITH ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY tenant_id, LOWER(BTRIM(email))
      ORDER BY created_at ASC NULLS LAST, id ASC
    ) AS rn
  FROM public.agents
  WHERE email IS NOT NULL
    AND BTRIM(email) <> ''
)
DELETE FROM public.agents a
USING ranked r
WHERE a.id = r.id
  AND r.rn > 1;

CREATE UNIQUE INDEX IF NOT EXISTS idx_agents_tenant_email_unique
  ON public.agents (tenant_id, LOWER(BTRIM(email)))
  WHERE email IS NOT NULL
    AND BTRIM(email) <> '';
