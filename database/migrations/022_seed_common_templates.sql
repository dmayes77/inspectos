-- =====================================================
-- Common Inspection Templates (Full Sets)
-- =====================================================

-- Add unique constraint on (tenant_id, name) to support ON CONFLICT
ALTER TABLE templates ADD CONSTRAINT templates_tenant_name_unique UNIQUE (tenant_id, name);

-- Standard Home Inspection (expanded)
WITH template AS (
  INSERT INTO templates (tenant_id, name, description, version, is_active)
  VALUES ('f54f7c28-2dc7-4bc3-9c23-0a1dca0bd4e3', 'Standard Home Inspection', 'Comprehensive residential inspection', 1, TRUE)
  ON CONFLICT (tenant_id, name) DO NOTHING
  RETURNING id
),
sections AS (
  SELECT id FROM template
),
exterior AS (
  INSERT INTO template_sections (template_id, name, description, sort_order)
  SELECT id, 'Exterior', 'Exterior components and grounds', 1 FROM sections
  RETURNING id
),
roof AS (
  INSERT INTO template_sections (template_id, name, description, sort_order)
  SELECT id, 'Roofing', 'Roofing materials and drainage', 2 FROM sections
  RETURNING id
),
structure AS (
  INSERT INTO template_sections (template_id, name, description, sort_order)
  SELECT id, 'Structure', 'Foundation and framing', 3 FROM sections
  RETURNING id
),
electrical AS (
  INSERT INTO template_sections (template_id, name, description, sort_order)
  SELECT id, 'Electrical', 'Service, panels, and circuits', 4 FROM sections
  RETURNING id
),
plumbing AS (
  INSERT INTO template_sections (template_id, name, description, sort_order)
  SELECT id, 'Plumbing', 'Supply, drain, and fixtures', 5 FROM sections
  RETURNING id
),
hvac AS (
  INSERT INTO template_sections (template_id, name, description, sort_order)
  SELECT id, 'HVAC', 'Heating and cooling systems', 6 FROM sections
  RETURNING id
),
interior AS (
  INSERT INTO template_sections (template_id, name, description, sort_order)
  SELECT id, 'Interior', 'Walls, ceilings, floors, doors', 7 FROM sections
  RETURNING id
),
kitchen AS (
  INSERT INTO template_sections (template_id, name, description, sort_order)
  SELECT id, 'Kitchen', 'Appliances and fixtures', 8 FROM sections
  RETURNING id
),
bathrooms AS (
  INSERT INTO template_sections (template_id, name, description, sort_order)
  SELECT id, 'Bathrooms', 'Bath fixtures and ventilation', 9 FROM sections
  RETURNING id
),
attic AS (
  INSERT INTO template_sections (template_id, name, description, sort_order)
  SELECT id, 'Attic/Insulation', 'Attic access and insulation', 10 FROM sections
  RETURNING id
),
safety AS (
  INSERT INTO template_sections (template_id, name, description, sort_order)
  SELECT id, 'Safety', 'Safety devices and hazards', 11 FROM sections
  RETURNING id
)
INSERT INTO template_items (section_id, name, description, item_type, options, is_required, sort_order)
SELECT exterior.id, 'Siding Condition', 'Exterior wall covering condition', 'rating', NULL::jsonb, TRUE, 1 FROM exterior
UNION ALL SELECT exterior.id, 'Windows/Doors', 'Operation and seals', 'rating', NULL::jsonb, TRUE, 2 FROM exterior
UNION ALL SELECT exterior.id, 'Grading/Drainage', 'Slope away from foundation', 'rating', NULL::jsonb, TRUE, 3 FROM exterior
UNION ALL SELECT exterior.id, 'Walkways/Driveway', 'Trip hazards and condition', 'rating', NULL::jsonb, FALSE, 4 FROM exterior
UNION ALL SELECT exterior.id, 'Exterior Photos', 'Photos of exterior elevations', 'photo', NULL::jsonb, TRUE, 5 FROM exterior
UNION ALL SELECT roof.id, 'Roof Covering', 'Overall roof covering condition', 'rating', NULL::jsonb, TRUE, 1 FROM roof
UNION ALL SELECT roof.id, 'Flashing/Penetrations', 'Flashing and penetrations', 'rating', NULL::jsonb, TRUE, 2 FROM roof
UNION ALL SELECT roof.id, 'Gutters/Downspouts', 'Drainage components', 'rating', NULL::jsonb, TRUE, 3 FROM roof
UNION ALL SELECT roof.id, 'Roof Material', 'Primary roof material', 'select', '[{"value":"asphalt","label":"Asphalt Shingles"},{"value":"metal","label":"Metal"},{"value":"tile","label":"Tile"},{"value":"wood","label":"Wood"},{"value":"flat","label":"Flat/Built-up"},{"value":"other","label":"Other"}]'::jsonb, TRUE, 4 FROM roof
UNION ALL SELECT roof.id, 'Roof Photos', 'Photos of roof', 'photo', NULL, TRUE, 5 FROM roof
UNION ALL SELECT structure.id, 'Foundation Type', 'Primary foundation type', 'select', '[{"value":"slab","label":"Slab"},{"value":"pier_beam","label":"Pier and Beam"},{"value":"basement","label":"Basement"},{"value":"crawlspace","label":"Crawlspace"},{"value":"other","label":"Other"}]'::jsonb, TRUE, 1 FROM structure
UNION ALL SELECT structure.id, 'Foundation Condition', 'Visible cracks or movement', 'rating', NULL::jsonb, TRUE, 2 FROM structure
UNION ALL SELECT structure.id, 'Framing', 'Visible framing issues', 'rating', NULL::jsonb, TRUE, 3 FROM structure
UNION ALL SELECT structure.id, 'Moisture Intrusion', 'Evidence of moisture', 'checkbox', NULL::jsonb, FALSE, 4 FROM structure
UNION ALL SELECT electrical.id, 'Service Amperage', 'Main service amperage', 'select', '[{"value":"100","label":"100 Amp"},{"value":"150","label":"150 Amp"},{"value":"200","label":"200 Amp"},{"value":"400","label":"400 Amp"}]'::jsonb, TRUE, 1 FROM electrical
UNION ALL SELECT electrical.id, 'Panel Condition', 'Panel labeling and condition', 'rating', NULL::jsonb, TRUE, 2 FROM electrical
UNION ALL SELECT electrical.id, 'GFCI/AFCI', 'Required protections present', 'checkbox', NULL::jsonb, TRUE, 3 FROM electrical
UNION ALL SELECT electrical.id, 'Branch Circuits', 'Representative outlets tested', 'checkbox', NULL::jsonb, TRUE, 4 FROM electrical
UNION ALL SELECT plumbing.id, 'Water Heater', 'Age and condition', 'rating', NULL::jsonb, TRUE, 1 FROM plumbing
UNION ALL SELECT plumbing.id, 'Supply Lines', 'Material and condition', 'rating', NULL::jsonb, TRUE, 2 FROM plumbing
UNION ALL SELECT plumbing.id, 'Drain/Waste', 'Drain line condition', 'rating', NULL::jsonb, TRUE, 3 FROM plumbing
UNION ALL SELECT plumbing.id, 'Functional Flow', 'Fixtures tested', 'checkbox', NULL::jsonb, TRUE, 4 FROM plumbing
UNION ALL SELECT hvac.id, 'Heating System', 'Heating operation', 'checkbox', NULL::jsonb, TRUE, 1 FROM hvac
UNION ALL SELECT hvac.id, 'Cooling System', 'Cooling operation', 'checkbox', NULL::jsonb, TRUE, 2 FROM hvac
UNION ALL SELECT hvac.id, 'Thermostat', 'Control operation', 'checkbox', NULL::jsonb, TRUE, 3 FROM hvac
UNION ALL SELECT hvac.id, 'Filter Condition', 'Filter condition', 'rating', NULL::jsonb, FALSE, 4 FROM hvac
UNION ALL SELECT interior.id, 'Walls/Ceilings', 'Interior finishes', 'rating', NULL::jsonb, TRUE, 1 FROM interior
UNION ALL SELECT interior.id, 'Floors', 'Floor condition', 'rating', NULL::jsonb, TRUE, 2 FROM interior
UNION ALL SELECT interior.id, 'Doors/Windows', 'Interior operation', 'rating', NULL::jsonb, TRUE, 3 FROM interior
UNION ALL SELECT kitchen.id, 'Range/Oven', 'Operation', 'checkbox', NULL::jsonb, TRUE, 1 FROM kitchen
UNION ALL SELECT kitchen.id, 'Dishwasher', 'Operation', 'checkbox', NULL::jsonb, TRUE, 2 FROM kitchen
UNION ALL SELECT kitchen.id, 'Disposal', 'Operation', 'checkbox', NULL::jsonb, FALSE, 3 FROM kitchen
UNION ALL SELECT bathrooms.id, 'Toilets', 'Operation and leaks', 'checkbox', NULL::jsonb, TRUE, 1 FROM bathrooms
UNION ALL SELECT bathrooms.id, 'Bath/Shower', 'Operation and drains', 'checkbox', NULL::jsonb, TRUE, 2 FROM bathrooms
UNION ALL SELECT bathrooms.id, 'Ventilation', 'Exhaust fan operation', 'checkbox', NULL::jsonb, TRUE, 3 FROM bathrooms
UNION ALL SELECT attic.id, 'Access', 'Attic access available', 'checkbox', NULL::jsonb, TRUE, 1 FROM attic
UNION ALL SELECT attic.id, 'Insulation', 'Type and coverage', 'rating', NULL::jsonb, TRUE, 2 FROM attic
UNION ALL SELECT attic.id, 'Ventilation', 'Attic ventilation', 'rating', NULL::jsonb, TRUE, 3 FROM attic
UNION ALL SELECT safety.id, 'Smoke Detectors', 'Presence and operation', 'checkbox', NULL::jsonb, TRUE, 1 FROM safety
UNION ALL SELECT safety.id, 'CO Detectors', 'Presence and operation', 'checkbox', NULL::jsonb, TRUE, 2 FROM safety
UNION ALL SELECT safety.id, 'Handrails/Guards', 'Safety railings', 'rating', NULL::jsonb, FALSE, 3 FROM safety;

