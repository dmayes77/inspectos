/**
 * SQLite Schema for InspectOS Offline Database
 *
 * Tables are organized by purpose:
 * - Sync tables: outbox, sync_state
 * - Reference data: templates, template_sections, template_items
 * - Job data: jobs, properties, clients
 * - Inspection data: inspections, answers, findings
 * - Media: media_assets
 */

export const SCHEMA_VERSION = 1;

export const CREATE_TABLES_SQL = `
-- =====================================================
-- SYNC TABLES
-- =====================================================

-- Outbox: queued mutations to sync to server
CREATE TABLE IF NOT EXISTS outbox (
  id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  operation TEXT NOT NULL CHECK (operation IN ('upsert', 'delete')),
  payload TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  attempts INTEGER NOT NULL DEFAULT 0,
  last_attempt_at TEXT,
  error TEXT,
  synced_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_outbox_pending ON outbox(synced_at) WHERE synced_at IS NULL;

-- Sync state: track last sync cursors per entity type
CREATE TABLE IF NOT EXISTS sync_state (
  entity_type TEXT PRIMARY KEY,
  last_synced_at TEXT,
  cursor TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- =====================================================
-- REFERENCE DATA (downloaded from server)
-- =====================================================

-- Inspection templates
CREATE TABLE IF NOT EXISTS templates (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  synced_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_templates_tenant ON templates(tenant_id);

-- Template sections
CREATE TABLE IF NOT EXISTS template_sections (
  id TEXT PRIMARY KEY,
  template_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (template_id) REFERENCES templates(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_template_sections_template ON template_sections(template_id);

-- Template items (checklist items within sections)
CREATE TABLE IF NOT EXISTS template_items (
  id TEXT PRIMARY KEY,
  section_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  item_type TEXT NOT NULL DEFAULT 'checkbox' CHECK (item_type IN ('checkbox', 'rating', 'text', 'number', 'select', 'photo')),
  options TEXT, -- JSON array for select options
  is_required INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (section_id) REFERENCES template_sections(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_template_items_section ON template_items(section_id);

-- Defect library (canned findings/recommendations)
CREATE TABLE IF NOT EXISTS defect_library (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  category TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  severity TEXT NOT NULL DEFAULT 'minor' CHECK (severity IN ('minor', 'moderate', 'major', 'safety')),
  recommendation TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  synced_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_defect_library_tenant ON defect_library(tenant_id);
CREATE INDEX IF NOT EXISTS idx_defect_library_category ON defect_library(category);

-- Services (available offerings for jobs/inspections)
CREATE TABLE IF NOT EXISTS services (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'core' CHECK (category IN ('core', 'addon')),
  price REAL,
  duration_minutes INTEGER DEFAULT 60,
  template_id TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  synced_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_services_tenant ON services(tenant_id);
CREATE INDEX IF NOT EXISTS idx_services_category ON services(tenant_id, category);

-- =====================================================
-- JOB DATA
-- =====================================================

-- Clients (property owners, agents, etc.)
CREATE TABLE IF NOT EXISTS clients (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  synced_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_clients_tenant ON clients(tenant_id);

-- Properties (locations being inspected)
CREATE TABLE IF NOT EXISTS properties (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  client_id TEXT,
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip_code TEXT NOT NULL,
  property_type TEXT DEFAULT 'residential' CHECK (property_type IN ('residential', 'commercial', 'multi-family', 'other')),
  year_built INTEGER,
  square_feet INTEGER,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  synced_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_properties_tenant ON properties(tenant_id);
CREATE INDEX IF NOT EXISTS idx_properties_client ON properties(client_id);

-- Jobs (scheduled inspections)
CREATE TABLE IF NOT EXISTS jobs (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  property_id TEXT NOT NULL,
  client_id TEXT,
  template_id TEXT NOT NULL,
  inspector_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  scheduled_date TEXT NOT NULL,
  scheduled_time TEXT,
  duration_minutes INTEGER DEFAULT 120,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  synced_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (property_id) REFERENCES properties(id),
  FOREIGN KEY (client_id) REFERENCES clients(id),
  FOREIGN KEY (template_id) REFERENCES templates(id)
);

CREATE INDEX IF NOT EXISTS idx_jobs_tenant ON jobs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_jobs_inspector ON jobs(inspector_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_scheduled ON jobs(scheduled_date);

-- =====================================================
-- INSPECTION DATA (created offline)
-- =====================================================

-- Inspections (the actual inspection record)
CREATE TABLE IF NOT EXISTS inspections (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  template_id TEXT NOT NULL,
  template_version INTEGER NOT NULL,
  inspector_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'in_progress', 'completed', 'submitted')),
  started_at TEXT,
  completed_at TEXT,
  weather_conditions TEXT,
  temperature TEXT,
  present_parties TEXT, -- JSON array of people present
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  synced_at TEXT,
  FOREIGN KEY (job_id) REFERENCES jobs(id)
);

CREATE INDEX IF NOT EXISTS idx_inspections_job ON inspections(job_id);
CREATE INDEX IF NOT EXISTS idx_inspections_tenant ON inspections(tenant_id);
CREATE INDEX IF NOT EXISTS idx_inspections_status ON inspections(status);
CREATE INDEX IF NOT EXISTS idx_inspections_unsynced ON inspections(synced_at) WHERE synced_at IS NULL;

-- Inspection answers (responses to template items)
CREATE TABLE IF NOT EXISTS answers (
  id TEXT PRIMARY KEY,
  inspection_id TEXT NOT NULL,
  template_item_id TEXT NOT NULL,
  section_id TEXT NOT NULL,
  value TEXT, -- Actual answer value
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (inspection_id) REFERENCES inspections(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_answers_inspection ON answers(inspection_id);
CREATE INDEX IF NOT EXISTS idx_answers_item ON answers(template_item_id);

-- Findings (issues discovered during inspection)
CREATE TABLE IF NOT EXISTS findings (
  id TEXT PRIMARY KEY,
  inspection_id TEXT NOT NULL,
  section_id TEXT,
  template_item_id TEXT,
  defect_library_id TEXT, -- Link to canned defect if used
  title TEXT NOT NULL,
  description TEXT,
  severity TEXT NOT NULL DEFAULT 'minor' CHECK (severity IN ('minor', 'moderate', 'major', 'safety')),
  location TEXT, -- Where in the property
  recommendation TEXT,
  estimated_cost_min REAL,
  estimated_cost_max REAL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (inspection_id) REFERENCES inspections(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_findings_inspection ON findings(inspection_id);
CREATE INDEX IF NOT EXISTS idx_findings_severity ON findings(severity);

-- Signatures
CREATE TABLE IF NOT EXISTS signatures (
  id TEXT PRIMARY KEY,
  inspection_id TEXT NOT NULL,
  signer_name TEXT NOT NULL,
  signer_type TEXT NOT NULL CHECK (signer_type IN ('inspector', 'client', 'agent', 'other')),
  signature_data TEXT NOT NULL, -- Base64 encoded signature image
  signed_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (inspection_id) REFERENCES inspections(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_signatures_inspection ON signatures(inspection_id);

-- =====================================================
-- MEDIA
-- =====================================================

-- Media assets (photos, documents)
CREATE TABLE IF NOT EXISTS media_assets (
  id TEXT PRIMARY KEY,
  inspection_id TEXT,
  finding_id TEXT,
  answer_id TEXT,
  local_path TEXT NOT NULL,
  remote_url TEXT,
  file_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  sha256 TEXT,
  caption TEXT,
  upload_state TEXT NOT NULL DEFAULT 'pending' CHECK (upload_state IN ('pending', 'uploading', 'uploaded', 'failed')),
  upload_attempts INTEGER NOT NULL DEFAULT 0,
  last_upload_attempt TEXT,
  upload_error TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (inspection_id) REFERENCES inspections(id) ON DELETE CASCADE,
  FOREIGN KEY (finding_id) REFERENCES findings(id) ON DELETE CASCADE,
  FOREIGN KEY (answer_id) REFERENCES answers(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_media_inspection ON media_assets(inspection_id);
CREATE INDEX IF NOT EXISTS idx_media_finding ON media_assets(finding_id);
CREATE INDEX IF NOT EXISTS idx_media_upload_state ON media_assets(upload_state);
CREATE INDEX IF NOT EXISTS idx_media_pending ON media_assets(upload_state) WHERE upload_state = 'pending';

-- =====================================================
-- USER DATA
-- =====================================================

-- Current user profile (cached)
CREATE TABLE IF NOT EXISTS user_profile (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL,
  avatar_url TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- App settings
CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`;

export const INITIAL_SETTINGS = `
INSERT OR IGNORE INTO app_settings (key, value) VALUES
  ('last_tenant_slug', ''),
  ('offline_mode', 'auto'),
  ('auto_sync', 'true'),
  ('sync_wifi_only', 'false');
`;
