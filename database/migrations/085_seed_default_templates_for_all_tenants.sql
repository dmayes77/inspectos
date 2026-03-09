-- =====================================================
-- Seed baseline templates for every tenant
-- =====================================================
-- Creates one default template for each template type:
-- - inspection
-- - agreement
-- - report
--
-- Also installs a tenants INSERT trigger so every new tenant
-- automatically receives the same baseline templates.

CREATE OR REPLACE FUNCTION public.seed_default_templates_for_tenant(p_tenant_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_inspection_template_id uuid;
  v_agreement_template_id uuid;
  v_report_template_id uuid;
  v_template_id uuid;
  v_section_id uuid;
  v_seed record;
  v_seed_item record;
BEGIN
  IF p_tenant_id IS NULL THEN
    RETURN;
  END IF;

  -- 1) Inspection template
  INSERT INTO public.templates (
    tenant_id,
    name,
    description,
    type,
    standard,
    version,
    is_default,
    usage_count,
    is_active
  )
  SELECT
    p_tenant_id,
    'Default Inspection Template',
    'Baseline inspection checklist for every new workspace.',
    'inspection',
    'Custom',
    1,
    true,
    0,
    true
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.templates t
    WHERE t.tenant_id = p_tenant_id
      AND t.name = 'Default Inspection Template'
  );

  SELECT t.id
  INTO v_inspection_template_id
  FROM public.templates t
  WHERE t.tenant_id = p_tenant_id
    AND t.name = 'Default Inspection Template'
  ORDER BY t.created_at ASC, t.id ASC
  LIMIT 1;

  UPDATE public.templates
  SET
    type = 'inspection',
    is_active = true,
    updated_at = now()
  WHERE id = v_inspection_template_id;

  INSERT INTO public.template_sections (template_id, name, description, sort_order)
  SELECT
    v_inspection_template_id,
    'Inspection Overview',
    'Core observations and summary for the inspection.',
    1
  WHERE v_inspection_template_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1
      FROM public.template_sections ts
      WHERE ts.template_id = v_inspection_template_id
        AND ts.name = 'Inspection Overview'
    );

  SELECT ts.id
  INTO v_section_id
  FROM public.template_sections ts
  WHERE ts.template_id = v_inspection_template_id
    AND ts.name = 'Inspection Overview'
  ORDER BY ts.sort_order ASC, ts.created_at ASC, ts.id ASC
  LIMIT 1;

  IF v_section_id IS NOT NULL THEN
    INSERT INTO public.template_items (section_id, name, description, item_type, is_required, sort_order)
    SELECT
      v_section_id,
      'Context',
      'Property context: Document occupancy status, weather/access limits, utility state, and any safety concerns before starting.',
      'text',
      false,
      0
    WHERE NOT EXISTS (
      SELECT 1 FROM public.template_items ti
      WHERE ti.section_id = v_section_id
        AND ti.name = 'Context'
    );

    INSERT INTO public.template_items (section_id, name, description, item_type, is_required, sort_order)
    SELECT v_section_id, 'Overall Condition', 'General condition rating for the property.', 'rating', true, 1
    WHERE NOT EXISTS (
      SELECT 1 FROM public.template_items ti
      WHERE ti.section_id = v_section_id
        AND ti.name = 'Overall Condition'
    );

    INSERT INTO public.template_items (section_id, name, description, item_type, is_required, sort_order)
    SELECT v_section_id, 'Summary Notes', 'High-level summary of findings.', 'text', true, 2
    WHERE NOT EXISTS (
      SELECT 1 FROM public.template_items ti
      WHERE ti.section_id = v_section_id
        AND ti.name = 'Summary Notes'
    );

    INSERT INTO public.template_items (section_id, name, description, item_type, is_required, sort_order)
    SELECT v_section_id, 'Inspection Photos', 'Representative inspection photos.', 'photo', false, 3
    WHERE NOT EXISTS (
      SELECT 1 FROM public.template_items ti
      WHERE ti.section_id = v_section_id
        AND ti.name = 'Inspection Photos'
    );

    INSERT INTO public.template_items (section_id, name, description, item_type, is_required, sort_order)
    SELECT
      v_section_id,
      'Inspector Script',
      'Starter dialog: "I will inspect visible and accessible systems today, document findings with photos, and call out any safety concerns. Let me know about known issues, recent repairs, and any areas I cannot access."',
      'text',
      false,
      4
    WHERE NOT EXISTS (
      SELECT 1 FROM public.template_items ti
      WHERE ti.section_id = v_section_id
        AND ti.name = 'Inspector Script'
    );
  END IF;

  -- 2) Agreement template
  INSERT INTO public.templates (
    tenant_id,
    name,
    description,
    type,
    standard,
    version,
    is_default,
    usage_count,
    is_active
  )
  SELECT
    p_tenant_id,
    'Default Inspection Agreement',
    'Baseline agreement content for inspection engagements.',
    'agreement',
    'Custom',
    1,
    true,
    0,
    true
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.templates t
    WHERE t.tenant_id = p_tenant_id
      AND t.name = 'Default Inspection Agreement'
  );

  SELECT t.id
  INTO v_agreement_template_id
  FROM public.templates t
  WHERE t.tenant_id = p_tenant_id
    AND t.name = 'Default Inspection Agreement'
  ORDER BY t.created_at ASC, t.id ASC
  LIMIT 1;

  UPDATE public.templates
  SET
    type = 'agreement',
    is_active = true,
    updated_at = now()
  WHERE id = v_agreement_template_id;

  INSERT INTO public.template_sections (template_id, name, description, sort_order)
  SELECT
    v_agreement_template_id,
    'Agreement Terms',
    'Core terms and acceptance details.',
    1
  WHERE v_agreement_template_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1
      FROM public.template_sections ts
      WHERE ts.template_id = v_agreement_template_id
        AND ts.name = 'Agreement Terms'
    );

  SELECT ts.id
  INTO v_section_id
  FROM public.template_sections ts
  WHERE ts.template_id = v_agreement_template_id
    AND ts.name = 'Agreement Terms'
  ORDER BY ts.sort_order ASC, ts.created_at ASC, ts.id ASC
  LIMIT 1;

  IF v_section_id IS NOT NULL THEN
    INSERT INTO public.template_items (section_id, name, description, item_type, is_required, sort_order)
    SELECT
      v_section_id,
      'Context',
      'AGREEMENT STARTER (EDIT AS NEEDED): This inspection agreement is between Inspector and Client for the property listed in the order. Scope includes visible and accessible systems at the time of inspection, performed to the selected inspection standard. This is a limited visual inspection and is not technically exhaustive. Exclusions include concealed conditions, latent defects, code compliance, environmental hazards unless separately contracted, and future performance guarantees. Client understands findings are based on conditions observed on inspection date. Limitation of liability and dispute-resolution terms should be customized to your jurisdiction. PAYMENT: Fees are due per order terms. REPORT USE: Report is prepared for the client named in this agreement. IMPORTANT WARNING: This template is not legal advice and we do not provide legal services. You should have this agreement reviewed by a qualified attorney licensed in your jurisdiction before use.',
      'text',
      false,
      0
    WHERE NOT EXISTS (
      SELECT 1 FROM public.template_items ti
      WHERE ti.section_id = v_section_id
        AND ti.name = 'Context'
    );

    INSERT INTO public.template_items (section_id, name, description, item_type, is_required, sort_order)
    SELECT
      v_section_id,
      'Legal Review Warning',
      'Important: This agreement template is provided as editable starter content only. It must be reviewed by a qualified legal representative in your jurisdiction before production use.',
      'text',
      true,
      -1
    WHERE NOT EXISTS (
      SELECT 1 FROM public.template_items ti
      WHERE ti.section_id = v_section_id
        AND ti.name = 'Legal Review Warning'
    );

    INSERT INTO public.template_items (section_id, name, description, item_type, is_required, sort_order)
    SELECT
      v_section_id,
      'Legal Review Acknowledged',
      'Confirm this agreement has been reviewed by legal counsel or approved under your organization''s legal policy.',
      'checkbox',
      true,
      4
    WHERE NOT EXISTS (
      SELECT 1 FROM public.template_items ti
      WHERE ti.section_id = v_section_id
        AND ti.name = 'Legal Review Acknowledged'
    );

    INSERT INTO public.template_items (section_id, name, description, item_type, is_required, sort_order)
    SELECT v_section_id, 'Scope of Work', 'Inspection scope covered under this agreement.', 'text', true, 1
    WHERE NOT EXISTS (
      SELECT 1 FROM public.template_items ti
      WHERE ti.section_id = v_section_id
        AND ti.name = 'Scope of Work'
    );

    INSERT INTO public.template_items (section_id, name, description, item_type, is_required, sort_order)
    SELECT v_section_id, 'Terms Accepted', 'Confirm terms and limitations were accepted.', 'checkbox', true, 2
    WHERE NOT EXISTS (
      SELECT 1 FROM public.template_items ti
      WHERE ti.section_id = v_section_id
        AND ti.name = 'Terms Accepted'
    );

    INSERT INTO public.template_items (section_id, name, description, item_type, is_required, sort_order)
    SELECT v_section_id, 'Signed Agreement', 'Capture signed agreement image/document.', 'photo', true, 3
    WHERE NOT EXISTS (
      SELECT 1 FROM public.template_items ti
      WHERE ti.section_id = v_section_id
        AND ti.name = 'Signed Agreement'
    );

    INSERT INTO public.template_items (section_id, name, description, item_type, is_required, sort_order)
    SELECT
      v_section_id,
      'Client Q&A Starter',
      'Starter dialog: "Do you have any known defects, prior reports, or specific concerns you want included in scope? Please confirm all decision-makers have reviewed this agreement."',
      'text',
      false,
      5
    WHERE NOT EXISTS (
      SELECT 1 FROM public.template_items ti
      WHERE ti.section_id = v_section_id
        AND ti.name = 'Client Q&A Starter'
    );
  END IF;

  -- 3) Report template
  INSERT INTO public.templates (
    tenant_id,
    name,
    description,
    type,
    standard,
    version,
    is_default,
    usage_count,
    is_active
  )
  SELECT
    p_tenant_id,
    'Default Inspection Report',
    'Baseline structure for final inspection reporting.',
    'report',
    'Custom',
    1,
    true,
    0,
    true
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.templates t
    WHERE t.tenant_id = p_tenant_id
      AND t.name = 'Default Inspection Report'
  );

  SELECT t.id
  INTO v_report_template_id
  FROM public.templates t
  WHERE t.tenant_id = p_tenant_id
    AND t.name = 'Default Inspection Report'
  ORDER BY t.created_at ASC, t.id ASC
  LIMIT 1;

  UPDATE public.templates
  SET
    type = 'report',
    is_active = true,
    updated_at = now()
  WHERE id = v_report_template_id;

  INSERT INTO public.template_sections (template_id, name, description, sort_order)
  SELECT
    v_report_template_id,
    'Report Summary',
    'Executive summary and major findings.',
    1
  WHERE v_report_template_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1
      FROM public.template_sections ts
      WHERE ts.template_id = v_report_template_id
        AND ts.name = 'Report Summary'
    );

  SELECT ts.id
  INTO v_section_id
  FROM public.template_sections ts
  WHERE ts.template_id = v_report_template_id
    AND ts.name = 'Report Summary'
  ORDER BY ts.sort_order ASC, ts.created_at ASC, ts.id ASC
  LIMIT 1;

  IF v_section_id IS NOT NULL THEN
    INSERT INTO public.template_items (section_id, name, description, item_type, is_required, sort_order)
    SELECT
      v_section_id,
      'Context',
      'Report context: Summarize property type, inspection date/time, weather, occupancy, and major constraints that affected findings.',
      'text',
      false,
      0
    WHERE NOT EXISTS (
      SELECT 1 FROM public.template_items ti
      WHERE ti.section_id = v_section_id
        AND ti.name = 'Context'
    );

    INSERT INTO public.template_items (section_id, name, description, item_type, is_required, sort_order)
    SELECT v_section_id, 'Executive Summary', 'Overall summary for the client report.', 'text', true, 1
    WHERE NOT EXISTS (
      SELECT 1 FROM public.template_items ti
      WHERE ti.section_id = v_section_id
        AND ti.name = 'Executive Summary'
    );

    INSERT INTO public.template_items (section_id, name, description, item_type, is_required, sort_order)
    SELECT v_section_id, 'Key Findings', 'Major issues identified during inspection.', 'text', true, 2
    WHERE NOT EXISTS (
      SELECT 1 FROM public.template_items ti
      WHERE ti.section_id = v_section_id
        AND ti.name = 'Key Findings'
    );

    INSERT INTO public.template_items (section_id, name, description, item_type, is_required, sort_order)
    SELECT v_section_id, 'Recommendations', 'Recommended next steps and repairs.', 'text', false, 3
    WHERE NOT EXISTS (
      SELECT 1 FROM public.template_items ti
      WHERE ti.section_id = v_section_id
        AND ti.name = 'Recommendations'
    );

    INSERT INTO public.template_items (section_id, name, description, item_type, is_required, sort_order)
    SELECT
      v_section_id,
      'Client Delivery Summary',
      'Starter dialog: "This summary highlights major findings first, followed by supporting observations and photos. Items should be prioritized by safety, function, and cost impact."',
      'text',
      false,
      4
    WHERE NOT EXISTS (
      SELECT 1 FROM public.template_items ti
      WHERE ti.section_id = v_section_id
        AND ti.name = 'Client Delivery Summary'
    );
  END IF;

  -- 4) Additional baseline templates (broader starter catalog)
  FOR v_seed IN
    SELECT *
    FROM (
      VALUES
        (
          'Standard Home Inspection',
          'Comprehensive residential inspection template.',
          'inspection',
          'Core Systems',
          '[{"name":"Exterior","description":"Exterior systems and site conditions.","item_type":"checkbox","is_required":true,"sort_order":1},{"name":"Roofing","description":"Roof covering and drainage observations.","item_type":"checkbox","is_required":true,"sort_order":2},{"name":"Electrical","description":"Panel, branch circuits, and safety checks.","item_type":"checkbox","is_required":true,"sort_order":3}]'::jsonb
        ),
        (
          '4-Point Inspection',
          'Insurance-focused inspection for roof, electrical, plumbing, and HVAC.',
          'inspection',
          '4-Point Components',
          '[{"name":"Roof Condition","description":"Age/condition of roof systems.","item_type":"rating","is_required":true,"sort_order":1},{"name":"Electrical Panel","description":"Panel condition and risk factors.","item_type":"rating","is_required":true,"sort_order":2},{"name":"Plumbing System","description":"Supply, drain, and leak indicators.","item_type":"rating","is_required":true,"sort_order":3}]'::jsonb
        ),
        (
          'Wind Mitigation Inspection',
          'Wind mitigation verification for insurance underwriting.',
          'inspection',
          'Mitigation Checklist',
          '[{"name":"Roof Covering Type","description":"Primary roof covering and condition.","item_type":"select","is_required":true,"sort_order":1},{"name":"Roof-to-Wall Attachment","description":"Connection method observed.","item_type":"select","is_required":true,"sort_order":2},{"name":"Opening Protection","description":"Window/door protection details.","item_type":"select","is_required":true,"sort_order":3}]'::jsonb
        ),
        (
          'Pre-Listing Inspection',
          'Seller-focused inspection used before listing a property.',
          'inspection',
          'Listing Readiness',
          '[{"name":"Material Defects","description":"Items likely to impact listing confidence.","item_type":"text","is_required":true,"sort_order":1},{"name":"Recommended Repairs","description":"Suggested pre-list remediation.","item_type":"text","is_required":true,"sort_order":2},{"name":"Marketing Photos","description":"Representative condition photos.","item_type":"photo","is_required":false,"sort_order":3}]'::jsonb
        ),
        (
          'Residential Inspection Agreement',
          'Default residential service agreement language and acceptance.',
          'agreement',
          'Agreement Clauses',
          '[{"name":"Client Acknowledgement","description":"Client confirms terms and limitations.","item_type":"checkbox","is_required":true,"sort_order":1},{"name":"Scope Definition","description":"Covered systems and exclusions.","item_type":"text","is_required":true,"sort_order":2},{"name":"Digital Signature Captured","description":"Inspector/client signature captured.","item_type":"photo","is_required":true,"sort_order":3}]'::jsonb
        ),
        (
          'Commercial Inspection Agreement',
          'Default commercial scope and liability agreement.',
          'agreement',
          'Commercial Terms',
          '[{"name":"Property Scope","description":"Commercial systems in scope.","item_type":"text","is_required":true,"sort_order":1},{"name":"Limitations","description":"Known access limitations and exclusions.","item_type":"text","is_required":true,"sort_order":2},{"name":"Authorization Confirmed","description":"Authorized signer confirmation.","item_type":"checkbox","is_required":true,"sort_order":3}]'::jsonb
        ),
        (
          'Full Narrative Report',
          'Detailed narrative report structure for full inspections.',
          'report',
          'Narrative Summary',
          '[{"name":"Executive Summary","description":"Top-level report summary.","item_type":"text","is_required":true,"sort_order":1},{"name":"System-by-System Findings","description":"Detailed findings by system.","item_type":"text","is_required":true,"sort_order":2},{"name":"Recommendations","description":"Recommended actions by priority.","item_type":"text","is_required":false,"sort_order":3}]'::jsonb
        ),
        (
          'Insurance 4-Point Report',
          'Structured report output for 4-point inspections.',
          'report',
          'Carrier Deliverables',
          '[{"name":"4-Point Summary","description":"Carrier-facing summary of findings.","item_type":"text","is_required":true,"sort_order":1},{"name":"Risk Notes","description":"Key underwriting risk notes.","item_type":"text","is_required":true,"sort_order":2},{"name":"Supporting Photos","description":"Photo evidence package.","item_type":"photo","is_required":true,"sort_order":3}]'::jsonb
        ),
        (
          'Executive Summary Report',
          'Condensed report suitable for quick stakeholder review.',
          'report',
          'Summary Highlights',
          '[{"name":"Critical Findings","description":"Highest-priority concerns.","item_type":"text","is_required":true,"sort_order":1},{"name":"Condition Snapshot","description":"Overall condition at a glance.","item_type":"rating","is_required":true,"sort_order":2},{"name":"Action Plan","description":"Immediate and near-term next steps.","item_type":"text","is_required":false,"sort_order":3}]'::jsonb
        )
    ) AS seeds(name, description, template_type, section_name, items)
  LOOP
    INSERT INTO public.templates (
      tenant_id,
      name,
      description,
      type,
      standard,
      version,
      is_default,
      usage_count,
      is_active
    )
    SELECT
      p_tenant_id,
      v_seed.name,
      v_seed.description,
      v_seed.template_type,
      'Custom',
      1,
      false,
      0,
      true
    WHERE NOT EXISTS (
      SELECT 1
      FROM public.templates t
      WHERE t.tenant_id = p_tenant_id
        AND t.name = v_seed.name
    );

    SELECT t.id
    INTO v_template_id
    FROM public.templates t
    WHERE t.tenant_id = p_tenant_id
      AND t.name = v_seed.name
    ORDER BY t.created_at ASC, t.id ASC
    LIMIT 1;

    UPDATE public.templates
    SET
      type = v_seed.template_type,
      is_active = true,
      updated_at = now()
    WHERE id = v_template_id;

    INSERT INTO public.template_sections (template_id, name, description, sort_order)
    SELECT
      v_template_id,
      v_seed.section_name,
      'Auto-seeded default section.',
      1
    WHERE v_template_id IS NOT NULL
      AND NOT EXISTS (
        SELECT 1
        FROM public.template_sections ts
        WHERE ts.template_id = v_template_id
          AND ts.name = v_seed.section_name
      );

    SELECT ts.id
    INTO v_section_id
    FROM public.template_sections ts
    WHERE ts.template_id = v_template_id
      AND ts.name = v_seed.section_name
    ORDER BY ts.sort_order ASC, ts.created_at ASC, ts.id ASC
    LIMIT 1;

    IF v_section_id IS NOT NULL THEN
      INSERT INTO public.template_items (section_id, name, description, item_type, is_required, sort_order)
      SELECT
        v_section_id,
        'Context',
        CASE
          WHEN v_seed.template_type = 'agreement' THEN
            'AGREEMENT STARTER (EDIT AS NEEDED): This inspection agreement is between Inspector and Client for the property listed in the order. Scope includes visible and accessible systems at the time of inspection and excludes concealed conditions unless otherwise stated. IMPORTANT WARNING: This template is not legal advice and we do not provide legal services. Have legal counsel review before use.'
          WHEN v_seed.template_type = 'report' THEN
            'Report context: Include inspection date, property details, conditions, constraints, and intended audience for this report.'
          ELSE
            'Inspection context: Capture access constraints, occupancy, weather, system availability, and special instructions before beginning.'
        END,
        'text',
        false,
        0
      WHERE NOT EXISTS (
        SELECT 1
        FROM public.template_items ti
        WHERE ti.section_id = v_section_id
          AND ti.name = 'Context'
      );

      INSERT INTO public.template_items (section_id, name, description, item_type, is_required, sort_order)
      SELECT
        v_section_id,
        'Legal Review Warning',
        'Important: This agreement template is starter content only, not legal advice. Review with qualified counsel before use.',
        'text',
        true,
        -1
      WHERE v_seed.template_type = 'agreement'
        AND NOT EXISTS (
          SELECT 1
          FROM public.template_items ti
          WHERE ti.section_id = v_section_id
            AND ti.name = 'Legal Review Warning'
        );

      INSERT INTO public.template_items (section_id, name, description, item_type, is_required, sort_order)
      SELECT
        v_section_id,
        'Legal Review Acknowledged',
        'Confirm legal review was completed or approved under your legal policy.',
        'checkbox',
        true,
        99
      WHERE v_seed.template_type = 'agreement'
        AND NOT EXISTS (
          SELECT 1
          FROM public.template_items ti
          WHERE ti.section_id = v_section_id
            AND ti.name = 'Legal Review Acknowledged'
        );

      INSERT INTO public.template_items (section_id, name, description, item_type, is_required, sort_order)
      SELECT
        v_section_id,
        'Starter Dialog',
        CASE
          WHEN v_seed.template_type = 'agreement' THEN
            'Use this template as a full editable starting point: confirm parties, property address, scope, exclusions, fee terms, dispute language, and signature requirements. Replace bracketed placeholders before use.'
          WHEN v_seed.template_type = 'report' THEN
            'Use this template to deliver findings clearly: start with critical issues, then system observations, photo evidence, and prioritized recommendations with clear next actions.'
          ELSE
            'Use this template on-site: verify access, document observed condition, capture supporting photos, and write concise notes that explain risk and recommended action.'
        END,
        'text',
        false,
        98
      WHERE NOT EXISTS (
        SELECT 1
        FROM public.template_items ti
        WHERE ti.section_id = v_section_id
          AND ti.name = 'Starter Dialog'
      );

      FOR v_seed_item IN
        SELECT
          value->>'name' AS name,
          value->>'description' AS description,
          value->>'item_type' AS item_type,
          COALESCE((value->>'is_required')::boolean, false) AS is_required,
          COALESCE((value->>'sort_order')::integer, 1) AS sort_order
        FROM jsonb_array_elements(v_seed.items) AS value
      LOOP
        INSERT INTO public.template_items (section_id, name, description, item_type, is_required, sort_order)
        SELECT
          v_section_id,
          v_seed_item.name,
          v_seed_item.description,
          v_seed_item.item_type,
          v_seed_item.is_required,
          v_seed_item.sort_order
        WHERE NOT EXISTS (
          SELECT 1
          FROM public.template_items ti
          WHERE ti.section_id = v_section_id
            AND ti.name = v_seed_item.name
        );
      END LOOP;
    END IF;
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.seed_default_templates_on_tenant_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.seed_default_templates_for_tenant(NEW.id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tenants_seed_default_templates ON public.tenants;
CREATE TRIGGER tenants_seed_default_templates
AFTER INSERT ON public.tenants
FOR EACH ROW
EXECUTE FUNCTION public.seed_default_templates_on_tenant_insert();

DO $$
DECLARE
  v_tenant record;
BEGIN
  FOR v_tenant IN SELECT id FROM public.tenants LOOP
    PERFORM public.seed_default_templates_for_tenant(v_tenant.id);
  END LOOP;
END;
$$;