-- 4-Point Inspection
WITH template AS (
  INSERT INTO templates (tenant_id, name, description, version, is_active)
  VALUES ('f54f7c28-2dc7-4bc3-9c23-0a1dca0bd4e3', '4-Point Inspection', 'Insurance-focused roof, electrical, plumbing, HVAC', 1, TRUE)
  ON CONFLICT (tenant_id, name) DO NOTHING
  RETURNING id
),
sections AS (
  SELECT id FROM template
),
roof AS (
  INSERT INTO template_sections (template_id, name, description, sort_order)
  SELECT id, 'Roof', 'Roof covering and condition', 1 FROM sections
  RETURNING id
),
electrical AS (
  INSERT INTO template_sections (template_id, name, description, sort_order)
  SELECT id, 'Electrical', 'Service and panel', 2 FROM sections
  RETURNING id
),
plumbing AS (
  INSERT INTO template_sections (template_id, name, description, sort_order)
  SELECT id, 'Plumbing', 'Supply, drain, water heater', 3 FROM sections
  RETURNING id
),
hvac AS (
  INSERT INTO template_sections (template_id, name, description, sort_order)
  SELECT id, 'HVAC', 'Heating/cooling systems', 4 FROM sections
  RETURNING id
)
INSERT INTO template_items (section_id, name, description, item_type, options, is_required, sort_order)
SELECT roof.id, 'Roof Material', 'Primary material', 'select', '[{"value":"asphalt","label":"Asphalt"},{"value":"metal","label":"Metal"},{"value":"tile","label":"Tile"},{"value":"flat","label":"Flat"},{"value":"other","label":"Other"}]'::jsonb, TRUE, 1 FROM roof
UNION ALL SELECT roof.id, 'Roof Condition', 'Visible condition', 'rating', NULL::jsonb, TRUE, 2 FROM roof
UNION ALL SELECT roof.id, 'Age (Years)', 'Estimated age', 'number', NULL::jsonb, FALSE, 3 FROM roof
UNION ALL SELECT roof.id, 'Roof Photos', 'Overall roof photos', 'photo', NULL::jsonb, TRUE, 4 FROM roof
UNION ALL SELECT electrical.id, 'Service Amps', 'Main service size', 'select', '[{"value":"100","label":"100"},{"value":"150","label":"150"},{"value":"200","label":"200"}]'::jsonb, TRUE, 1 FROM electrical
UNION ALL SELECT electrical.id, 'Panel Brand/Type', 'Panel details', 'text', NULL::jsonb, TRUE, 2 FROM electrical
UNION ALL SELECT electrical.id, 'Panel Condition', 'Safety issues', 'rating', NULL::jsonb, TRUE, 3 FROM electrical
UNION ALL SELECT plumbing.id, 'Water Heater Age', 'Estimated age', 'number', NULL::jsonb, TRUE, 1 FROM plumbing
UNION ALL SELECT plumbing.id, 'Supply Piping', 'Material/condition', 'text', NULL::jsonb, TRUE, 2 FROM plumbing
UNION ALL SELECT plumbing.id, 'Active Leaks', 'Leaks present', 'checkbox', NULL::jsonb, TRUE, 3 FROM plumbing
UNION ALL SELECT hvac.id, 'Heating Type', 'Primary heating type', 'select', '[{"value":"gas","label":"Gas"},{"value":"electric","label":"Electric"},{"value":"heat_pump","label":"Heat Pump"},{"value":"other","label":"Other"}]'::jsonb, TRUE, 1 FROM hvac
UNION ALL SELECT hvac.id, 'Cooling Type', 'Primary cooling type', 'select', '[{"value":"central","label":"Central A/C"},{"value":"heat_pump","label":"Heat Pump"},{"value":"mini_split","label":"Mini Split"},{"value":"none","label":"None"}]'::jsonb, TRUE, 2 FROM hvac
UNION ALL SELECT hvac.id, 'Operational', 'System operates', 'checkbox', NULL::jsonb, TRUE, 3 FROM hvac;

