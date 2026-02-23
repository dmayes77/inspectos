-- =====================================================
-- Sample Data for Testing
-- Run this AFTER 001_initial_schema.sql
-- =====================================================

-- Note: You'll need to create a user first via Supabase Auth
-- Then update the UUIDs below to match

-- Sample Tenant
INSERT INTO tenants (id, name, slug) VALUES
  ('f54f7c28-2dc7-4bc3-9c23-0a1dca0bd4e3', 'Demo Company', 'demo')
ON CONFLICT (id) DO NOTHING;

-- Sample Template: Standard Home Inspection
INSERT INTO templates (id, tenant_id, name, description, version) VALUES
  ('22222222-2222-2222-2222-222222222222', 'f54f7c28-2dc7-4bc3-9c23-0a1dca0bd4e3', 'Standard Home Inspection', 'Complete residential home inspection template', 1);

-- Template Sections
INSERT INTO template_sections (id, template_id, name, description, sort_order) VALUES
  ('33333333-3333-3333-3333-333333333301', '22222222-2222-2222-2222-222222222222', 'Exterior', 'Exterior components of the property', 1),
  ('33333333-3333-3333-3333-333333333302', '22222222-2222-2222-2222-222222222222', 'Roofing', 'Roof and attic inspection', 2),
  ('33333333-3333-3333-3333-333333333303', '22222222-2222-2222-2222-222222222222', 'Electrical', 'Electrical systems', 3),
  ('33333333-3333-3333-3333-333333333304', '22222222-2222-2222-2222-222222222222', 'Plumbing', 'Plumbing systems', 4),
  ('33333333-3333-3333-3333-333333333305', '22222222-2222-2222-2222-222222222222', 'HVAC', 'Heating, ventilation, and air conditioning', 5),
  ('33333333-3333-3333-3333-333333333306', '22222222-2222-2222-2222-222222222222', 'Interior', 'Interior rooms and components', 6),
  ('33333333-3333-3333-3333-333333333307', '22222222-2222-2222-2222-222222222222', 'Kitchen', 'Kitchen appliances and fixtures', 7),
  ('33333333-3333-3333-3333-333333333308', '22222222-2222-2222-2222-222222222222', 'Bathrooms', 'Bathroom fixtures and ventilation', 8),
  ('33333333-3333-3333-3333-333333333309', '22222222-2222-2222-2222-222222222222', 'Garage', 'Garage and vehicle door', 9),
  ('33333333-3333-3333-3333-333333333310', '22222222-2222-2222-2222-222222222222', 'Foundation', 'Foundation and structure', 10);

-- Template Items for Exterior section
INSERT INTO template_items (id, section_id, name, description, item_type, is_required, sort_order) VALUES
  ('44444444-4444-4444-4444-444444444401', '33333333-3333-3333-3333-333333333301', 'Siding Condition', 'Check siding for damage, rot, or deterioration', 'rating', true, 1),
  ('44444444-4444-4444-4444-444444444402', '33333333-3333-3333-3333-333333333301', 'Windows Condition', 'Check windows for seal failure, cracks, operation', 'rating', true, 2),
  ('44444444-4444-4444-4444-444444444403', '33333333-3333-3333-3333-333333333301', 'Doors Condition', 'Check exterior doors for operation and weatherstripping', 'rating', true, 3),
  ('44444444-4444-4444-4444-444444444404', '33333333-3333-3333-3333-333333333301', 'Driveway Condition', 'Check driveway for cracks and drainage', 'rating', false, 4),
  ('44444444-4444-4444-4444-444444444405', '33333333-3333-3333-3333-333333333301', 'Walkways Condition', 'Check walkways for trip hazards', 'rating', false, 5),
  ('44444444-4444-4444-4444-444444444406', '33333333-3333-3333-3333-333333333301', 'Grading/Drainage', 'Check grading slopes away from foundation', 'rating', true, 6),
  ('44444444-4444-4444-4444-444444444407', '33333333-3333-3333-3333-333333333301', 'Exterior Photos', 'Take photos of exterior', 'photo', true, 7),
  ('44444444-4444-4444-4444-444444444408', '33333333-3333-3333-3333-333333333301', 'Exterior Notes', 'Additional notes for exterior', 'text', false, 8);

-- Template Items for Roofing section
INSERT INTO template_items (id, section_id, name, description, item_type, is_required, sort_order) VALUES
  ('44444444-4444-4444-4444-444444444501', '33333333-3333-3333-3333-333333333302', 'Roof Material', 'Type of roofing material', 'select', true, 1),
  ('44444444-4444-4444-4444-444444444502', '33333333-3333-3333-3333-333333333302', 'Roof Condition', 'Overall condition of roof covering', 'rating', true, 2),
  ('44444444-4444-4444-4444-444444444503', '33333333-3333-3333-3333-333333333302', 'Flashing Condition', 'Check flashing around penetrations', 'rating', true, 3),
  ('44444444-4444-4444-4444-444444444504', '33333333-3333-3333-3333-333333333302', 'Gutters Condition', 'Check gutters and downspouts', 'rating', true, 4),
  ('44444444-4444-4444-4444-444444444505', '33333333-3333-3333-3333-333333333302', 'Estimated Age', 'Estimated age of roof in years', 'number', false, 5),
  ('44444444-4444-4444-4444-444444444506', '33333333-3333-3333-3333-333333333302', 'Roof Photos', 'Take photos of roof', 'photo', true, 6);

