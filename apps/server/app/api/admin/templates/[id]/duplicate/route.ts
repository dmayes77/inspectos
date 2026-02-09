import { NextRequest } from 'next/server';
import {
  createUserClient,
  getAccessToken,
  getUserFromToken,
  unauthorized,
  badRequest,
  serverError,
  success
} from '@/lib/supabase';
import { resolveTenant } from '@/lib/tenants';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/admin/templates/[id]/duplicate
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  try {
    const accessToken = getAccessToken(request);
    if (!accessToken) return unauthorized('Missing access token');

    const user = getUserFromToken(accessToken);
    if (!user) return unauthorized('Invalid access token');

    const body = await request.json();
    const { tenant_slug } = body;

    const tenantSlug = tenant_slug || request.nextUrl.searchParams.get('tenant');
    const supabase = createUserClient(accessToken);
    const { tenant, error: tenantError } = await resolveTenant(supabase, user.userId, tenantSlug);
    if (tenantError || !tenant) return badRequest('Tenant not found');

    // Fetch original template with sections and items
    const { data: original, error: fetchError } = await supabase
      .from('templates')
      .select('*, template_sections(*, template_items(*))')
      .eq('tenant_id', tenant.id)
      .eq('id', id)
      .single();

    if (fetchError || !original) return badRequest('Template not found');

    // Create duplicate template
    const { data: newTemplate, error: createError } = await supabase
      .from('templates')
      .insert({
        tenant_id: tenant.id,
        name: `${original.name} (Copy)`,
        description: original.description,
        type: original.type,
        standard: original.standard,
        is_default: false,
        usage_count: 0,
        is_active: true,
      })
      .select()
      .single();

    if (createError || !newTemplate) return serverError('Failed to duplicate template', createError);

    // Duplicate sections and items
    for (const section of (original.template_sections ?? [])) {
      const { data: newSection, error: sectionError } = await supabase
        .from('template_sections')
        .insert({
          template_id: newTemplate.id,
          name: section.name,
          description: section.description,
          sort_order: section.sort_order,
        })
        .select()
        .single();

      if (sectionError || !newSection) continue;

      for (const item of (section.template_items ?? [])) {
        await supabase.from('template_items').insert({
          section_id: newSection.id,
          name: item.name,
          description: item.description,
          item_type: item.item_type,
          options: item.options,
          is_required: item.is_required,
          sort_order: item.sort_order,
        });
      }
    }

    return success(newTemplate);
  } catch (error) {
    return serverError('Failed to duplicate template', error);
  }
}
