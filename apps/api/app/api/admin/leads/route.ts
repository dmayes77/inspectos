import { NextRequest } from 'next/server';
import {
  createUserClient,
  getAccessToken,
  getUserFromToken,
  unauthorized,
  badRequest,
  serverError,
  success,
  validationError
} from '@/lib/supabase';
import { resolveTenant } from '@/lib/tenants';
import { createLeadSchema } from '@/lib/validations/lead';

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
 * GET /api/admin/leads
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

    const { data: leads, error } = await supabase
      .from('leads')
      .select('id, name, email, phone, stage, source, notes, service_name, requested_date, estimated_value')
      .eq('tenant_id', tenant.id)
      .order('created_at', { ascending: false });

    if (error) {
      return serverError('Failed to fetch leads', error);
    }

    const payload = (leads || []).map(mapLead);

    return success(payload);
  } catch (error) {
    return serverError('Failed to fetch leads', error);
  }
}

/**
 * POST /api/admin/leads
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

    // Validate request body
    const validation = createLeadSchema.safeParse(body);
    if (!validation.success) {
      return validationError(validation.error.errors[0]?.message || 'Validation failed');
    }
    const payload = validation.data;

    const tenantSlug = body.tenant_slug || request.nextUrl.searchParams.get('tenant');
    const supabase = createUserClient(accessToken);
    const { tenant, error: tenantError } = await resolveTenant(supabase, user.userId, tenantSlug);
    if (tenantError || !tenant) {
      return badRequest('Tenant not found');
    }

    const { data: lead, error } = await supabase
      .from('leads')
      .insert({
        tenant_id: tenant.id,
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
      .select('id, name, email, phone, stage, source, notes, service_name, requested_date, estimated_value')
      .single();

    if (error || !lead) {
      return serverError('Failed to create lead', error);
    }

    return success(mapLead(lead));
  } catch (error) {
    return serverError('Failed to create lead', error);
  }
}
