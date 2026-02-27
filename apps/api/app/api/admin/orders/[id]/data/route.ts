import { createServiceClient, serverError, success } from '@/lib/supabase';
import { withAuth } from '@/lib/api/with-auth';
import { resolveIdLookup } from '@/lib/identifiers/lookup';

/**
 * GET /api/admin/orders/[id]/data
 * Fetch an order with all field data: answers, findings, signatures, media.
 * These are the on-site inspection records — previously stored against inspections,
 * now stored directly against the order after migration 043.
 */
export const GET = withAuth<{ id: string }>(async ({ tenant, params }) => {
  const { id } = params;
  const lookup = resolveIdLookup(id, { publicColumn: "order_number", transformPublicValue: (value) => value.toUpperCase() });
  const supabase = createServiceClient();

  // 1. Fetch the order with related data
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select(`
      *,
      property:properties(id, public_id, address_line1, address_line2, city, state, zip_code, property_type, year_built, square_feet),
      client:clients(id, public_id, name, email, phone, company),
      agent:agents(id, public_id, name, email, phone),
      inspector:profiles(id, full_name, email, avatar_url),
      services:order_services(
        id, service_id, name, status, price, duration_minutes, template_id, sort_order, notes, inspector_id, vendor_id,
        inspector:profiles!inspection_services_inspector_id_fkey(id, full_name, email, avatar_url),
        vendor:vendors!inspection_services_vendor_id_fkey(id, name, vendor_type, email, phone)
      )
    `)
    .eq(lookup.column, lookup.value)
    .eq('tenant_id', tenant.id)
    .limit(1)
    .maybeSingle();

  if (orderError || !order) {
    return serverError('Failed to fetch order', orderError);
  }

  const orderId = order.id;

  // 2. Fetch template with sections/items if assigned
  let templateData = null;
  if (order.template_id) {
    const { data: template } = await supabase
      .from('templates')
      .select('id, name, description')
      .eq('id', order.template_id)
      .single();

    if (template) {
      const { data: sections } = await supabase
        .from('template_sections')
        .select('id, name, description, sort_order')
        .eq('template_id', order.template_id)
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

  // 3. Fetch answers, findings, signatures, media
  const [answersRes, findingsRes, signaturesRes, mediaRes] = await Promise.all([
    supabase.from('answers').select('*').eq('order_id', orderId).eq('tenant_id', tenant.id).order('created_at'),
    supabase.from('findings').select('*').eq('order_id', orderId).eq('tenant_id', tenant.id).order('created_at'),
    supabase.from('signatures').select('*').eq('order_id', orderId).eq('tenant_id', tenant.id).order('signed_at'),
    supabase.from('media_assets').select('*').eq('order_id', orderId).eq('tenant_id', tenant.id).order('created_at'),
  ]);

  return success({
    inspection: {
      ...order,
      template: templateData,
    },
    answers: answersRes.data ?? [],
    findings: findingsRes.data ?? [],
    signatures: signaturesRes.data ?? [],
    media: mediaRes.data ?? [],
  });
});
