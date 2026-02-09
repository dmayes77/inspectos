import { NextRequest } from 'next/server';
import {
  createUserClient,
  getAccessToken,
  getUserFromToken,
  unauthorized,
  badRequest,
  serverError,
  success,
  validationError,
  notFound
} from '@/lib/supabase';
import { resolveTenant } from '@/lib/tenants';
import { updateLeadSchema } from '@inspectos/shared/validations/lead';

const normalizeStage = (stage?: string | null) => {
  if (!stage) return "new";
  return stage.toLowerCase().replace(/\s+/g, "_");
};

const mapLead = (lead: {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  stage: string;
  source: string | null;
  notes: string | null;
  service_name?: string | null;
  requested_date?: string | null;
  estimated_value?: number | null;
}) => ({
  leadId: lead.id,
  name: lead.name,
  email: lead.email ?? "",
  phone: lead.phone ?? "",
  stage: lead.stage,
  source: lead.source ?? "",
  notes: lead.notes ?? "",
  serviceName: lead.service_name ?? "",
  requestedDate: lead.requested_date ?? "",
  estimatedValue: Number(lead.estimated_value ?? 0),
});

/**
 * GET /api/admin/leads/[id]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const accessToken = getAccessToken(request);
    if (!accessToken) {
      return unauthorized('Missing access token');
    }

    const user = getUserFromToken(accessToken);
    if (!user) {
      return unauthorized('Invalid access token');
    }

    const { id } = await params;
    const tenantSlug = request.nextUrl.searchParams.get('tenant');
    const supabase = createUserClient(accessToken);
    const { tenant, error: tenantError } = await resolveTenant(supabase, user.userId, tenantSlug);
    if (tenantError || !tenant) {
      return badRequest('Tenant not found');
    }

    const { data: lead, error } = await supabase
      .from('leads')
      .select('id, name, email, phone, stage, source, notes, service_name, requested_date, estimated_value')
      .eq('tenant_id', tenant.id)
      .eq('id', id)
      .single();

    if (error || !lead) {
      return notFound('Lead not found');
    }

    return success(mapLead(lead));
  } catch (error) {
    return serverError('Failed to fetch lead', error);
  }
}

/**
 * PUT /api/admin/leads/[id]
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const accessToken = getAccessToken(request);
    if (!accessToken) {
      return unauthorized('Missing access token');
    }

    const user = getUserFromToken(accessToken);
    if (!user) {
      return unauthorized('Invalid access token');
    }

    const { id } = await params;
    const body = await request.json();

    // Validate request body
    const validation = updateLeadSchema.safeParse(body);
    if (!validation.success) {
      return validationError(validation.error.issues[0]?.message || 'Validation failed');
    }
    const payload = validation.data;

    const tenantSlug = body.tenant_slug || request.nextUrl.searchParams.get('tenant');
    const supabase = createUserClient(accessToken);
    const { tenant, error: tenantError } = await resolveTenant(supabase, user.userId, tenantSlug);
    if (tenantError || !tenant) {
      return badRequest('Tenant not found');
    }

    // TODO: Add workflow trigger on status change (like web version)
    // const { data: existing } = await supabase.from('leads').select('stage').eq('tenant_id', tenant.id).eq('id', id).maybeSingle();

    const { data: lead, error } = await supabase
      .from('leads')
      .update({
        name: payload.name,
        email: payload.email ?? null,
        phone: payload.phone ?? null,
        stage: normalizeStage(payload.stage),
        source: payload.source ?? null,
        notes: payload.notes ?? null,
        service_name: payload.serviceName ?? null,
        requested_date: payload.requestedDate || null,
        estimated_value: payload.estimatedValue ?? null,
      })
      .eq('tenant_id', tenant.id)
      .eq('id', id)
      .select('id, name, email, phone, stage, source, notes, service_name, requested_date, estimated_value')
      .single();

    if (error || !lead) {
      return serverError('Failed to update lead', error);
    }

    return success(mapLead(lead));
  } catch (error) {
    return serverError('Failed to update lead', error);
  }
}

/**
 * DELETE /api/admin/leads/[id]
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const accessToken = getAccessToken(request);
    if (!accessToken) {
      return unauthorized('Missing access token');
    }

    const user = getUserFromToken(accessToken);
    if (!user) {
      return unauthorized('Invalid access token');
    }

    const { id } = await params;
    const tenantSlug = request.nextUrl.searchParams.get('tenant');
    const supabase = createUserClient(accessToken);
    const { tenant, error: tenantError } = await resolveTenant(supabase, user.userId, tenantSlug);
    if (tenantError || !tenant) {
      return badRequest('Tenant not found');
    }

    const { error } = await supabase
      .from('leads')
      .delete()
      .eq('tenant_id', tenant.id)
      .eq('id', id);

    if (error) {
      return serverError('Failed to delete lead', error);
    }

    return success({ deleted: true });
  } catch (error) {
    return serverError('Failed to delete lead', error);
  }
}
