-- =====================================================
-- Template metadata extensions
-- =====================================================

ALTER TABLE templates
  ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'inspection'
    CHECK (type IN ('inspection', 'agreement', 'report')),
  ADD COLUMN IF NOT EXISTS standard TEXT,
  ADD COLUMN IF NOT EXISTS is_default BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS usage_count INTEGER NOT NULL DEFAULT 0;
