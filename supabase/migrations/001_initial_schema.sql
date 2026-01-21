-- =====================================================
-- InspectOS Database Schema
-- Run this in your Supabase SQL Editor
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- TENANTS & USERS
-- =====================================================

-- Tenants (companies/organizations)
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tenants_slug ON tenants(slug);

-- User profiles (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tenant memberships (users belong to tenants)
CREATE TABLE tenant_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'inspector' CHECK (role IN ('owner', 'admin', 'inspector', 'viewer')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, user_id)
);

CREATE INDEX idx_tenant_members_tenant ON tenant_members(tenant_id);
CREATE INDEX idx_tenant_members_user ON tenant_members(user_id);

-- =====================================================
-- TEMPLATES
-- =====================================================

-- Inspection templates
CREATE TABLE templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_templates_tenant ON templates(tenant_id);
CREATE INDEX idx_templates_active ON templates(tenant_id, is_active);

-- Template sections
CREATE TABLE template_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_template_sections_template ON template_sections(template_id);

-- Template items (checklist items)
CREATE TABLE template_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID NOT NULL REFERENCES template_sections(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  item_type TEXT NOT NULL DEFAULT 'checkbox' CHECK (item_type IN ('checkbox', 'rating', 'text', 'number', 'select', 'photo')),
  options JSONB, -- For select type: [{value, label}]
  is_required BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_template_items_section ON template_items(section_id);

-- =====================================================
-- DEFECT LIBRARY
-- =====================================================

CREATE TABLE defect_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  severity TEXT NOT NULL DEFAULT 'minor' CHECK (severity IN ('minor', 'moderate', 'major', 'safety')),
  recommendation TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_defect_library_tenant ON defect_library(tenant_id);
CREATE INDEX idx_defect_library_category ON defect_library(tenant_id, category);

-- =====================================================
-- CLIENTS & PROPERTIES
-- =====================================================

-- Clients (property owners, agents, etc.)
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_clients_tenant ON clients(tenant_id);

-- Properties (locations being inspected)
CREATE TABLE properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip_code TEXT NOT NULL,
  property_type TEXT DEFAULT 'residential' CHECK (property_type IN ('residential', 'commercial', 'multi-family', 'other')),
  year_built INTEGER,
  square_feet INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_properties_tenant ON properties(tenant_id);
CREATE INDEX idx_properties_client ON properties(client_id);

-- =====================================================
-- JOBS
-- =====================================================

CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES properties(id),
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  template_id UUID NOT NULL REFERENCES templates(id),
  inspector_id UUID NOT NULL REFERENCES profiles(id),
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  scheduled_date DATE NOT NULL,
  scheduled_time TIME,
  duration_minutes INTEGER DEFAULT 120,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_jobs_tenant ON jobs(tenant_id);
CREATE INDEX idx_jobs_inspector ON jobs(inspector_id);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_scheduled ON jobs(scheduled_date);
CREATE INDEX idx_jobs_inspector_date ON jobs(inspector_id, scheduled_date);

-- =====================================================
-- INSPECTIONS
-- =====================================================

CREATE TABLE inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES templates(id),
  template_version INTEGER NOT NULL,
  inspector_id UUID NOT NULL REFERENCES profiles(id),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'in_progress', 'completed', 'submitted')),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  weather_conditions TEXT,
  temperature TEXT,
  present_parties JSONB, -- Array of names
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_inspections_job ON inspections(job_id);
CREATE INDEX idx_inspections_tenant ON inspections(tenant_id);
CREATE INDEX idx_inspections_status ON inspections(status);

-- Inspection answers
CREATE TABLE answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id UUID NOT NULL REFERENCES inspections(id) ON DELETE CASCADE,
  template_item_id UUID NOT NULL REFERENCES template_items(id),
  section_id UUID NOT NULL REFERENCES template_sections(id),
  value TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_answers_inspection ON answers(inspection_id);
CREATE UNIQUE INDEX idx_answers_inspection_item ON answers(inspection_id, template_item_id);