-- Update roof material item with options
UPDATE template_items SET options = '[
  {"value": "asphalt", "label": "Asphalt Shingles"},
  {"value": "metal", "label": "Metal"},
  {"value": "tile", "label": "Tile"},
  {"value": "wood", "label": "Wood Shakes"},
  {"value": "flat", "label": "Flat/Built-up"},
  {"value": "other", "label": "Other"}
]'::jsonb WHERE id = '44444444-4444-4444-4444-444444444501';

-- Template Items for Electrical section
INSERT INTO template_items (id, section_id, name, description, item_type, is_required, sort_order) VALUES
  ('44444444-4444-4444-4444-444444444601', '33333333-3333-3333-3333-333333333303', 'Panel Condition', 'Main electrical panel condition', 'rating', true, 1),
  ('44444444-4444-4444-4444-444444444602', '33333333-3333-3333-3333-333333333303', 'Panel Amperage', 'Service amperage', 'select', true, 2),
  ('44444444-4444-4444-4444-444444444603', '33333333-3333-3333-3333-333333333303', 'GFCI Protection', 'GFCI outlets in required locations', 'checkbox', true, 3),
  ('44444444-4444-4444-4444-444444444604', '33333333-3333-3333-3333-333333333303', 'AFCI Protection', 'AFCI breakers for bedrooms', 'checkbox', false, 4),
  ('44444444-4444-4444-4444-444444444605', '33333333-3333-3333-3333-333333333303', 'Outlets Tested', 'Outlets tested and functional', 'checkbox', true, 5),
  ('44444444-4444-4444-4444-444444444606', '33333333-3333-3333-3333-333333333303', 'Electrical Photos', 'Photos of panel and issues', 'photo', true, 6);

UPDATE template_items SET options = '[
  {"value": "100", "label": "100 Amp"},
  {"value": "150", "label": "150 Amp"},
  {"value": "200", "label": "200 Amp"},
  {"value": "400", "label": "400 Amp"}
]'::jsonb WHERE id = '44444444-4444-4444-4444-444444444602';

-- Template Items for Plumbing section
INSERT INTO template_items (id, section_id, name, description, item_type, is_required, sort_order) VALUES
  ('44444444-4444-4444-4444-444444444701', '33333333-3333-3333-3333-333333333304', 'Water Heater Condition', 'Water heater condition and age', 'rating', true, 1),
  ('44444444-4444-4444-4444-444444444702', '33333333-3333-3333-3333-333333333304', 'Water Pressure', 'Water pressure adequate', 'checkbox', true, 2),
  ('44444444-4444-4444-4444-444444444703', '33333333-3333-3333-3333-333333333304', 'Supply Pipes', 'Supply pipe material and condition', 'rating', true, 3),
  ('44444444-4444-4444-4444-444444444704', '33333333-3333-3333-3333-333333333304', 'Drain Pipes', 'Drain pipe material and condition', 'rating', true, 4),
  ('44444444-4444-4444-4444-444444444705', '33333333-3333-3333-3333-333333333304', 'Leaks Observed', 'Any visible leaks', 'checkbox', true, 5),
  ('44444444-4444-4444-4444-444444444706', '33333333-3333-3333-3333-333333333304', 'Plumbing Photos', 'Photos of plumbing system', 'photo', false, 6);

-- Template Items for HVAC section
INSERT INTO template_items (id, section_id, name, description, item_type, is_required, sort_order) VALUES
  ('44444444-4444-4444-4444-444444444801', '33333333-3333-3333-3333-333333333305', 'Heating System Type', 'Type of heating system', 'select', true, 1),
  ('44444444-4444-4444-4444-444444444802', '33333333-3333-3333-3333-333333333305', 'Heating Operational', 'Heating system operates', 'checkbox', true, 2),
  ('44444444-4444-4444-4444-444444444803', '33333333-3333-3333-3333-333333333305', 'Cooling System Type', 'Type of cooling system', 'select', true, 3),
  ('44444444-4444-4444-4444-444444444804', '33333333-3333-3333-3333-333333333305', 'Cooling Operational', 'Cooling system operates', 'checkbox', true, 4),
  ('44444444-4444-4444-4444-444444444805', '33333333-3333-3333-3333-333333333305', 'Filter Condition', 'Air filter condition', 'rating', false, 5),
  ('44444444-4444-4444-4444-444444444806', '33333333-3333-3333-3333-333333333305', 'HVAC Photos', 'Photos of HVAC equipment', 'photo', true, 6);

