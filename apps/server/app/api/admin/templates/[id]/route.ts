import {
  notFound,
  serverError,
  success
} from '@/lib/supabase';
import { withAuth } from '@/lib/api/with-auth';

const normalizeOptions = (options: unknown): string[] | undefined => {
  if (!Array.isArray(options)) return undefined;
  return options.map((opt) => (typeof opt === 'string' ? opt : (opt as Record<string, unknown>)?.label ?? (opt as Record<string, unknown>)?.value)).filter(Boolean) as string[];
};

/**
 * GET /api/admin/templates/[id]
 */
export const GET = withAuth<{ id: string }>(async ({ supabase, tenant, params }) => {
  const { id } = params;

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
});

/**
 * PUT /api/admin/templates/[id]
 */
export const PUT = withAuth<{ id: string }>(async ({ supabase, tenant, params, request }) => {
  const { id } = params;

  const body = await request.json();

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
});

/**
 * DELETE /api/admin/templates/[id]
 */
export const DELETE = withAuth<{ id: string }>(async ({ supabase, tenant, params }) => {
  const { id } = params;

  const { error } = await supabase
    .from('templates')
    .update({ is_active: false })
    .eq('tenant_id', tenant.id)
    .eq('id', id);

  if (error) return serverError('Failed to delete template', error);

  return success({ success: true });
});
