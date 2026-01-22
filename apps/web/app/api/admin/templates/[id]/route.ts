import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getTenantId } from "@/lib/supabase/admin-helpers";
import type { TemplateSection, TemplateItem } from "@/types/template";
import { validateRequestBody } from "@/lib/api/validate";
import { updateTemplateSchema } from "@/lib/validations/template";

const normalizeOptions = (options: unknown): string[] | undefined => {
  if (!Array.isArray(options)) return undefined;
  return options
    .map((option) => {
      if (typeof option === "string") return option;
      if (option && typeof option === "object") {
        const value = (option as { label?: string; value?: string }).label ?? (option as { value?: string }).value;
        return value ?? null;
      }
      return null;
    })
    .filter((option): option is string => !!option);
};

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const tenantId = getTenantId();
  const { id } = await params;

  const { data: template, error: templateError } = await supabaseAdmin
    .from("templates")
    .select(
      "id, name, description, type, standard, is_default, usage_count, updated_at, template_sections(id, template_id, name, description, sort_order, template_items(id, section_id, name, description, item_type, options, is_required, sort_order))"
    )
    .eq("tenant_id", tenantId)
    .eq("id", id)
    .single();

  if (templateError || !template) {
    return NextResponse.json({ error: templateError?.message ?? "Template not found." }, { status: 404 });
  }

  const { data: services } = await supabaseAdmin
    .from("services")
    .select("id, name, price, category")
    .eq("tenant_id", tenantId)
    .eq("template_id", id)
    .order("name");

  const sections = (template.template_sections ?? [])
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((section) => {
      const items = (section.template_items ?? [])
        .sort((a, b) => a.sort_order - b.sort_order)
        .map<TemplateItem>((item) => ({
          id: item.id,
          sectionId: item.section_id,
          name: item.name,
          description: item.description ?? undefined,
          itemType: item.item_type,
          options: normalizeOptions(item.options),
          isRequired: item.is_required ?? false,
          sortOrder: item.sort_order ?? 0,
        }));

      return {
        id: section.id,
        templateId: section.template_id,
        name: section.name,
        description: section.description ?? undefined,
        sortOrder: section.sort_order ?? 0,
        items,
      } as TemplateSection;
    });

  return NextResponse.json({
    id: template.id,
    name: template.name,
    description: template.description ?? undefined,
    type: template.type ?? "inspection",
    standard: template.standard ?? "Custom",
    isDefault: template.is_default ?? false,
    usageCount: template.usage_count ?? 0,
    lastModified: new Date(template.updated_at).toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    }),
    serviceId: services?.[0]?.id ?? null,
    serviceName: services?.[0]?.name ?? null,
    serviceIds: (services ?? []).map((service) => service.id),
    serviceNames: (services ?? []).map((service) => service.name),
    basePrice: services?.[0]?.price ?? null,
    isAddon: services?.[0]?.category === "addon",
    sections,
  });
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const tenantId = getTenantId();
  const { id } = await params;
  const validation = await validateRequestBody(request, updateTemplateSchema);
  if (validation.error) {
    return validation.error;
  }
  const payload = validation.data;
  const sections = Array.isArray(payload.sections) ? payload.sections : [];

  const { data: updatedTemplate, error: templateError } = await supabaseAdmin
    .from("templates")
    .update({
      name: payload.name,
      description: payload.description ?? null,
      type: payload.type ?? "inspection",
      standard: payload.standard ?? "Custom",
      is_active: payload.isActive ?? true,
      is_default: payload.isDefault ?? false,
      usage_count: payload.usageCount ?? 0,
    })
    .eq("tenant_id", tenantId)
    .eq("id", id)
    .select("*")
    .single();

  if (templateError || !updatedTemplate) {
    return NextResponse.json({ error: templateError?.message ?? "Failed to update template." }, { status: 500 });
  }

  await supabaseAdmin.from("template_sections").delete().eq("template_id", id);

  const sectionPayloads = sections.map((section, index: number) => ({
    template_id: id,
    name: section.name,
    description: section.description ?? null,
    sort_order: index + 1,
  }));

  const { data: insertedSections, error: sectionError } = await supabaseAdmin
    .from("template_sections")
    .insert(sectionPayloads)
    .select("id, sort_order");

  if (sectionError || !insertedSections) {
    return NextResponse.json({ error: sectionError?.message ?? "Failed to save sections." }, { status: 500 });
  }

  const itemPayloads: {
    section_id: string;
    name: string;
    description: string | null;
    item_type: string;
    options: string[] | null;
    is_required: boolean;
    sort_order: number;
  }[] = [];

  insertedSections.forEach((sectionRow, index) => {
    const sectionItems = sections[index]?.items ?? [];
    sectionItems.forEach((item, itemIndex: number) => {
      itemPayloads.push({
        section_id: sectionRow.id,
        name: item.name,
        description: item.description ?? null,
        item_type: item.itemType,
        options: item.options ?? null,
        is_required: item.isRequired ?? false,
        sort_order: itemIndex + 1,
      });
    });
  });

  if (itemPayloads.length > 0) {
    const { error: itemError } = await supabaseAdmin.from("template_items").insert(itemPayloads);
    if (itemError) {
      return NextResponse.json({ error: itemError.message }, { status: 500 });
    }
  }

  if (payload.serviceIds !== undefined || payload.serviceId !== undefined) {
    const nextServiceIds = Array.isArray(payload.serviceIds)
      ? payload.serviceIds
      : payload.serviceId
      ? [payload.serviceId]
      : [];

    const { data: existingLinks } = await supabaseAdmin
      .from("services")
      .select("id")
      .eq("tenant_id", tenantId)
      .eq("template_id", id);

    const existingIds = (existingLinks ?? []).map((service) => service.id);
    const idsToRemove = existingIds.filter((serviceId: string) => !nextServiceIds.includes(serviceId));
    const idsToAdd = nextServiceIds.filter((serviceId: string) => !existingIds.includes(serviceId));

    if (idsToRemove.length > 0) {
      await supabaseAdmin
        .from("services")
        .update({ template_id: null })
        .eq("tenant_id", tenantId)
        .in("id", idsToRemove);
    }

    if (idsToAdd.length > 0) {
      await supabaseAdmin
        .from("services")
        .update({ template_id: id })
        .eq("tenant_id", tenantId)
        .in("id", idsToAdd);
    }
  }

  return NextResponse.json({ success: true });
}
