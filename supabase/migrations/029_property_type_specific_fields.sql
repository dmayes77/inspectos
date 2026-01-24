-- Add property type-specific fields

ALTER TABLE properties
  -- Residential specific
  ADD COLUMN basement TEXT CHECK (basement IN ('none', 'unfinished', 'finished', 'partial')),
  ADD COLUMN lot_size_acres NUMERIC(10, 2),
  ADD COLUMN heating_type TEXT,
  ADD COLUMN cooling_type TEXT,
  ADD COLUMN roof_type TEXT,

  -- Commercial specific
  ADD COLUMN building_class TEXT CHECK (building_class IN ('A', 'B', 'C')),
  ADD COLUMN loading_docks INTEGER,
  ADD COLUMN zoning TEXT,
  ADD COLUMN occupancy_type TEXT,
  ADD COLUMN ceiling_height NUMERIC(5, 1),

  -- Multi-family specific
  ADD COLUMN number_of_units INTEGER,
  ADD COLUMN unit_mix TEXT,
  ADD COLUMN laundry_type TEXT CHECK (laundry_type IN ('in-unit', 'shared', 'none')),

  -- Shared (commercial/multi-family)
  ADD COLUMN parking_spaces INTEGER,
  ADD COLUMN elevator BOOLEAN;

-- Add comments for clarity
COMMENT ON COLUMN properties.basement IS 'Residential: Basement type';
COMMENT ON COLUMN properties.lot_size_acres IS 'Residential: Lot size in acres';
COMMENT ON COLUMN properties.building_class IS 'Commercial: Building classification (A, B, C)';
COMMENT ON COLUMN properties.loading_docks IS 'Commercial: Number of loading docks';
COMMENT ON COLUMN properties.zoning IS 'Commercial/Multi-family: Zoning classification';
COMMENT ON COLUMN properties.occupancy_type IS 'Commercial: Type of occupancy';
COMMENT ON COLUMN properties.number_of_units IS 'Commercial/Multi-family: Number of units or suites';
COMMENT ON COLUMN properties.unit_mix IS 'Multi-family: Description of unit types (e.g., "4x 2BR, 2x 1BR")';
COMMENT ON COLUMN properties.laundry_type IS 'Multi-family: Type of laundry facilities';
COMMENT ON COLUMN properties.parking_spaces IS 'Commercial/Multi-family: Number of parking spaces';
COMMENT ON COLUMN properties.elevator IS 'Multi-family/Commercial: Building has elevator';
