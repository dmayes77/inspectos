-- =====================================================
-- Property Ownership History
-- Tracks every client that has owned a property (current and past)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.property_owners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE RESTRICT,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT property_owners_date_range_check CHECK (end_date IS NULL OR end_date >= start_date)
);

CREATE INDEX IF NOT EXISTS property_owners_tenant_id_idx ON public.property_owners (tenant_id);
CREATE INDEX IF NOT EXISTS property_owners_property_id_idx ON public.property_owners (property_id);
CREATE INDEX IF NOT EXISTS property_owners_client_id_idx ON public.property_owners (client_id);
CREATE INDEX IF NOT EXISTS property_owners_current_owner_idx
  ON public.property_owners (property_id)
  WHERE end_date IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS property_owners_one_current_primary_owner
  ON public.property_owners (property_id)
  WHERE end_date IS NULL AND is_primary = TRUE;

CREATE UNIQUE INDEX IF NOT EXISTS property_owners_no_duplicate_current_owner
  ON public.property_owners (property_id, client_id)
  WHERE end_date IS NULL;

CREATE OR REPLACE FUNCTION public.update_property_owners_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_property_owners_updated_at
  BEFORE UPDATE ON public.property_owners
  FOR EACH ROW EXECUTE FUNCTION public.update_property_owners_updated_at();

ALTER TABLE public.property_owners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view property owners" ON public.property_owners
  FOR SELECT USING (public.is_tenant_member(tenant_id));

CREATE POLICY "Members can insert property owners" ON public.property_owners
  FOR INSERT WITH CHECK (public.is_tenant_member(tenant_id));

CREATE POLICY "Members can update property owners" ON public.property_owners
  FOR UPDATE USING (public.is_tenant_member(tenant_id));

CREATE POLICY "Members can delete property owners" ON public.property_owners
  FOR DELETE USING (public.is_tenant_member(tenant_id));
