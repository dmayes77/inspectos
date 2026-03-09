-- =====================================================
-- Backfill order service templates from service defaults
-- =====================================================
-- Purpose:
-- 1) Populate historical order_services.template_id when null
--    using the linked services.template_id.
-- 2) Re-sync orders.template_id/template_version for orders
--    still in service_default mode.

-- Step 1: Backfill per-service template snapshots on existing orders.
UPDATE public.order_services os
SET template_id = s.template_id
FROM public.services s
WHERE os.service_id = s.id
  AND os.template_id IS NULL
  AND s.template_id IS NOT NULL;

-- Step 2: Recompute order-level template for service-default orders.
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

