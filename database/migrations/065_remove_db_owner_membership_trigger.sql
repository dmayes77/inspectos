-- Move "at least one owner" enforcement to application layer only.
-- This removes the database-level trigger/function so direct SQL maintenance
-- (tenant/user cleanup, backfills, imports) is not blocked.

DROP TRIGGER IF EXISTS tenant_members_require_owner ON public.tenant_members;

DROP FUNCTION IF EXISTS public.ensure_minimum_one_owner_per_business();
