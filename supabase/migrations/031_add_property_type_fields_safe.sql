-- Add property type-specific fields (safe version with IF NOT EXISTS checks)

-- Residential specific
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'properties' AND column_name = 'basement') THEN
    ALTER TABLE properties ADD COLUMN basement TEXT CHECK (basement IN ('none', 'unfinished', 'finished', 'partial'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'properties' AND column_name = 'lot_size_acres') THEN
    ALTER TABLE properties ADD COLUMN lot_size_acres NUMERIC(10, 2);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'properties' AND column_name = 'heating_type') THEN
    ALTER TABLE properties ADD COLUMN heating_type TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'properties' AND column_name = 'cooling_type') THEN
    ALTER TABLE properties ADD COLUMN cooling_type TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'properties' AND column_name = 'roof_type') THEN
    ALTER TABLE properties ADD COLUMN roof_type TEXT;
  END IF;
END $$;

-- Commercial specific
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'properties' AND column_name = 'building_class') THEN
    ALTER TABLE properties ADD COLUMN building_class TEXT CHECK (building_class IN ('A', 'B', 'C'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'properties' AND column_name = 'loading_docks') THEN
    ALTER TABLE properties ADD COLUMN loading_docks INTEGER;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'properties' AND column_name = 'zoning') THEN
    ALTER TABLE properties ADD COLUMN zoning TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'properties' AND column_name = 'occupancy_type') THEN
    ALTER TABLE properties ADD COLUMN occupancy_type TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'properties' AND column_name = 'ceiling_height') THEN
    ALTER TABLE properties ADD COLUMN ceiling_height NUMERIC(5, 1);
  END IF;
END $$;

-- Multi-family specific
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'properties' AND column_name = 'number_of_units') THEN
    ALTER TABLE properties ADD COLUMN number_of_units INTEGER;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'properties' AND column_name = 'unit_mix') THEN
    ALTER TABLE properties ADD COLUMN unit_mix TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'properties' AND column_name = 'laundry_type') THEN
    ALTER TABLE properties ADD COLUMN laundry_type TEXT CHECK (laundry_type IN ('in-unit', 'shared', 'none'));
  END IF;
END $$;

-- Shared (commercial/multi-family)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'properties' AND column_name = 'parking_spaces') THEN
    ALTER TABLE properties ADD COLUMN parking_spaces INTEGER;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'properties' AND column_name = 'elevator') THEN
    ALTER TABLE properties ADD COLUMN elevator BOOLEAN;
  END IF;
END $$;

-- Add comments for clarity
COMMENT ON COLUMN properties.basement IS 'Residential: Basement type';
COMMENT ON COLUMN properties.lot_size_acres IS 'Residential: Lot size in acres';
COMMENT ON COLUMN properties.heating_type IS 'Residential: Heating system type';
COMMENT ON COLUMN properties.cooling_type IS 'Residential: Cooling system type';
COMMENT ON COLUMN properties.roof_type IS 'Residential: Roof material/type';
COMMENT ON COLUMN properties.building_class IS 'Commercial: Building classification (A, B, C)';
COMMENT ON COLUMN properties.loading_docks IS 'Commercial: Number of loading docks';
COMMENT ON COLUMN properties.zoning IS 'Commercial/Multi-family: Zoning classification';
COMMENT ON COLUMN properties.occupancy_type IS 'Commercial: Type of occupancy';
COMMENT ON COLUMN properties.ceiling_height IS 'Commercial: Ceiling height in feet';
COMMENT ON COLUMN properties.number_of_units IS 'Commercial/Multi-family: Number of units or suites';
COMMENT ON COLUMN properties.unit_mix IS 'Multi-family: Description of unit types (e.g., "4x 2BR, 2x 1BR")';
COMMENT ON COLUMN properties.laundry_type IS 'Multi-family: Type of laundry facilities';
COMMENT ON COLUMN properties.parking_spaces IS 'Commercial/Multi-family: Number of parking spaces';
COMMENT ON COLUMN properties.elevator IS 'Multi-family/Commercial: Building has elevator';
