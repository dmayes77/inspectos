-- Prevent duplicate agencies per tenant.
-- 1) Merge existing duplicates by normalized name (keep earliest row).
-- 2) Repoint agents to kept agency ids.
-- 3) Enforce uniqueness at DB level for future inserts.

WITH ranked AS (
  SELECT
    id,
    tenant_id,
    LOWER(BTRIM(name)) AS normalized_name,
    FIRST_VALUE(id) OVER (
      PARTITION BY tenant_id, LOWER(BTRIM(name))
      ORDER BY created_at ASC NULLS LAST, id ASC
    ) AS keep_id,
    ROW_NUMBER() OVER (
      PARTITION BY tenant_id, LOWER(BTRIM(name))
      ORDER BY created_at ASC NULLS LAST, id ASC
    ) AS rn
  FROM public.agencies
),
dupes AS (
  SELECT id, keep_id
  FROM ranked
  WHERE rn > 1
)
UPDATE public.agents a
SET agency_id = d.keep_id
FROM dupes d
WHERE a.agency_id = d.id;

WITH ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY tenant_id, LOWER(BTRIM(name))
      ORDER BY created_at ASC NULLS LAST, id ASC
    ) AS rn
  FROM public.agencies
)
DELETE FROM public.agencies ag
USING ranked r
WHERE ag.id = r.id
  AND r.rn > 1;

CREATE UNIQUE INDEX IF NOT EXISTS idx_agencies_tenant_name_unique
  ON public.agencies (tenant_id, LOWER(BTRIM(name)));
