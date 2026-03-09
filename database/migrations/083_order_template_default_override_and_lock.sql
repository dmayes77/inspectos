-- =====================================================
-- Order template default/override model + lock-on-start
-- =====================================================

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS template_selection_mode text NOT NULL DEFAULT 'service_default'
    CHECK (template_selection_mode IN ('service_default', 'order_override')),
  ADD COLUMN IF NOT EXISTS template_locked_at timestamptz;

-- Preserve existing explicit templates as overrides by default.
UPDATE public.orders
SET template_selection_mode = 'order_override'
WHERE template_id IS NOT NULL
  AND template_selection_mode = 'service_default';

CREATE OR REPLACE FUNCTION public.resolve_order_default_template(p_order_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT os.template_id
  FROM public.order_services os
  WHERE os.order_id = p_order_id
    AND os.template_id IS NOT NULL
  ORDER BY os.sort_order NULLS LAST, os.created_at ASC, os.id ASC
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.sync_order_template_from_services(p_order_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_template_id uuid;
  v_template_version integer;
BEGIN
  IF p_order_id IS NULL THEN
    RETURN;
  END IF;

  SELECT public.resolve_order_default_template(p_order_id)
  INTO v_template_id;

  SELECT t.version
  INTO v_template_version
  FROM public.templates t
  WHERE t.id = v_template_id;

  PERFORM set_config('inspectos.template_sync', '1', true);

  UPDATE public.orders o
  SET
    template_id = v_template_id,
    template_version = v_template_version,
    updated_at = now()
  WHERE o.id = p_order_id
    AND o.template_selection_mode = 'service_default'
    AND (
      o.template_id IS DISTINCT FROM v_template_id
      OR o.template_version IS DISTINCT FROM v_template_version
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.order_services_sync_order_template_trigger()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.sync_order_template_from_services(OLD.order_id);
    RETURN OLD;
  END IF;

  PERFORM public.sync_order_template_from_services(NEW.order_id);

  IF TG_OP = 'UPDATE' AND OLD.order_id IS DISTINCT FROM NEW.order_id THEN
    PERFORM public.sync_order_template_from_services(OLD.order_id);
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS order_services_sync_order_template ON public.order_services;
CREATE TRIGGER order_services_sync_order_template
AFTER INSERT OR UPDATE OR DELETE ON public.order_services
FOR EACH ROW
EXECUTE FUNCTION public.order_services_sync_order_template_trigger();

CREATE OR REPLACE FUNCTION public.orders_template_guard_trigger()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_template_version integer;
  v_sync_context text;
BEGIN
  IF NEW.template_selection_mode IS NULL THEN
    NEW.template_selection_mode := CASE
      WHEN NEW.template_id IS NULL THEN 'service_default'
      ELSE 'order_override'
    END;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF NEW.template_id IS DISTINCT FROM OLD.template_id THEN
      IF OLD.template_locked_at IS NOT NULL THEN
        RAISE EXCEPTION 'Inspection template is locked after start and cannot be changed.';
      END IF;

      v_sync_context := COALESCE(current_setting('inspectos.template_sync', true), '');
      IF v_sync_context <> '1' THEN
        NEW.template_selection_mode := CASE
          WHEN NEW.template_id IS NULL THEN 'service_default'
          ELSE 'order_override'
        END;
      END IF;
    END IF;

    IF OLD.status NOT IN ('in_progress', 'pending_report', 'delivered', 'completed')
      AND NEW.status IN ('in_progress', 'pending_report', 'delivered', 'completed')
      AND NEW.template_locked_at IS NULL THEN
      NEW.template_locked_at := now();
    END IF;
  END IF;

  IF NEW.template_id IS NULL THEN
    NEW.template_version := NULL;
  ELSE
    SELECT t.version
    INTO v_template_version
    FROM public.templates t
    WHERE t.id = NEW.template_id;

    NEW.template_version := v_template_version;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS orders_template_guard ON public.orders;
CREATE TRIGGER orders_template_guard
BEFORE INSERT OR UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.orders_template_guard_trigger();

-- Backfill default-mode orders from their currently selected service templates.
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT o.id
    FROM public.orders o
    WHERE o.template_selection_mode = 'service_default'
  LOOP
    PERFORM public.sync_order_template_from_services(r.id);
  END LOOP;
END;
$$;
