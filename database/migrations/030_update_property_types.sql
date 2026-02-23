-- Update property types to inspector-facing categories

ALTER TABLE properties
  DROP CONSTRAINT IF EXISTS properties_property_type_check;

-- Normalize existing values
UPDATE properties
SET property_type = 'single-family'
WHERE property_type IN ('residential', 'other');

-- Update check constraint
ALTER TABLE properties
  ADD CONSTRAINT properties_property_type_check
  CHECK (property_type IN ('single-family', 'condo-townhome', 'multi-family', 'manufactured', 'commercial'));

ALTER TABLE properties
  ALTER COLUMN property_type SET DEFAULT 'single-family';