UPDATE template_items SET options = '[
  {"value": "gas_forced", "label": "Gas Forced Air"},
  {"value": "electric_forced", "label": "Electric Forced Air"},
  {"value": "heat_pump", "label": "Heat Pump"},
  {"value": "boiler", "label": "Boiler/Radiant"},
  {"value": "none", "label": "None"}
]'::jsonb WHERE id = '44444444-4444-4444-4444-444444444801';

UPDATE template_items SET options = '[
  {"value": "central_ac", "label": "Central A/C"},
  {"value": "heat_pump", "label": "Heat Pump"},
  {"value": "mini_split", "label": "Mini Split"},
  {"value": "evaporative", "label": "Evaporative"},
  {"value": "none", "label": "None"}
]'::jsonb WHERE id = '44444444-4444-4444-4444-444444444803';

-- Defect Library
INSERT INTO defect_library (tenant_id, category, name, description, severity, recommendation) VALUES
  ('f54f7c28-2dc7-4bc3-9c23-0a1dca0bd4e3', 'Roofing', 'Missing Shingles', 'One or more shingles are missing from the roof', 'moderate', 'Replace missing shingles to prevent water intrusion'),
  ('f54f7c28-2dc7-4bc3-9c23-0a1dca0bd4e3', 'Roofing', 'Damaged Flashing', 'Flashing around penetrations is damaged or improperly sealed', 'moderate', 'Repair or replace flashing and seal properly'),
  ('f54f7c28-2dc7-4bc3-9c23-0a1dca0bd4e3', 'Roofing', 'Clogged Gutters', 'Gutters are clogged with debris', 'minor', 'Clean gutters and downspouts'),
  ('f54f7c28-2dc7-4bc3-9c23-0a1dca0bd4e3', 'Electrical', 'Open Junction Box', 'Junction box is missing cover', 'major', 'Install proper cover on junction box'),
  ('f54f7c28-2dc7-4bc3-9c23-0a1dca0bd4e3', 'Electrical', 'Double-Tapped Breaker', 'Two wires connected to single breaker terminal', 'major', 'Install proper tandem breaker or separate circuits'),
  ('f54f7c28-2dc7-4bc3-9c23-0a1dca0bd4e3', 'Electrical', 'Missing GFCI', 'GFCI protection missing in required location', 'major', 'Install GFCI outlet or breaker'),
  ('f54f7c28-2dc7-4bc3-9c23-0a1dca0bd4e3', 'Plumbing', 'Active Leak', 'Water actively leaking from pipe or fixture', 'major', 'Repair leak immediately to prevent water damage'),
  ('f54f7c28-2dc7-4bc3-9c23-0a1dca0bd4e3', 'Plumbing', 'Corroded Pipes', 'Supply or drain pipes show significant corrosion', 'moderate', 'Monitor and plan for replacement'),
  ('f54f7c28-2dc7-4bc3-9c23-0a1dca0bd4e3', 'Plumbing', 'Slow Drain', 'Drain is slow to empty', 'minor', 'Clear drain blockage'),
  ('f54f7c28-2dc7-4bc3-9c23-0a1dca0bd4e3', 'HVAC', 'Dirty Filter', 'Air filter is dirty and restricting airflow', 'minor', 'Replace air filter'),
  ('f54f7c28-2dc7-4bc3-9c23-0a1dca0bd4e3', 'HVAC', 'No Cooling', 'AC system not producing cold air', 'major', 'Have HVAC technician evaluate and repair'),
  ('f54f7c28-2dc7-4bc3-9c23-0a1dca0bd4e3', 'Exterior', 'Wood Rot', 'Wood components show signs of rot or decay', 'moderate', 'Replace affected wood and address moisture source'),
  ('f54f7c28-2dc7-4bc3-9c23-0a1dca0bd4e3', 'Exterior', 'Improper Grading', 'Ground slopes toward foundation', 'moderate', 'Regrade to slope away from foundation'),
  ('f54f7c28-2dc7-4bc3-9c23-0a1dca0bd4e3', 'Foundation', 'Crack in Foundation', 'Visible crack in foundation wall or slab', 'moderate', 'Monitor crack; consult structural engineer if widening'),
  ('f54f7c28-2dc7-4bc3-9c23-0a1dca0bd4e3', 'Foundation', 'Water Staining', 'Evidence of water intrusion in basement/crawlspace', 'moderate', 'Address drainage and waterproofing'),
  ('f54f7c28-2dc7-4bc3-9c23-0a1dca0bd4e3', 'Safety', 'Missing Smoke Detector', 'Smoke detector missing or non-functional', 'safety', 'Install working smoke detector immediately'),
  ('f54f7c28-2dc7-4bc3-9c23-0a1dca0bd4e3', 'Safety', 'Missing CO Detector', 'Carbon monoxide detector missing where required', 'safety', 'Install CO detector near sleeping areas'),
  ('f54f7c28-2dc7-4bc3-9c23-0a1dca0bd4e3', 'Safety', 'Missing Handrail', 'Stairway missing required handrail', 'safety', 'Install handrail for safety');
