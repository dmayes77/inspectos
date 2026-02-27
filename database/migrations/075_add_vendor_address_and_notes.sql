-- Add address and notes fields for vendors to support inline editing on detail pages.
ALTER TABLE public.vendors
  ADD COLUMN IF NOT EXISTS address_line1 TEXT,
  ADD COLUMN IF NOT EXISTS address_line2 TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS state_region TEXT,
  ADD COLUMN IF NOT EXISTS postal_code TEXT,
  ADD COLUMN IF NOT EXISTS country TEXT,
  ADD COLUMN IF NOT EXISTS notes TEXT;
