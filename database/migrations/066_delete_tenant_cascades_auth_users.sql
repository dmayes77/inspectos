-- Enforce hard tenant teardown at DB level:
-- deleting a tenant deletes its member auth users (and cascaded profile/member data).
--
-- Safe-guard:
-- only deletes auth users that have no memberships in other tenants.
-- (Single-tenant membership is already enforced, but this guard protects legacy edge cases.)

CREATE OR REPLACE FUNCTION public.delete_tenant_auth_users()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  DELETE FROM public.profiles p
  WHERE p.id IN (
    SELECT tm.user_id
    FROM public.tenant_members tm
    WHERE tm.tenant_id = OLD.id
  )
  AND NOT EXISTS (
    SELECT 1
    FROM public.tenant_members tm_other
    WHERE tm_other.user_id = p.id
      AND tm_other.tenant_id <> OLD.id
  );

  DELETE FROM auth.users u
  WHERE u.id IN (
    SELECT tm.user_id
    FROM public.tenant_members tm
    WHERE tm.tenant_id = OLD.id
  )
  AND NOT EXISTS (
    SELECT 1
    FROM public.tenant_members tm_other
    WHERE tm_other.user_id = u.id
      AND tm_other.tenant_id <> OLD.id
  );

  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS tenants_delete_auth_users ON public.tenants;

CREATE TRIGGER tenants_delete_auth_users
BEFORE DELETE ON public.tenants
FOR EACH ROW
EXECUTE FUNCTION public.delete_tenant_auth_users();