-- Findings (issues discovered)
CREATE TABLE findings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id UUID NOT NULL REFERENCES inspections(id) ON DELETE CASCADE,
  section_id UUID REFERENCES template_sections(id),
  template_item_id UUID REFERENCES template_items(id),
  defect_library_id UUID REFERENCES defect_library(id),
  title TEXT NOT NULL,
  description TEXT,
  severity TEXT NOT NULL DEFAULT 'minor' CHECK (severity IN ('minor', 'moderate', 'major', 'safety')),
  location TEXT,
  recommendation TEXT,
  estimated_cost_min DECIMAL(10,2),
  estimated_cost_max DECIMAL(10,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_findings_inspection ON findings(inspection_id);
CREATE INDEX idx_findings_severity ON findings(severity);

-- Signatures
CREATE TABLE signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id UUID NOT NULL REFERENCES inspections(id) ON DELETE CASCADE,
  signer_name TEXT NOT NULL,
  signer_type TEXT NOT NULL CHECK (signer_type IN ('inspector', 'client', 'agent', 'other')),
  signature_data TEXT NOT NULL, -- Base64 encoded
  signed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_signatures_inspection ON signatures(inspection_id);

-- =====================================================
-- MEDIA
-- =====================================================

CREATE TABLE media_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  inspection_id UUID REFERENCES inspections(id) ON DELETE CASCADE,
  finding_id UUID REFERENCES findings(id) ON DELETE CASCADE,
  answer_id UUID REFERENCES answers(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  caption TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_media_tenant ON media_assets(tenant_id);
CREATE INDEX idx_media_inspection ON media_assets(inspection_id);
CREATE INDEX idx_media_finding ON media_assets(finding_id);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON tenants FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_tenant_members_updated_at BEFORE UPDATE ON tenant_members FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_templates_updated_at BEFORE UPDATE ON templates FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_template_sections_updated_at BEFORE UPDATE ON template_sections FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_template_items_updated_at BEFORE UPDATE ON template_items FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_defect_library_updated_at BEFORE UPDATE ON defect_library FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON properties FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON jobs FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_inspections_updated_at BEFORE UPDATE ON inspections FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_answers_updated_at BEFORE UPDATE ON answers FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_findings_updated_at BEFORE UPDATE ON findings FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE defect_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_assets ENABLE ROW LEVEL SECURITY;

-- Helper function: check if user is member of tenant
CREATE OR REPLACE FUNCTION is_tenant_member(tenant_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM tenant_members
    WHERE tenant_members.tenant_id = $1
    AND tenant_members.user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles: users can read/update their own profile
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Tenants: members can view their tenants
CREATE POLICY "Members can view tenants" ON tenants FOR SELECT USING (is_tenant_member(id));
CREATE POLICY "Anyone can create tenants" ON tenants FOR INSERT WITH CHECK (true);
CREATE POLICY "Owners can update tenants" ON tenants FOR UPDATE USING (
  EXISTS (SELECT 1 FROM tenant_members WHERE tenant_id = id AND user_id = auth.uid() AND role = 'owner')
);

-- Tenant members: members can view other members
CREATE POLICY "Members can view memberships" ON tenant_members FOR SELECT USING (is_tenant_member(tenant_id));
CREATE POLICY "Owners can manage memberships" ON tenant_members FOR ALL USING (
  EXISTS (SELECT 1 FROM tenant_members tm WHERE tm.tenant_id = tenant_members.tenant_id AND tm.user_id = auth.uid() AND tm.role IN ('owner', 'admin'))
);
CREATE POLICY "Users can create own membership" ON tenant_members FOR INSERT WITH CHECK (user_id = auth.uid());

-- Templates: tenant members can view, admins can modify
CREATE POLICY "Members can view templates" ON templates FOR SELECT USING (is_tenant_member(tenant_id));
CREATE POLICY "Admins can manage templates" ON templates FOR ALL USING (
  EXISTS (SELECT 1 FROM tenant_members WHERE tenant_id = templates.tenant_id AND user_id = auth.uid() AND role IN ('owner', 'admin'))
);

-- Template sections: same as templates
CREATE POLICY "Members can view sections" ON template_sections FOR SELECT USING (
  EXISTS (SELECT 1 FROM templates t WHERE t.id = template_id AND is_tenant_member(t.tenant_id))
);
CREATE POLICY "Admins can manage sections" ON template_sections FOR ALL USING (
  EXISTS (SELECT 1 FROM templates t JOIN tenant_members tm ON tm.tenant_id = t.tenant_id WHERE t.id = template_id AND tm.user_id = auth.uid() AND tm.role IN ('owner', 'admin'))
);

-- Template items: same as templates
CREATE POLICY "Members can view items" ON template_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM template_sections ts JOIN templates t ON t.id = ts.template_id WHERE ts.id = section_id AND is_tenant_member(t.tenant_id))
);
CREATE POLICY "Admins can manage items" ON template_items FOR ALL USING (
  EXISTS (SELECT 1 FROM template_sections ts JOIN templates t ON t.id = ts.template_id JOIN tenant_members tm ON tm.tenant_id = t.tenant_id WHERE ts.id = section_id AND tm.user_id = auth.uid() AND tm.role IN ('owner', 'admin'))
);

-- Defect library: tenant members can view, admins can modify
CREATE POLICY "Members can view defects" ON defect_library FOR SELECT USING (is_tenant_member(tenant_id));
CREATE POLICY "Admins can manage defects" ON defect_library FOR ALL USING (
  EXISTS (SELECT 1 FROM tenant_members WHERE tenant_id = defect_library.tenant_id AND user_id = auth.uid() AND role IN ('owner', 'admin'))
);

-- Clients: tenant members can manage
CREATE POLICY "Members can view clients" ON clients FOR SELECT USING (is_tenant_member(tenant_id));
CREATE POLICY "Members can manage clients" ON clients FOR ALL USING (is_tenant_member(tenant_id));

-- Properties: tenant members can manage
CREATE POLICY "Members can view properties" ON properties FOR SELECT USING (is_tenant_member(tenant_id));
CREATE POLICY "Members can manage properties" ON properties FOR ALL USING (is_tenant_member(tenant_id));

-- Jobs: inspectors can view assigned, admins can view all
CREATE POLICY "Inspectors can view assigned jobs" ON jobs FOR SELECT USING (
  is_tenant_member(tenant_id) AND (inspector_id = auth.uid() OR EXISTS (SELECT 1 FROM tenant_members WHERE tenant_id = jobs.tenant_id AND user_id = auth.uid() AND role IN ('owner', 'admin')))
);
CREATE POLICY "Admins can manage jobs" ON jobs FOR ALL USING (
  EXISTS (SELECT 1 FROM tenant_members WHERE tenant_id = jobs.tenant_id AND user_id = auth.uid() AND role IN ('owner', 'admin'))
);
CREATE POLICY "Inspectors can update own jobs" ON jobs FOR UPDATE USING (inspector_id = auth.uid());

-- Inspections: same as jobs
CREATE POLICY "Members can view inspections" ON inspections FOR SELECT USING (is_tenant_member(tenant_id));
CREATE POLICY "Inspectors can manage own inspections" ON inspections FOR ALL USING (inspector_id = auth.uid());

-- Answers: tied to inspections
CREATE POLICY "Members can view answers" ON answers FOR SELECT USING (
  EXISTS (SELECT 1 FROM inspections i WHERE i.id = inspection_id AND is_tenant_member(i.tenant_id))
);
CREATE POLICY "Inspectors can manage answers" ON answers FOR ALL USING (
  EXISTS (SELECT 1 FROM inspections i WHERE i.id = inspection_id AND i.inspector_id = auth.uid())
);

-- Findings: tied to inspections
CREATE POLICY "Members can view findings" ON findings FOR SELECT USING (
  EXISTS (SELECT 1 FROM inspections i WHERE i.id = inspection_id AND is_tenant_member(i.tenant_id))
);
CREATE POLICY "Inspectors can manage findings" ON findings FOR ALL USING (
  EXISTS (SELECT 1 FROM inspections i WHERE i.id = inspection_id AND i.inspector_id = auth.uid())
);

-- Signatures: tied to inspections
CREATE POLICY "Members can view signatures" ON signatures FOR SELECT USING (
  EXISTS (SELECT 1 FROM inspections i WHERE i.id = inspection_id AND is_tenant_member(i.tenant_id))
);
CREATE POLICY "Inspectors can add signatures" ON signatures FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM inspections i WHERE i.id = inspection_id AND i.inspector_id = auth.uid())
);

-- Media assets: tied to tenant
CREATE POLICY "Members can view media" ON media_assets FOR SELECT USING (is_tenant_member(tenant_id));
CREATE POLICY "Members can upload media" ON media_assets FOR INSERT WITH CHECK (is_tenant_member(tenant_id));
CREATE POLICY "Uploaders can delete own media" ON media_assets FOR DELETE USING (
  EXISTS (SELECT 1 FROM inspections i WHERE i.id = inspection_id AND i.inspector_id = auth.uid())
);

-- =====================================================
-- STORAGE BUCKET
-- =====================================================

-- Create storage bucket for inspection media
INSERT INTO storage.buckets (id, name, public)
VALUES ('inspections', 'inspections', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'inspections');

CREATE POLICY "Anyone can view inspection media"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'inspections');

CREATE POLICY "Users can delete own uploads"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'inspections' AND auth.uid()::text = (storage.foldername(name))[1]);
