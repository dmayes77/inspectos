import {
  badRequest,
  serverError,
  success
} from '@/lib/supabase';
import { withAuth } from '@/lib/api/with-auth';

/**
 * POST /api/admin/templates/[id]/duplicate
 */
export const POST = withAuth<{ id: string }>(async ({ supabase, tenant, params }) => {
  const { id } = params;

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
});
