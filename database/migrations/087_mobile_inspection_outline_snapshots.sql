-- =====================================================
-- Order-level mobile inspection outline snapshots
-- =====================================================

ALTER TABLE public.mobile_inspection_custom_sections
  ADD COLUMN IF NOT EXISTS source_template_section_id uuid REFERENCES public.template_sections(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS is_hidden boolean NOT NULL DEFAULT false;

ALTER TABLE public.mobile_inspection_custom_items
  ADD COLUMN IF NOT EXISTS source_template_item_id uuid REFERENCES public.template_items(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_hidden boolean NOT NULL DEFAULT false;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mobile_inspection_snapshot_sections_source
  ON public.mobile_inspection_custom_sections (order_id, source_template_section_id)
  WHERE source_template_section_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mobile_inspection_snapshot_items_source
  ON public.mobile_inspection_custom_items (order_id, source_template_item_id)
  WHERE source_template_item_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_mobile_inspection_custom_sections_visible
  ON public.mobile_inspection_custom_sections (tenant_id, order_id, is_hidden, sort_order, created_at);

CREATE INDEX IF NOT EXISTS idx_mobile_inspection_custom_items_visible
  ON public.mobile_inspection_custom_items (tenant_id, order_id, is_hidden, section_id, sort_order, created_at);
