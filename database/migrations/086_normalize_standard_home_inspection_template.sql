-- =====================================================
-- Normalize Standard Home Inspection template structure
-- =====================================================

CREATE OR REPLACE FUNCTION public.rebuild_standard_home_inspection_template(p_template_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_section_seed record;
  v_seed_item record;
  v_section_id uuid;
BEGIN
  IF p_template_id IS NULL THEN
    RETURN;
  END IF;

  DELETE FROM public.template_sections
  WHERE template_id = p_template_id;

  UPDATE public.templates
  SET
    description = 'Comprehensive residential inspection aligned to a standard home inspection workflow.',
    type = 'inspection',
    standard = 'Custom',
    is_active = true,
    updated_at = now()
  WHERE id = p_template_id;

  FOR v_section_seed IN
    SELECT *
    FROM (
      VALUES
        (
          1,
          'Roof',
          'Roof coverings, flashings, penetrations, and roof drainage.',
          '[
            {"name":"Observed Elevations / Roof Areas","description":"Document the roof slopes, elevations, or roof areas inspected.","item_type":"text","is_required":false,"sort_order":0},
            {"name":"Roof Covering Material","description":"Primary roof covering material observed.","item_type":"select","is_required":true,"sort_order":1,"options":[{"value":"asphalt","label":"Asphalt Shingles"},{"value":"metal","label":"Metal"},{"value":"tile","label":"Tile"},{"value":"wood","label":"Wood Shakes/Shingles"},{"value":"membrane","label":"Membrane / Flat"},{"value":"other","label":"Other"}]},
            {"name":"Roof Surface Condition","description":"Visible condition of the roof covering.","item_type":"rating","is_required":true,"sort_order":2},
            {"name":"Flashing and Penetrations","description":"Visible flashing details at penetrations and transitions.","item_type":"rating","is_required":true,"sort_order":3},
            {"name":"Gutters and Downspouts","description":"Roof drainage components and discharge.","item_type":"rating","is_required":false,"sort_order":4}
          ]'::jsonb
        ),
        (
          2,
          'Exterior',
          'Exterior wall coverings, trim, grading, drainage, and adjacent site features.',
          '[
            {"name":"Observed Sides / Areas","description":"Document the sides or exterior areas inspected.","item_type":"text","is_required":false,"sort_order":0},
            {"name":"Wall Cladding and Trim","description":"Visible condition of siding, trim, and exterior finishes.","item_type":"rating","is_required":true,"sort_order":1},
            {"name":"Exterior Doors and Windows","description":"Representative operation and visible condition of exterior openings.","item_type":"rating","is_required":true,"sort_order":2},
            {"name":"Grading and Drainage","description":"Site slope and drainage away from the structure.","item_type":"rating","is_required":true,"sort_order":3},
            {"name":"Decks, Steps, and Railings","description":"Visible condition of attached walking surfaces and guards.","item_type":"rating","is_required":false,"sort_order":4}
          ]'::jsonb
        ),
        (
          3,
          'Basement, Foundation, Crawl Space and Structure',
          'Foundation systems, framing, crawlspaces, basements, and visible structural conditions.',
          '[
            {"name":"Observed Areas","description":"Document whether observations came from basement, crawlspace, garage, slab perimeter, or other structural areas.","item_type":"text","is_required":false,"sort_order":0},
            {"name":"Foundation Type","description":"Primary foundation type observed.","item_type":"select","is_required":true,"sort_order":1,"options":[{"value":"slab","label":"Slab"},{"value":"crawlspace","label":"Crawlspace"},{"value":"basement","label":"Basement"},{"value":"pier_beam","label":"Pier and Beam"},{"value":"other","label":"Other"}]},
            {"name":"Foundation and Structure Condition","description":"Visible settlement, movement, cracking, or framing concerns.","item_type":"rating","is_required":true,"sort_order":2},
            {"name":"Basement or Crawlspace Conditions","description":"Visible conditions in accessible basement or crawlspace areas.","item_type":"text","is_required":false,"sort_order":3},
            {"name":"Moisture Intrusion Indicators","description":"Visible staining, dampness, or evidence of prior intrusion.","item_type":"checkbox","is_required":false,"sort_order":4}
          ]'::jsonb
        ),
        (
          4,
          'Electrical',
          'Service entrance, panels, branch circuits, and representative safety devices.',
          '[
            {"name":"Observed Locations","description":"Document representative rooms, areas, panel locations, or exterior points tested.","item_type":"text","is_required":false,"sort_order":0},
            {"name":"Service Size","description":"Observed main electrical service size.","item_type":"select","is_required":true,"sort_order":1,"options":[{"value":"60","label":"60 Amp"},{"value":"100","label":"100 Amp"},{"value":"150","label":"150 Amp"},{"value":"200","label":"200 Amp"},{"value":"400","label":"400 Amp"},{"value":"other","label":"Other"}]},
            {"name":"Service and Panels","description":"Visible condition of service equipment and panel interiors when accessible.","item_type":"rating","is_required":true,"sort_order":2},
            {"name":"Representative Receptacles and Switches","description":"Representative operation of outlets, switches, and fixtures.","item_type":"checkbox","is_required":true,"sort_order":3},
            {"name":"GFCI and AFCI Protection","description":"Presence of required protection at representative locations.","item_type":"checkbox","is_required":true,"sort_order":4}
          ]'::jsonb
        ),
        (
          5,
          'Plumbing',
          'Supply piping, drain-waste-vent systems, fixtures, and water heating equipment.',
          '[
            {"name":"Observed Rooms / Fixture Locations","description":"Document the rooms, fixture groups, or equipment areas inspected.","item_type":"text","is_required":false,"sort_order":0},
            {"name":"Supply Piping","description":"Visible water supply piping material and condition.","item_type":"rating","is_required":true,"sort_order":1},
            {"name":"Drain, Waste, and Vent","description":"Visible drain, waste, and vent piping condition.","item_type":"rating","is_required":true,"sort_order":2},
            {"name":"Fixtures and Functional Flow","description":"Representative fixture operation, drainage, and visible leakage.","item_type":"checkbox","is_required":true,"sort_order":3},
            {"name":"Water Heater","description":"Water heater type, age, and visible condition.","item_type":"rating","is_required":true,"sort_order":4}
          ]'::jsonb
        ),
        (
          6,
          'Heating',
          'Heating equipment, distribution, and basic operating controls.',
          '[
            {"name":"Equipment / Area Observed","description":"Document the equipment location and representative interior areas checked.","item_type":"text","is_required":false,"sort_order":0},
            {"name":"Heating Equipment Type","description":"Primary heating system type observed.","item_type":"select","is_required":true,"sort_order":1,"options":[{"value":"forced_air","label":"Forced Air"},{"value":"boiler","label":"Boiler / Hydronic"},{"value":"heat_pump","label":"Heat Pump"},{"value":"electric_baseboard","label":"Electric Baseboard"},{"value":"radiant","label":"Radiant"},{"value":"other","label":"Other"}]},
            {"name":"Heating Operation","description":"Response to normal operating controls at time of inspection.","item_type":"checkbox","is_required":true,"sort_order":2},
            {"name":"Distribution and Airflow","description":"Visible distribution components and representative airflow/heat delivery.","item_type":"rating","is_required":false,"sort_order":3}
          ]'::jsonb
        ),
        (
          7,
          'Cooling',
          'Cooling equipment, condensate handling, and distribution.',
          '[
            {"name":"Equipment / Area Observed","description":"Document condenser/air-handler locations and representative cooled areas checked.","item_type":"text","is_required":false,"sort_order":0},
            {"name":"Cooling Equipment Type","description":"Primary cooling system type observed.","item_type":"select","is_required":false,"sort_order":1,"options":[{"value":"central_air","label":"Central Air"},{"value":"heat_pump","label":"Heat Pump"},{"value":"mini_split","label":"Mini Split"},{"value":"evaporative","label":"Evaporative Cooler"},{"value":"window_unit","label":"Window / Wall Unit"},{"value":"none","label":"None"},{"value":"other","label":"Other"}]},
            {"name":"Cooling Operation","description":"Cooling response to normal operating controls when conditions permit.","item_type":"checkbox","is_required":false,"sort_order":2},
            {"name":"Condensate and Distribution","description":"Visible condensate management and representative cool air distribution.","item_type":"rating","is_required":false,"sort_order":3}
          ]'::jsonb
        ),
        (
          8,
          'Doors, Windows and Interior',
          'Interior finishes, representative door and window operation, and visible safety concerns.',
          '[
            {"name":"Room / Area","description":"Document the room or interior area for any observations recorded in this section.","item_type":"text","is_required":false,"sort_order":0},
            {"name":"Walls, Ceilings, and Floors","description":"Visible condition of interior finishes and floor surfaces.","item_type":"rating","is_required":true,"sort_order":1},
            {"name":"Interior Doors and Windows","description":"Representative operation and visible condition of interior windows and doors.","item_type":"rating","is_required":true,"sort_order":2},
            {"name":"Stairs, Railings, and Guards","description":"Visible condition of interior stairs and related safety components.","item_type":"rating","is_required":false,"sort_order":3},
            {"name":"Built-In Kitchen Appliances","description":"Representative operation of built-in kitchen appliances where within scope.","item_type":"text","is_required":false,"sort_order":4}
          ]'::jsonb
        ),
        (
          9,
          'Attic, Insulation and Ventilation',
          'Accessible attic spaces, insulation levels, framing visibility, and ventilation.',
          '[
            {"name":"Access Point / Area","description":"Document the attic access point or area inspected.","item_type":"text","is_required":false,"sort_order":0},
            {"name":"Attic Access","description":"Accessibility of attic or roof void spaces.","item_type":"checkbox","is_required":true,"sort_order":1},
            {"name":"Insulation","description":"Type and approximate distribution of visible insulation.","item_type":"rating","is_required":true,"sort_order":2},
            {"name":"Ventilation","description":"Visible attic ventilation components and airflow pathways.","item_type":"rating","is_required":true,"sort_order":3},
            {"name":"Framing and Moisture Indicators","description":"Visible framing condition and signs of staining or moisture.","item_type":"rating","is_required":false,"sort_order":4}
          ]'::jsonb
        ),
        (
          10,
          'Fireplace',
          'Fireplaces, chimneys, and solid-fuel-burning appliances when present.',
          '[
            {"name":"Room / Fireplace Location","description":"Document the room or area where the fireplace or appliance is located.","item_type":"text","is_required":false,"sort_order":0},
            {"name":"Fireplace Present","description":"Indicate whether a fireplace or solid-fuel-burning appliance is present.","item_type":"select","is_required":false,"sort_order":1,"options":[{"value":"none","label":"None Observed"},{"value":"masonry","label":"Masonry Fireplace"},{"value":"factory_built","label":"Factory-Built Fireplace"},{"value":"stove","label":"Stove / Insert"},{"value":"other","label":"Other"}]},
            {"name":"Visible Fireplace Condition","description":"Visible firebox, hearth, surround, and chimney condition.","item_type":"rating","is_required":false,"sort_order":2},
            {"name":"Damper and Clearances","description":"Visible damper operation and apparent clearance concerns.","item_type":"checkbox","is_required":false,"sort_order":3}
          ]'::jsonb
        )
    ) AS section_seed(sort_order, section_name, section_description, items)
  LOOP
    INSERT INTO public.template_sections (template_id, name, description, sort_order)
    VALUES (
      p_template_id,
      v_section_seed.section_name,
      v_section_seed.section_description,
      v_section_seed.sort_order
    )
    RETURNING id INTO v_section_id;

    FOR v_seed_item IN
      SELECT
        value->>'name' AS name,
        value->>'description' AS description,
        value->>'item_type' AS item_type,
        COALESCE((value->>'is_required')::boolean, false) AS is_required,
        COALESCE((value->>'sort_order')::integer, 0) AS sort_order,
        value->'options' AS options
      FROM jsonb_array_elements(v_section_seed.items) AS value
    LOOP
      INSERT INTO public.template_items (
        section_id,
        name,
        description,
        item_type,
        options,
        is_required,
        sort_order
      )
      VALUES (
        v_section_id,
        v_seed_item.name,
        v_seed_item.description,
        v_seed_item.item_type,
        v_seed_item.options,
        v_seed_item.is_required,
        v_seed_item.sort_order
      );
    END LOOP;
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.normalize_standard_home_inspection_for_tenant(p_tenant_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_template_id uuid;
BEGIN
  IF p_tenant_id IS NULL THEN
    RETURN;
  END IF;

  SELECT t.id
  INTO v_template_id
  FROM public.templates t
  WHERE t.tenant_id = p_tenant_id
    AND t.name = 'Standard Home Inspection'
  ORDER BY t.created_at ASC, t.id ASC
  LIMIT 1;

  IF v_template_id IS NOT NULL THEN
    PERFORM public.rebuild_standard_home_inspection_template(v_template_id);
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.normalize_standard_home_template_on_tenant_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.normalize_standard_home_inspection_for_tenant(NEW.id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS zz_tenants_normalize_standard_home_template ON public.tenants;
CREATE TRIGGER zz_tenants_normalize_standard_home_template
AFTER INSERT ON public.tenants
FOR EACH ROW
EXECUTE FUNCTION public.normalize_standard_home_template_on_tenant_insert();

DO $$
DECLARE
  v_template record;
BEGIN
  FOR v_template IN
    SELECT t.id
    FROM public.templates t
    WHERE t.name = 'Standard Home Inspection'
      AND t.type = 'inspection'
      AND (
        NOT EXISTS (
          SELECT 1
          FROM public.template_sections ts
          WHERE ts.template_id = t.id
        )
        OR EXISTS (
          SELECT 1
          FROM public.template_sections ts
          WHERE ts.template_id = t.id
            AND ts.name = 'Core Systems'
        )
        OR (
          (SELECT count(*) FROM public.template_sections ts WHERE ts.template_id = t.id) = 11
          AND EXISTS (
            SELECT 1
            FROM public.template_sections ts
            WHERE ts.template_id = t.id
              AND ts.name = 'Kitchen'
          )
          AND EXISTS (
            SELECT 1
            FROM public.template_sections ts
            WHERE ts.template_id = t.id
              AND ts.name = 'Bathrooms'
          )
          AND EXISTS (
            SELECT 1
            FROM public.template_sections ts
            WHERE ts.template_id = t.id
              AND ts.name = 'Safety'
          )
          AND NOT EXISTS (
            SELECT 1
            FROM public.template_sections ts
            WHERE ts.template_id = t.id
              AND ts.name = 'Fireplace'
          )
          AND NOT EXISTS (
            SELECT 1
            FROM public.template_sections ts
            WHERE ts.template_id = t.id
              AND ts.name = 'Cooling'
          )
        )
      )
  LOOP
    PERFORM public.rebuild_standard_home_inspection_template(v_template.id);
  END LOOP;
END;
$$;
