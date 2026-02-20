-- Ensure each business always has at least one owner in tenant_members.

CREATE OR REPLACE FUNCTION public.ensure_minimum_one_owner_per_business()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  tenant_id_to_check uuid;
  owner_count bigint;
BEGIN
  FOR tenant_id_to_check IN
    SELECT DISTINCT unnest(
      ARRAY_REMOVE(
        ARRAY[
          CASE WHEN TG_OP IN ('DELETE', 'UPDATE') THEN OLD.tenant_id ELSE NULL END,
          CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN NEW.tenant_id ELSE NULL END
        ],
        NULL
      )
    )
  LOOP
    SELECT count(*)
    INTO owner_count
    FROM public.tenant_members tm
    WHERE tm.tenant_id = tenant_id_to_check
      AND tm.role = 'owner';

    IF owner_count = 0 THEN
      RAISE EXCEPTION 'At least one owner is required for each business';
    END IF;
  END LOOP;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS tenant_members_require_owner ON public.tenant_members;

CREATE CONSTRAINT TRIGGER tenant_members_require_owner
AFTER INSERT OR UPDATE OR DELETE ON public.tenant_members
DEFERRABLE INITIALLY IMMEDIATE
FOR EACH ROW
EXECUTE FUNCTION public.ensure_minimum_one_owner_per_business();