-- Wind Mitigation
WITH template AS (
  INSERT INTO templates (tenant_id, name, description, version, is_active)
  VALUES ('f54f7c28-2dc7-4bc3-9c23-0a1dca0bd4e3', 'Wind Mitigation Inspection', 'Wind mitigation verification for insurance', 1, TRUE)
  ON CONFLICT (tenant_id, name) DO NOTHING
  RETURNING id
),
sections AS (
  SELECT id FROM template
),
roof_cover AS (
  INSERT INTO template_sections (template_id, name, description, sort_order)
  SELECT id, 'Roof Covering', 'Roof covering and condition', 1 FROM sections
  RETURNING id
),
roof_deck AS (
  INSERT INTO template_sections (template_id, name, description, sort_order)
  SELECT id, 'Roof Deck Attachment', 'Deck fastening', 2 FROM sections
  RETURNING id
),
roof_wall AS (
  INSERT INTO template_sections (template_id, name, description, sort_order)
  SELECT id, 'Roof-to-Wall', 'Attachment type', 3 FROM sections
  RETURNING id
),
openings AS (
  INSERT INTO template_sections (template_id, name, description, sort_order)
  SELECT id, 'Opening Protection', 'Windows/doors protection', 4 FROM sections
  RETURNING id
),
swr AS (
  INSERT INTO template_sections (template_id, name, description, sort_order)
  SELECT id, 'Secondary Water Resistance', 'Underlayment', 5 FROM sections
  RETURNING id
)
INSERT INTO template_items (section_id, name, description, item_type, options, is_required, sort_order)
SELECT roof_cover.id, 'Roof Covering Type', 'Primary material', 'select', '[{"value":"asphalt","label":"Asphalt"},{"value":"metal","label":"Metal"},{"value":"tile","label":"Tile"},{"value":"other","label":"Other"}]'::jsonb, TRUE, 1 FROM roof_cover
UNION ALL SELECT roof_cover.id, 'Roof Cover Condition', 'Visible condition', 'rating', NULL::jsonb, TRUE, 2 FROM roof_cover
UNION ALL SELECT roof_deck.id, 'Deck Attachment', 'Nail size/spacing', 'select', '[{"value":"6d_6in","label":"6d @ 6in"},{"value":"8d_6in","label":"8d @ 6in"},{"value":"8d_4in","label":"8d @ 4in"},{"value":"other","label":"Other"}]'::jsonb, TRUE, 1 FROM roof_deck
UNION ALL SELECT roof_wall.id, 'Roof-to-Wall Attachment', 'Connection type', 'select', '[{"value":"toe_nail","label":"Toe Nail"},{"value":"clip","label":"Clip"},{"value":"strap","label":"Strap"}]'::jsonb, TRUE, 1 FROM roof_wall
UNION ALL SELECT openings.id, 'Opening Protection', 'Impact rated or shutters', 'select', '[{"value":"none","label":"None"},{"value":"shutters","label":"Shutters"},{"value":"impact","label":"Impact Rated"}]'::jsonb, TRUE, 1 FROM openings
UNION ALL SELECT swr.id, 'Secondary Water Resistance', 'Self-adhered underlayment', 'checkbox', NULL::jsonb, TRUE, 1 FROM swr;

