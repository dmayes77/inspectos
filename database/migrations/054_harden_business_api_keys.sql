-- Harden business API keys by storing only hashes and tracking metadata/scopes.

CREATE TABLE IF NOT EXISTS public.business_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Primary Key',
  key_prefix TEXT NOT NULL,
  key_hash TEXT NOT NULL UNIQUE,
  scopes TEXT[] NOT NULL DEFAULT ARRAY['admin:api']::TEXT[],
  last_used_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_business_api_keys_tenant
  ON public.business_api_keys (tenant_id);

CREATE INDEX IF NOT EXISTS idx_business_api_keys_active
  ON public.business_api_keys (tenant_id, revoked_at)
  WHERE revoked_at IS NULL;

-- Backfill hashed keys from tenants.api_key (if present) for existing rows.
INSERT INTO public.business_api_keys (tenant_id, name, key_prefix, key_hash, scopes, created_at, updated_at)
SELECT
  t.id,
  'Migrated Key',
  LEFT(t.api_key, 12),
  ENCODE(DIGEST(t.api_key, 'sha256'), 'hex'),
  ARRAY['admin:api']::TEXT[],
  NOW(),
  NOW()
FROM public.tenants t
WHERE t.api_key IS NOT NULL
  AND t.api_key ~ '^isk_[a-f0-9]{32}$'
  AND NOT EXISTS (
    SELECT 1
    FROM public.business_api_keys k
    WHERE k.tenant_id = t.id
      AND k.revoked_at IS NULL
  );

-- Stop storing raw keys directly on tenants.
ALTER TABLE public.tenants
  ALTER COLUMN api_key DROP NOT NULL;

ALTER TABLE public.tenants
  ALTER COLUMN api_key DROP DEFAULT;

ALTER TABLE public.tenants
  DROP CONSTRAINT IF EXISTS tenants_api_key_format;

DROP INDEX IF EXISTS public.idx_tenants_api_key;

UPDATE public.tenants
SET api_key = NULL
WHERE api_key IS NOT NULL;
