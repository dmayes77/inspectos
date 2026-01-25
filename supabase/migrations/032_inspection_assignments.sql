-- =====================================================
-- Inspection Assignments Schema
-- Allow multiple inspectors (lead/assistant/tech) per inspection,
-- enforce current assignment rules, and provide helpers for RLS.
-- =====================================================

CREATE TABLE IF NOT EXISTS public.inspection_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  inspection_id UUID NOT NULL REFERENCES public.inspections(id) ON DELETE CASCADE,
  inspector_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'lead' CHECK (role IN ('lead', 'assistant', 'tech')),
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  unassigned_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS inspection_assignments_tenant_idx
  ON public.inspection_assignments (tenant_id);

CREATE INDEX IF NOT EXISTS inspection_assignments_inspection_idx
  ON public.inspection_assignments (inspection_id);

CREATE INDEX IF NOT EXISTS inspection_assignments_inspector_idx
  ON public.inspection_assignments (inspector_id);

CREATE UNIQUE INDEX IF NOT EXISTS inspection_assignments_one_current_lead
  ON public.inspection_assignments (inspection_id)
  WHERE role = 'lead' AND unassigned_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS inspection_assignments_no_duplicate_current
  ON public.inspection_assignments (inspection_id, inspector_id)
  WHERE unassigned_at IS NULL;

CREATE OR REPLACE FUNCTION public.update_inspection_assignments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_inspection_assignments_updated_at
  BEFORE UPDATE ON public.inspection_assignments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_inspection_assignments_updated_at();

CREATE OR REPLACE FUNCTION public.is_assigned_inspector(p_inspection_id UUID, p_inspector_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.inspection_assignments ia
    WHERE ia.inspection_id = p_inspection_id
      AND ia.inspector_id = p_inspector_id
      AND ia.unassigned_at IS NULL
  );
END;
$$ LANGUAGE plpgsql STABLE;

ALTER TABLE public.inspection_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view inspection assignments" ON public.inspection_assignments
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM public.tenants t
      WHERE t.id = tenant_id
        AND public.is_tenant_member(tenant_id)
    )
  );

CREATE POLICY "Members can insert inspection assignments" ON public.inspection_assignments
  FOR INSERT WITH CHECK (public.is_tenant_member(tenant_id));

CREATE POLICY "Members can update assignments" ON public.inspection_assignments
  FOR UPDATE USING (public.is_tenant_member(tenant_id));

CREATE POLICY "Members can delete assignments" ON public.inspection_assignments
  FOR DELETE USING (public.is_tenant_member(tenant_id));