-- 11-Month Warranty
WITH template AS (
  INSERT INTO templates (tenant_id, name, description, version, is_active)
  VALUES ('f54f7c28-2dc7-4bc3-9c23-0a1dca0bd4e3', '11-Month Warranty Inspection', 'New construction warranty follow-up', 1, TRUE)
  ON CONFLICT (tenant_id, name) DO NOTHING
  RETURNING id
),
sections AS (
  SELECT id FROM template
),
exterior AS (
  INSERT INTO template_sections (template_id, name, description, sort_order)
  SELECT id, 'Exterior', 'Exterior finishes and grading', 1 FROM sections
  RETURNING id
),
interior AS (
  INSERT INTO template_sections (template_id, name, description, sort_order)
  SELECT id, 'Interior', 'Interior finishes and operation', 2 FROM sections
  RETURNING id
),
systems AS (
  INSERT INTO template_sections (template_id, name, description, sort_order)
  SELECT id, 'Major Systems', 'HVAC, plumbing, electrical', 3 FROM sections
  RETURNING id
),
appliances AS (
  INSERT INTO template_sections (template_id, name, description, sort_order)
  SELECT id, 'Appliances', 'Appliance operation', 4 FROM sections
  RETURNING id
),
structure AS (
  INSERT INTO template_sections (template_id, name, description, sort_order)
  SELECT id, 'Structure', 'Settlement and movement', 5 FROM sections
  RETURNING id
)
INSERT INTO template_items (section_id, name, description, item_type, options, is_required, sort_order)
SELECT exterior.id, 'Siding/Trim', 'Cracks, gaps, paint', 'rating', NULL::jsonb, TRUE, 1 FROM exterior
UNION ALL SELECT exterior.id, 'Grading/Drainage', 'Water management', 'rating', NULL::jsonb, TRUE, 2 FROM exterior
UNION ALL SELECT interior.id, 'Doors/Windows', 'Operation and alignment', 'rating', NULL::jsonb, TRUE, 1 FROM interior
UNION ALL SELECT interior.id, 'Walls/Ceilings', 'Cracks, nail pops', 'rating', NULL::jsonb, TRUE, 2 FROM interior
UNION ALL SELECT systems.id, 'HVAC Operation', 'Cooling/heating', 'checkbox', NULL::jsonb, TRUE, 1 FROM systems
UNION ALL SELECT systems.id, 'Plumbing Fixtures', 'Leaks and drains', 'checkbox', NULL::jsonb, TRUE, 2 FROM systems
UNION ALL SELECT systems.id, 'Electrical Outlets', 'Representative outlets', 'checkbox', NULL::jsonb, TRUE, 3 FROM systems
UNION ALL SELECT appliances.id, 'Kitchen Appliances', 'Range, dishwasher, microwave', 'checkbox', NULL::jsonb, TRUE, 1 FROM appliances
UNION ALL SELECT appliances.id, 'Laundry Connections', 'Washer/dryer hookups', 'checkbox', NULL::jsonb, TRUE, 2 FROM appliances
UNION ALL SELECT structure.id, 'Foundation Movement', 'Visible movement/cracking', 'rating', NULL::jsonb, TRUE, 1 FROM structure;

