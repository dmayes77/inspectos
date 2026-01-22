import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getTenantId } from "@/lib/supabase/admin-helpers";
import type { Template, TemplateSection, TemplateItem } from "@/types/template";
import { validateRequestBody } from "@/lib/api/validate";
import { createTemplateStubSchema } from "@/lib/validations/template";

type TemplateRow = {
  id: string;
  name: string;
  description: string | null;
  type: "inspection" | "agreement" | "report" | null;
  standard: string | null;
  is_active: boolean | null;
  is_default: boolean | null;
  usage_count: number | null;
  updated_at: string;
};

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

const mapTemplate = (
  row: TemplateRow,
  sections: TemplateSection[],
  serviceLinks: { id: string; name: string; price: number | null; category: "core" | "addon" }[]
): Template => ({
  id: row.id,
  name: row.name,
  description: row.description ?? undefined,
  type: row.type ?? "inspection",
  standard: row.standard ?? "Custom",
  isActive: row.is_active ?? true,
  isDefault: row.is_default ?? false,
  usageCount: row.usage_count ?? 0,
  lastModified: new Date(row.updated_at).toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  }),
  serviceId: serviceLinks[0]?.id ?? null,
  serviceName: serviceLinks[0]?.name ?? null,
  serviceIds: serviceLinks.map((service) => service.id),
  serviceNames: serviceLinks.map((service) => service.name),
  basePrice: serviceLinks[0]?.price ?? null,
  isAddon: serviceLinks[0]?.category === "addon",
  sections,
});

export async function GET() {
  const tenantId = getTenantId();

  const { data: templateRows, error: templateError } = await supabaseAdmin
    .from("templates")
    .select(
      "id, name, description, type, standard, is_active, is_default, usage_count, updated_at, template_sections(id, template_id, name, description, sort_order, template_items(id, section_id, name, description, item_type, options, is_required, sort_order))"
    )
    .eq("tenant_id", tenantId)
    .eq("is_active", true);

  if (templateError) {
    return NextResponse.json({ error: templateError.message }, { status: 500 });
  }

  const { data: services, error: servicesError } = await supabaseAdmin
    .from("services")
    .select("id, name, price, category, template_id")
    .eq("tenant_id", tenantId)
    .eq("is_active", true);

  if (servicesError) {
    return NextResponse.json({ error: servicesError.message }, { status: 500 });
  }

  const serviceByTemplateId = new Map<
    string,
    { id: string; name: string; price: number | null; category: "core" | "addon" }[]
  >();
  (services ?? []).forEach((service) => {
    if (service.template_id) {
      const list = serviceByTemplateId.get(service.template_id) ?? [];
      list.push({
        id: service.id,
        name: service.name,
        price: service.price,
        category: service.category,
      });
      serviceByTemplateId.set(service.template_id, list);
    }
  });

  const templates = (templateRows ?? []).map((row) => {
    const sections = (row.template_sections ?? [])
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

    return mapTemplate(row as TemplateRow, sections, serviceByTemplateId.get(row.id) ?? []);
  });

  return NextResponse.json(templates);
}

export async function POST(request: Request) {
  const tenantId = getTenantId();
  const validation = await validateRequestBody(request, createTemplateStubSchema);
  if (validation.error) {
    return validation.error;
  }
  const payload = validation.data;
  const action = payload.action ?? "create_stub";

  if (action !== "create_stub") {
    return NextResponse.json({ error: "Unsupported action." }, { status: 400 });
  }

  const { data: template, error: templateError } = await supabaseAdmin
    .from("templates")
    .insert({
      tenant_id: tenantId,
      name: payload.name ?? "New Template",
      description: payload.description ?? "Auto-created template stub",
      type: "inspection",
      standard: "Custom",
      is_default: false,
      usage_count: 0,
      is_active: true,
    })
    .select("*")
    .single();

  if (templateError || !template) {
    return NextResponse.json({ error: templateError?.message ?? "Failed to create template." }, { status: 500 });
  }

  const { data: section, error: sectionError } = await supabaseAdmin
    .from("template_sections")
    .insert({
      template_id: template.id,
      name: "Overview",
      description: "Auto-generated section",
      sort_order: 1,
    })
    .select("*")
    .single();

  if (sectionError || !section) {
    return NextResponse.json({ error: sectionError?.message ?? "Failed to create template section." }, { status: 500 });
  }

  const { data: item, error: itemError } = await supabaseAdmin
    .from("template_items")
    .insert({
      section_id: section.id,
      name: "General notes",
      item_type: "text",
      sort_order: 1,
      is_required: false,
    })
    .select("*")
    .single();

  if (itemError || !item) {
    return NextResponse.json({ error: itemError?.message ?? "Failed to create template item." }, { status: 500 });
  }

  const mappedTemplate = mapTemplate(template as TemplateRow, [
    {
      id: section.id,
      templateId: template.id,
      name: section.name,
      description: section.description ?? undefined,
      sortOrder: section.sort_order ?? 0,
      items: [
        {
          id: item.id,
          sectionId: section.id,
          name: item.name,
          description: item.description ?? undefined,
          itemType: item.item_type,
          options: normalizeOptions(item.options),
          isRequired: item.is_required ?? false,
          sortOrder: item.sort_order ?? 0,
        },
      ],
    },
  ], []);

  return NextResponse.json(mappedTemplate);
}
