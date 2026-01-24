-- Query to check if columns exist and see sample data
SELECT
  id,
  address_line1,
  property_type,
  garage,
  foundation,
  basement,
  heating_type,
  cooling_type,
  roof_type,
  building_class,
  laundry_type,
  created_at
FROM properties
ORDER BY created_at DESC
LIMIT 5;
