import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getTenantId } from "@/lib/supabase/admin-helpers";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const tenantId = getTenantId();
  const { id } = await params;

  const { data: template, error: templateError } = await supabaseAdmin
    .from("templates")
    .select(
      "id, name, description, type, standard, is_default, usage_count, template_sections(id, name, description, sort_order, template_items(id, name, description, item_type, options, is_required, sort_order))"
    )
    .eq("tenant_id", tenantId)
    .eq("id", id)
    .single();

  if (templateError || !template) {
    return NextResponse.json({ error: templateError?.message ?? "Template not found." }, { status: 404 });
  }

  const { data: createdTemplate, error: createError } = await supabaseAdmin
    .from("templates")
    .insert({
      tenant_id: tenantId,
      name: `${template.name} (Copy)`,
      description: template.description ?? null,
      type: template.type ?? "inspection",
      standard: template.standard ?? "Custom",
      is_default: false,
      usage_count: 0,
      is_active: true,
    })
    .select("*")
    .single();

  if (createError || !createdTemplate) {
    return NextResponse.json({ error: createError?.message ?? "Failed to duplicate template." }, { status: 500 });
  }

  const sections = (template.template_sections ?? []).sort((a, b) => a.sort_order - b.sort_order);
  const { data: insertedSections, error: sectionError } = await supabaseAdmin
    .from("template_sections")
    .insert(
      sections.map((section) => ({
        template_id: createdTemplate.id,
        name: section.name,
        description: section.description ?? null,
        sort_order: section.sort_order ?? 0,
      }))
    )
    .select("id");

  if (sectionError || !insertedSections) {
    return NextResponse.json({ error: sectionError?.message ?? "Failed to duplicate sections." }, { status: 500 });
  }

  const itemPayloads: {
    section_id: string;
    name: string;
    description: string | null;
    item_type: string;
    options: unknown;
    is_required: boolean;
    sort_order: number;
  }[] = [];

  sections.forEach((section, index) => {
    const targetSectionId = insertedSections[index]?.id;
    if (!targetSectionId) return;
    (section.template_items ?? []).forEach((item) => {
      itemPayloads.push({
        section_id: targetSectionId,
        name: item.name,
        description: item.description ?? null,
        item_type: item.item_type,
        options: item.options ?? null,
        is_required: item.is_required ?? false,
        sort_order: item.sort_order ?? 0,
      });
    });
  });

  if (itemPayloads.length > 0) {
    const { error: itemError } = await supabaseAdmin.from("template_items").insert(itemPayloads);
    if (itemError) {
      return NextResponse.json({ error: itemError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ id: createdTemplate.id });
}