-- Pre-Listing Inspection
WITH template AS (
  INSERT INTO templates (tenant_id, name, description, version, is_active)
  VALUES ('f54f7c28-2dc7-4bc3-9c23-0a1dca0bd4e3', 'Pre-Listing Inspection', 'Seller preparation inspection', 1, TRUE)
  ON CONFLICT (tenant_id, name) DO NOTHING
  RETURNING id
),
sections AS (
  SELECT id FROM template
),
summary AS (
  INSERT INTO template_sections (template_id, name, description, sort_order)
  SELECT id, 'Seller Prep Summary', 'Priority items for seller', 1 FROM sections
  RETURNING id
),
exterior AS (
  INSERT INTO template_sections (template_id, name, description, sort_order)
  SELECT id, 'Exterior', 'Exterior condition', 2 FROM sections
  RETURNING id
),
interior AS (
  INSERT INTO template_sections (template_id, name, description, sort_order)
  SELECT id, 'Interior', 'Interior condition', 3 FROM sections
  RETURNING id
),
systems AS (
  INSERT INTO template_sections (template_id, name, description, sort_order)
  SELECT id, 'Systems', 'HVAC, electrical, plumbing', 4 FROM sections
  RETURNING id
)
INSERT INTO template_items (section_id, name, description, item_type, options, is_required, sort_order)
SELECT summary.id, 'Top 5 Repairs', 'List priority fixes', 'text', NULL::jsonb, TRUE, 1 FROM summary
UNION ALL SELECT summary.id, 'Safety Concerns', 'Immediate safety items', 'text', NULL::jsonb, TRUE, 2 FROM summary
UNION ALL SELECT exterior.id, 'Curb Appeal', 'General exterior appearance', 'rating', NULL::jsonb, TRUE, 1 FROM exterior
UNION ALL SELECT exterior.id, 'Roof/Drainage', 'Roof and gutter condition', 'rating', NULL::jsonb, TRUE, 2 FROM exterior
UNION ALL SELECT interior.id, 'Interior Finishes', 'Walls, floors, ceilings', 'rating', NULL::jsonb, TRUE, 1 FROM interior
UNION ALL SELECT interior.id, 'Windows/Doors', 'Operation and seals', 'rating', NULL::jsonb, TRUE, 2 FROM interior
UNION ALL SELECT systems.id, 'HVAC', 'Heating/cooling operation', 'checkbox', NULL::jsonb, TRUE, 1 FROM systems
UNION ALL SELECT systems.id, 'Electrical', 'Panel and outlets', 'checkbox', NULL::jsonb, TRUE, 2 FROM systems
UNION ALL SELECT systems.id, 'Plumbing', 'Fixtures and leaks', 'checkbox', NULL::jsonb, TRUE, 3 FROM systems;
