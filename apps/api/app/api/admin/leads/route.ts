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
      .select('*')
      .eq('tenant_id', tenant.id)
      .order('created_at', { ascending: false });

    if (error) {
      return serverError('Failed to fetch leads', error);
    }

    const payload = (leads || []).map((lead) => ({
      leadId: lead.id,
      name: lead.name,
      email: lead.email || '',
      phone: lead.phone || '',
      stage: lead.stage,
      source: lead.source || '',
      notes: lead.notes || '',
      serviceName: '',
      requestedDate: '',
      estimatedValue: 0
    }));

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
    const { tenant_slug, name, email, phone, stage, source, notes } = body;
    if (!name) {
      return badRequest('Missing required field: name');
    }

    const supabase = createUserClient(accessToken);
    const { tenant, error: tenantError } = await resolveTenant(supabase, user.userId, tenant_slug);
    if (tenantError || !tenant) {
      return badRequest('Tenant not found');
    }

    const { data: lead, error } = await supabase
      .from('leads')
      .insert({
        tenant_id: tenant.id,
        name,
        email: email || null,
        phone: phone || null,
        stage: stage || 'new',
        source: source || null,
        notes: notes || null
      })
      .select('*')
      .single();

    if (error || !lead) {
      return serverError('Failed to create lead', error);
    }

    return success({
      leadId: lead.id,
      name: lead.name,
      email: lead.email || '',
      phone: lead.phone || '',
      stage: lead.stage,
      source: lead.source || '',
      notes: lead.notes || '',
      serviceName: '',
      requestedDate: '',
      estimatedValue: 0
    });
  } catch (error) {
    return serverError('Failed to create lead', error);
  }
}
