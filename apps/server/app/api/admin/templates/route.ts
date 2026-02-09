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

type TemplateRow = {
  id: string;
  name: string;
  description: string | null;
  type: 'inspection' | 'agreement' | 'report' | null;
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
      if (typeof option === 'string') return option;
      if (option && typeof option === 'object') {
        const value = (option as { label?: string; value?: string }).label ?? (option as { value?: string }).value;
        return value ?? null;
      }
      return null;
    })
    .filter((option): option is string => !!option);
};

const mapTemplate = (row: TemplateRow, sections: Record<string, unknown>[], serviceLinks: Record<string, unknown>[]) => ({
  id: row.id,
  name: row.name,
  description: row.description ?? undefined,
  type: row.type ?? 'inspection',
  standard: row.standard ?? 'Custom',
  isActive: row.is_active ?? true,
  isDefault: row.is_default ?? false,
  usageCount: row.usage_count ?? 0,
  lastModified: new Date(row.updated_at).toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  }),
  serviceId: serviceLinks[0]?.id ?? null,
  serviceName: serviceLinks[0]?.name ?? null,
  serviceIds: serviceLinks.map((service: Record<string, unknown>) => service.id),
  serviceNames: serviceLinks.map((service: Record<string, unknown>) => service.name),
  basePrice: serviceLinks[0]?.price ?? null,
  isAddon: serviceLinks[0]?.category === 'addon',
  sections,
});

/**
 * GET /api/admin/templates
 */
export async function GET(request: NextRequest) {
  try {
    const accessToken = getAccessToken(request);
    if (!accessToken) {
      return unauthorized('Missing access token');
    }

    const user = getUserFromToken(accessToken);
    if (!user) {
      return unauthorized('Invalid access token');
    }

    const tenantSlug = request.nextUrl.searchParams.get('tenant');
    const supabase = createUserClient(accessToken);
    const { tenant, error: tenantError } = await resolveTenant(supabase, user.userId, tenantSlug);
    if (tenantError || !tenant) {
      return badRequest('Tenant not found');
    }

    const { data: templateRows, error: templateError } = await supabase
      .from('templates')
      .select(
        'id, name, description, type, standard, is_active, is_default, usage_count, updated_at, template_sections(id, template_id, name, description, sort_order, template_items(id, section_id, name, description, item_type, options, is_required, sort_order))'
      )
      .eq('tenant_id', tenant.id)
      .eq('is_active', true);

    if (templateError) {
      return serverError('Failed to fetch templates', templateError);
    }

    const { data: services, error: servicesError } = await supabase
      .from('services')
      .select('id, name, price, category, template_id')
      .eq('tenant_id', tenant.id)
      .eq('is_active', true);

    if (servicesError) {
      return serverError('Failed to fetch services', servicesError);
    }

    const serviceByTemplateId = new Map<string, Record<string, unknown>[]>();
    (services ?? []).forEach((service: Record<string, unknown>) => {
      if (service.template_id) {
        const list = serviceByTemplateId.get(service.template_id as string) ?? [];
        list.push({
          id: service.id,
          name: service.name,
          price: service.price,
          category: service.category,
        });
        serviceByTemplateId.set(service.template_id as string, list);
      }
    });

    const templates = (templateRows ?? []).map((row: Record<string, unknown>) => {
      const sections = ((row.template_sections as Record<string, unknown>[]) ?? [])
        .sort((a: Record<string, unknown>, b: Record<string, unknown>) => (a.sort_order as number) - (b.sort_order as number))
        .map((section: Record<string, unknown>) => {
          const items = ((section.template_items as Record<string, unknown>[]) ?? [])
            .sort((a: Record<string, unknown>, b: Record<string, unknown>) => (a.sort_order as number) - (b.sort_order as number))
            .map((item: Record<string, unknown>) => ({
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
          };
        });

      return mapTemplate(row as TemplateRow, sections, serviceByTemplateId.get(row.id as string) ?? []);
    });

    return success(templates);
  } catch (error) {
    return serverError('Failed to fetch templates', error);
  }
}

/**
 * POST /api/admin/templates
 */
export async function POST(request: NextRequest) {
  try {
    const accessToken = getAccessToken(request);
    if (!accessToken) {
      return unauthorized('Missing access token');
    }

    const user = getUserFromToken(accessToken);
    if (!user) {
      return unauthorized('Invalid access token');
    }

    const body = await request.json();
    const { name, description, action, tenant_slug } = body;

    if (action && action !== 'create_stub') {
      return badRequest('Unsupported action');
    }

    const tenantSlug = tenant_slug || request.nextUrl.searchParams.get('tenant');
    const supabase = createUserClient(accessToken);
    const { tenant, error: tenantError } = await resolveTenant(supabase, user.userId, tenantSlug);
    if (tenantError || !tenant) {
      return badRequest('Tenant not found');
    }

    const { data: template, error: templateError } = await supabase
      .from('templates')
      .insert({
        tenant_id: tenant.id,
        name: name ?? 'New Template',
        description: description ?? 'Auto-created template stub',
        type: 'inspection',
        standard: 'Custom',
        is_default: false,
        usage_count: 0,
        is_active: true,
      })
      .select('*')
      .single();

    if (templateError || !template) {
      return serverError('Failed to create template', templateError);
    }

    const { data: section, error: sectionError } = await supabase
      .from('template_sections')
      .insert({
        template_id: template.id,
        name: 'Overview',
        description: 'Auto-generated section',
        sort_order: 1,
      })
      .select('*')
      .single();

    if (sectionError || !section) {
      return serverError('Failed to create template section', sectionError);
    }

    const { data: item, error: itemError } = await supabase
      .from('template_items')
      .insert({
        section_id: section.id,
        name: 'General notes',
        item_type: 'text',
        sort_order: 1,
        is_required: false,
      })
      .select('*')
      .single();

    if (itemError || !item) {
      return serverError('Failed to create template item', itemError);
    }

    const mappedTemplate = mapTemplate(
      template as TemplateRow,
      [
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
      ],
      []
    );

    return success(mappedTemplate);
  } catch (error) {
    return serverError('Failed to create template', error);
  }
}
