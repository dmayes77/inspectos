-- =====================================================
-- Add logo_url to agencies
-- =====================================================

ALTER TABLE agencies
  ADD COLUMN IF NOT EXISTS logo_url TEXT;
