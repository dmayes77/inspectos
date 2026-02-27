-- Add a primary contact person field for vendors.
ALTER TABLE public.vendors
  ADD COLUMN IF NOT EXISTS contact_person TEXT;
