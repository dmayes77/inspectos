import { createServiceClient, serverError, success } from '@/lib/supabase';
import { withAuth } from '@/lib/api/with-auth';

/**
 * GET /api/admin/inspections/[id]/data
 * Fetch inspection with all related data (answers, findings, signatures, media).
 * Uses separate flat queries instead of nested joins to avoid PostgREST ambiguity errors.
 */
export const GET = withAuth<{ id: string }>(async ({ tenant, params }) => {
  const { id: inspectionId } = params;
  const supabase = createServiceClient();

  // 1. Fetch the inspection row
  const { data: inspection, error: inspectionError } = await supabase
    .from('inspections')
    .select('*')
    .eq('id', inspectionId)
    .eq('tenant_id', tenant.id)
    .single();

  if (inspectionError || !inspection) {
    console.error('Failed to fetch inspection:', JSON.stringify(inspectionError));
    return serverError('Failed to fetch inspection', inspectionError);
  }

  // 2. Fetch related order (with property/client/agent) if this inspection has an order
  let orderData = null;
  if (inspection.order_id) {
    const { data: order } = await supabase
      .from('orders')
      .select('id, scheduled_date, status, property_id, client_id, agent_id')
      .eq('id', inspection.order_id)
      .single();

    if (order) {
      const [propertyRes, clientRes, agentRes] = await Promise.all([
        order.property_id
          ? supabase.from('properties').select('id, address_line1, address_line2, city, state, zip_code, property_type').eq('id', order.property_id).single()
          : Promise.resolve({ data: null }),
        order.client_id
          ? supabase.from('clients').select('id, name, email, phone').eq('id', order.client_id).single()
          : Promise.resolve({ data: null }),
        order.agent_id
          ? supabase.from('agents').select('id, name, email, phone').eq('id', order.agent_id).single()
          : Promise.resolve({ data: null }),
      ]);

      orderData = {
        id: order.id,
        scheduled_date: order.scheduled_date,
        status: order.status,
        property: propertyRes.data ?? null,
        client: clientRes.data ?? null,
        agent: agentRes.data ?? null,
      };
    }
  }

  // 3. Fetch inspector profile if assigned
  let inspectorData = null;
  if (inspection.inspector_id) {
    const { data: inspector } = await supabase
      .from('profiles')
      .select('id, full_name, email, avatar_url')
      .eq('id', inspection.inspector_id)
      .single();
    inspectorData = inspector ?? null;
  }

  // 4. Fetch template with sections/items if assigned
  let templateData = null;
  if (inspection.template_id) {
    const { data: template } = await supabase
      .from('templates')
      .select('id, name')
      .eq('id', inspection.template_id)
      .single();

    if (template) {
      const { data: sections } = await supabase
        .from('template_sections')
        .select('id, name, description, sort_order')
        .eq('template_id', inspection.template_id)
        .order('sort_order');

      const sectionsWithItems = await Promise.all(
        (sections ?? []).map(async (section) => {
          const { data: items } = await supabase
            .from('template_items')
            .select('id, name, description, item_type, options, is_required, sort_order')
            .eq('section_id', section.id)
            .order('sort_order');
          return { ...section, template_items: items ?? [] };
        })
      );

      templateData = { ...template, template_sections: sectionsWithItems };
    }
  }

  // 5. Fetch answers, findings, signatures, media (all non-fatal)
  const [answersRes, findingsRes, signaturesRes, mediaRes] = await Promise.all([
    supabase.from('inspection_answers').select('*').eq('inspection_id', inspectionId).eq('tenant_id', tenant.id).order('created_at'),
    supabase.from('inspection_findings').select('*').eq('inspection_id', inspectionId).eq('tenant_id', tenant.id).order('created_at'),
    supabase.from('inspection_signatures').select('*').eq('inspection_id', inspectionId).eq('tenant_id', tenant.id).order('signed_at'),
    supabase.from('inspection_media').select('*').eq('inspection_id', inspectionId).eq('tenant_id', tenant.id).order('created_at'),
  ]);

  return success({
    inspection: {
      ...inspection,
      order: orderData,
      inspector: inspectorData,
      template: templateData,
    },
    answers: answersRes.data ?? [],
    findings: findingsRes.data ?? [],
    signatures: signaturesRes.data ?? [],
    media: mediaRes.data ?? [],
  });
});
