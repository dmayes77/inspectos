import { createUserClient } from '@/lib/supabase';

type SupabaseClient = ReturnType<typeof createUserClient>;

type SnapshotSectionRow = {
  id: string;
  name: string;
  description?: string | null;
  sort_order?: number | null;
  source_template_section_id?: string | null;
};

type SnapshotItemRow = {
  id: string;
  section_id: string;
  name: string;
  description?: string | null;
  item_type?: string | null;
  options?: unknown;
  is_required?: boolean | null;
  sort_order?: number | null;
  source_template_item_id?: string | null;
};

export async function ensureMobileInspectionOutlineSnapshot(
  supabase: SupabaseClient,
  tenantId: string,
  orderId: string,
  templateId: string | null | undefined,
  userId: string
) {
  if (!templateId) return;

  const { data: existingSections, error: existingSectionsError } = await supabase
    .from('mobile_inspection_custom_sections')
    .select('id, source_template_section_id')
    .eq('tenant_id', tenantId)
    .eq('order_id', orderId);

  if (existingSectionsError) {
    throw existingSectionsError;
  }

  const sectionMap = new Map<string, string>();
  for (const row of existingSections ?? []) {
    const sourceId = (row as { source_template_section_id?: string | null }).source_template_section_id;
    const snapshotId = (row as { id?: string }).id;
    if (sourceId && snapshotId) {
      sectionMap.set(sourceId, snapshotId);
    }
  }

  const { data: templateSections, error: sectionsError } = await supabase
    .from('template_sections')
    .select('id, name, description, sort_order')
    .eq('template_id', templateId)
    .order('sort_order')
    .order('created_at');

  if (sectionsError) {
    throw sectionsError;
  }

  for (const section of templateSections ?? []) {
    const sourceSectionId = String((section as { id?: string }).id ?? '');
    if (!sourceSectionId) continue;

    let snapshotSectionId = sectionMap.get(sourceSectionId);
    if (!snapshotSectionId) {
      const { data: insertedSection, error: insertSectionError } = await supabase
        .from('mobile_inspection_custom_sections')
        .insert({
          tenant_id: tenantId,
          order_id: orderId,
          source_template_section_id: sourceSectionId,
          name: (section as { name?: string }).name ?? 'Section',
          description: (section as { description?: string | null }).description ?? null,
          sort_order: (section as { sort_order?: number | null }).sort_order ?? 0,
          created_by: userId,
        })
        .select('id')
        .single();

      if (insertSectionError || !insertedSection?.id) {
        throw insertSectionError ?? new Error('Failed to create snapshot section');
      }

      snapshotSectionId = insertedSection.id as string;
      sectionMap.set(sourceSectionId, snapshotSectionId);
    }

    const { data: existingItems, error: existingItemsError } = await supabase
      .from('mobile_inspection_custom_items')
      .select('id, source_template_item_id')
      .eq('tenant_id', tenantId)
      .eq('order_id', orderId)
      .eq('section_id', snapshotSectionId);

    if (existingItemsError) {
      throw existingItemsError;
    }

    const itemMap = new Map<string, string>();
    for (const row of existingItems ?? []) {
      const sourceId = (row as { source_template_item_id?: string | null }).source_template_item_id;
      const snapshotId = (row as { id?: string }).id;
      if (sourceId && snapshotId) {
        itemMap.set(sourceId, snapshotId);
      }
    }

    const { data: templateItems, error: itemsError } = await supabase
      .from('template_items')
      .select('id, name, description, item_type, options, is_required, sort_order')
      .eq('section_id', sourceSectionId)
      .order('sort_order')
      .order('created_at');

    if (itemsError) {
      throw itemsError;
    }

    for (const item of templateItems ?? []) {
      const sourceItemId = String((item as { id?: string }).id ?? '');
      if (!sourceItemId || itemMap.has(sourceItemId)) continue;

      const { error: insertItemError } = await supabase.from('mobile_inspection_custom_items').insert({
        tenant_id: tenantId,
        order_id: orderId,
        section_id: snapshotSectionId,
        source_template_item_id: sourceItemId,
        name: (item as { name?: string }).name ?? 'Item',
        description: (item as { description?: string | null }).description ?? null,
        item_type: (item as { item_type?: string | null }).item_type ?? 'text',
        options: (item as { options?: unknown }).options ?? null,
        is_required: Boolean((item as { is_required?: boolean | null }).is_required),
        sort_order: (item as { sort_order?: number | null }).sort_order ?? 0,
        created_by: userId,
      });

      if (insertItemError) {
        throw insertItemError;
      }
    }
  }
}

export async function fetchMobileInspectionOutline(
  supabase: SupabaseClient,
  tenantId: string,
  orderId: string,
  templateId: string | null | undefined,
  userId: string,
  templateName?: string | null,
  templateDescription?: string | null
) {
  await ensureMobileInspectionOutlineSnapshot(supabase, tenantId, orderId, templateId, userId);

  const [sectionsRes, itemsRes] = await Promise.all([
    supabase
      .from('mobile_inspection_custom_sections')
      .select('id, name, description, sort_order, source_template_section_id')
      .eq('tenant_id', tenantId)
      .eq('order_id', orderId)
      .eq('is_hidden', false)
      .order('sort_order')
      .order('created_at'),
    supabase
      .from('mobile_inspection_custom_items')
      .select('id, section_id, name, description, item_type, options, is_required, sort_order, source_template_item_id')
      .eq('tenant_id', tenantId)
      .eq('order_id', orderId)
      .eq('is_hidden', false)
      .order('sort_order')
      .order('created_at'),
  ]);

  if (sectionsRes.error) throw sectionsRes.error;
  if (itemsRes.error) throw itemsRes.error;

  const sectionItems = new Map<string, SnapshotItemRow[]>();
  for (const item of (itemsRes.data ?? []) as SnapshotItemRow[]) {
    const sectionId = item.section_id;
    if (!sectionId) continue;
    const current = sectionItems.get(sectionId) ?? [];
    current.push(item);
    sectionItems.set(sectionId, current);
  }

  const sections = ((sectionsRes.data ?? []) as SnapshotSectionRow[]).map((section) => ({
    id: section.id,
    name: section.name,
    description: section.description ?? null,
    sort_order: section.sort_order ?? null,
    source_template_section_id: section.source_template_section_id ?? null,
    is_custom: !section.source_template_section_id,
    items: (sectionItems.get(section.id) ?? []).map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description ?? null,
      item_type: item.item_type ?? null,
      options: item.options ?? null,
      is_required: item.is_required ?? false,
      sort_order: item.sort_order ?? null,
      source_template_item_id: item.source_template_item_id ?? null,
      source_section_id: section.source_template_section_id ?? null,
      is_custom: !item.source_template_item_id,
    })),
  }));

  if (sections.length === 0) return null;

  return {
    id: templateId ?? `outline-${orderId}`,
    name: templateName ?? 'Inspection Outline',
    description: templateDescription ?? null,
    sections,
  };
}
