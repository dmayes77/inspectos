import { NextRequest } from 'next/server';
import {
  createUserClient,
  getAccessToken,
  getUserFromToken,
  unauthorized,
  badRequest,
  notFound,
  serverError,
  success
} from '@/lib/supabase';
import { resolveTenant } from '@/lib/tenants';

const normalizeOptions = (options: unknown): string[] | undefined => {
  if (!Array.isArray(options)) return undefined;
  return options.map((opt) => (typeof opt === 'string' ? opt : (opt as Record<string, unknown>)?.label ?? (opt as Record<string, unknown>)?.value)).filter(Boolean) as string[];
};

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/admin/templates/[id]
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  try {
    const accessToken = getAccessToken(request);
    if (!accessToken) return unauthorized('Missing access token');

    const user = getUserFromToken(accessToken);
    if (!user) return unauthorized('Invalid access token');

    const tenantSlug = request.nextUrl.searchParams.get('tenant');
    const supabase = createUserClient(accessToken);
    const { tenant, error: tenantError } = await resolveTenant(supabase, user.userId, tenantSlug);
    if (tenantError || !tenant) return badRequest('Tenant not found');

    const { data: template, error: templateError } = await supabase
      .from('templates')
      .select('id, name, description, type, standard, is_default, usage_count, updated_at, template_sections(id, template_id, name, description, sort_order, template_items(id, section_id, name, description, item_type, options, is_required, sort_order))')
      .eq('tenant_id', tenant.id)
      .eq('id', id)
      .single();

    if (templateError || !template) return notFound('Template not found');

    const { data: services } = await supabase
      .from('services')
      .select('id, name, price, category')
      .eq('tenant_id', tenant.id)
      .eq('template_id', id)
      .order('name');

    const sections = (template.template_sections ?? [])
      .sort((a: Record<string, unknown>, b: Record<string, unknown>) => (a.sort_order as number) - (b.sort_order as number))
      .map((section: Record<string, unknown>) => ({
        id: section.id,
        templateId: section.template_id,
        name: section.name,
        description: section.description,
        sortOrder: section.sort_order ?? 0,
        items: ((section.template_items as Record<string, unknown>[]) ?? [])
          .sort((a: Record<string, unknown>, b: Record<string, unknown>) => (a.sort_order as number) - (b.sort_order as number))
          .map((item: Record<string, unknown>) => ({
            id: item.id,
            sectionId: item.section_id,
            name: item.name,
            description: item.description,
            itemType: item.item_type,
            options: normalizeOptions(item.options),
            isRequired: item.is_required ?? false,
            sortOrder: item.sort_order ?? 0,
          })),
      }));

    return success({
      id: template.id,
      name: template.name,
      description: template.description,
      type: template.type ?? 'inspection',
      standard: template.standard ?? 'Custom',
      isDefault: template.is_default ?? false,
      usageCount: template.usage_count ?? 0,
      lastModified: new Date(template.updated_at).toLocaleDateString(),
      serviceIds: (services ?? []).map((s: Record<string, unknown>) => s.id),
      serviceNames: (services ?? []).map((s: Record<string, unknown>) => s.name),
      sections,
    });
  } catch (error) {
    return serverError('Failed to fetch template', error);
  }
}

/**
 * PUT /api/admin/templates/[id]
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
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

    const updateData: Record<string, unknown> = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.type !== undefined) updateData.type = body.type;
    if (body.standard !== undefined) updateData.standard = body.standard;
    if (body.isDefault !== undefined) updateData.is_default = body.isDefault;

    const { data, error } = await supabase
      .from('templates')
      .update(updateData)
      .eq('tenant_id', tenant.id)
      .eq('id', id)
      .select()
      .single();

    if (error) return serverError('Failed to update template', error);

    return success(data);
  } catch (error) {
    return serverError('Failed to update template', error);
  }
}

/**
 * DELETE /api/admin/templates/[id]
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  try {
    const accessToken = getAccessToken(request);
    if (!accessToken) return unauthorized('Missing access token');

    const user = getUserFromToken(accessToken);
    if (!user) return unauthorized('Invalid access token');

    const tenantSlug = request.nextUrl.searchParams.get('tenant');
    const supabase = createUserClient(accessToken);
    const { tenant, error: tenantError } = await resolveTenant(supabase, user.userId, tenantSlug);
    if (tenantError || !tenant) return badRequest('Tenant not found');

    const { error } = await supabase
      .from('templates')
      .update({ is_active: false })
      .eq('tenant_id', tenant.id)
      .eq('id', id);

    if (error) return serverError('Failed to delete template', error);

    return success({ success: true });
  } catch (error) {
    return serverError('Failed to delete template', error);
  }
}
