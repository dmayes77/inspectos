-- Track service/package selections directly on inspections
ALTER TABLE inspections
  ADD COLUMN IF NOT EXISTS selected_type_ids UUID[] DEFAULT '{}'::UUID[];
