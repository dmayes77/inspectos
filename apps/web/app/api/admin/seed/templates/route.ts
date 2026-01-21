import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getTenantId } from "@/lib/supabase/admin-helpers";
import { templates as mockTemplates } from "@/lib/mock/templates";
import { services as mockServices } from "@/lib/mock/services";

const normalizeOptions = (options: unknown): string[] | null => {
  if (!options) return null;
  if (Array.isArray(options)) {
    return options.filter((option): option is string => typeof option === "string");
  }
  if (typeof options === "string") {
    try {
      const parsed = JSON.parse(options);
      if (Array.isArray(parsed)) {
        return parsed.filter((option): option is string => typeof option === "string");
      }
    } catch {
      return [options];
    }
  }
  return null;
};

export async function POST() {
  const tenantId = getTenantId();

  const { data: existingTemplates, error: existingError } = await supabaseAdmin
    .from("templates")
    .select("id, name")
    .eq("tenant_id", tenantId)
    .eq("is_active", true);

  if (existingError) {
    return NextResponse.json({ error: existingError.message }, { status: 500 });
  }

  const existingTemplateMap = new Map(
    (existingTemplates ?? []).map((template) => [template.name.toLowerCase(), template.id])
  );

  const templateIdMap = new Map<string, string>();
  let createdTemplates = 0;

  for (const template of mockTemplates) {
    const existingId = existingTemplateMap.get(template.name.toLowerCase());
    if (existingId) {
      templateIdMap.set(template.id, existingId);
      continue;
    }

    const { data: createdTemplate, error: templateError } = await supabaseAdmin
      .from("templates")
      .insert({
        tenant_id: tenantId,
        name: template.name,
        description: template.description ?? null,
        type: template.type ?? "inspection",
        standard: template.standard ?? "Custom",
        is_default: template.isDefault ?? false,
        usage_count: template.usageCount ?? 0,
        is_active: true,
      })
      .select("id")
      .single();

    if (templateError || !createdTemplate) {
      return NextResponse.json({ error: templateError?.message ?? "Failed to seed templates." }, { status: 500 });
    }

    templateIdMap.set(template.id, createdTemplate.id);
    createdTemplates += 1;

    for (const section of template.sections) {
      const { data: createdSection, error: sectionError } = await supabaseAdmin
        .from("template_sections")
        .insert({
          template_id: createdTemplate.id,
          name: section.name,
          description: section.description ?? null,
          sort_order: section.sortOrder ?? 0,
        })
        .select("id")
        .single();

      if (sectionError || !createdSection) {
        return NextResponse.json({ error: sectionError?.message ?? "Failed to seed sections." }, { status: 500 });
      }

      if (section.items.length > 0) {
        const itemPayloads = section.items.map((item) => ({
          section_id: createdSection.id,
          name: item.name,
          description: item.description ?? null,
          item_type: item.itemType,
          options: normalizeOptions(item.options),
          is_required: item.isRequired ?? false,
          sort_order: item.sortOrder ?? 0,
        }));

        const { error: itemError } = await supabaseAdmin.from("template_items").insert(itemPayloads);
        if (itemError) {
          return NextResponse.json({ error: itemError.message }, { status: 500 });
        }
      }
    }
  }

  const { data: existingServices, error: existingServicesError } = await supabaseAdmin
    .from("services")
    .select("id, name, template_id")
    .eq("tenant_id", tenantId)
    .eq("is_active", true);

  if (existingServicesError) {
    return NextResponse.json({ error: existingServicesError.message }, { status: 500 });
  }

  const existingServiceMap = new Map(
    (existingServices ?? []).map((service) => [service.name.toLowerCase(), service])
  );

  const servicePayloads = mockServices
    .filter((service) => !existingServiceMap.has(service.name.toLowerCase()))
    .map((service) => ({
      tenant_id: tenantId,
      name: service.name,
      description: service.description ?? null,
      category: service.category ?? "core",
      price: service.price ?? null,
      duration_minutes: service.durationMinutes ?? null,
      template_id: service.templateId ? templateIdMap.get(service.templateId) ?? null : null,
      is_active: service.status !== "inactive",
    }));

  let createdServices = 0;
  if (servicePayloads.length > 0) {
    const { error: serviceError } = await supabaseAdmin.from("services").insert(servicePayloads);
    if (serviceError) {
      return NextResponse.json({ error: serviceError.message }, { status: 500 });
    }
    createdServices = servicePayloads.length;
  }

  for (const service of mockServices) {
    const existing = existingServiceMap.get(service.name.toLowerCase());
    const templateId = service.templateId ? templateIdMap.get(service.templateId) ?? null : null;
    if (existing && templateId && !existing.template_id) {
      await supabaseAdmin
        .from("services")
        .update({ template_id: templateId })
        .eq("tenant_id", tenantId)
        .eq("id", existing.id);
    }
  }

  return NextResponse.json({
    message: "Seeded missing templates and services.",
    templatesCreated: createdTemplates,
    servicesCreated: createdServices,
  });
}
