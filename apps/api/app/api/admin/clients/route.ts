import { NextRequest } from 'next/server';
import {
  createUserClient,
  createServiceClient,
  getAccessToken,
  getUserFromToken,
  unauthorized,
  badRequest,
  serverError,
  success,
  validationError
} from '@/lib/supabase';
import { resolveTenant } from '@/lib/tenants';
import { createClientSchema } from '@/lib/validations/client';
import { triggerWebhookEvent } from '@/lib/webhooks/delivery';
import { buildClientPayload } from '@/lib/webhooks/payloads';

/**
 * GET /api/admin/clients
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

    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('*')
      .eq('tenant_id', tenant.id)
      .order('created_at', { ascending: false });

    if (clientsError) {
      return serverError('Failed to fetch clients', clientsError);
    }

    const { data: jobs, error: jobsError } = await supabase
      .from('jobs')
      .select('id, client_id, scheduled_date')
      .eq('tenant_id', tenant.id);

    if (jobsError) {
      return serverError('Failed to fetch client jobs', jobsError);
    }

    const jobStats = new Map<string, { inspections: number; lastInspection: string }>();
    (jobs || []).forEach((job) => {
      if (!job.client_id) return;
      const current = jobStats.get(job.client_id) || { inspections: 0, lastInspection: '' };
      const nextCount = current.inspections + 1;
      const lastInspection = current.lastInspection && current.lastInspection > job.scheduled_date
        ? current.lastInspection
        : job.scheduled_date;
      jobStats.set(job.client_id, { inspections: nextCount, lastInspection });
    });

    const payload = (clients || []).map((client) => {
      const stats = jobStats.get(client.id) || { inspections: 0, lastInspection: '' };
      return {
        clientId: client.id,
        name: client.name,
        email: client.email || '',
        phone: client.phone || '',
        type: client.type || (client.company ? 'Agent' : 'Homebuyer'),
        company: client.company || '',
        notes: client.notes || '',
        inspections: stats.inspections,
        lastInspection: stats.lastInspection || '—',
        totalSpent: 0,
        createdAt: client.created_at,
        updatedAt: client.updated_at,
      };
    });

    return success(payload);
  } catch (error) {
    return serverError('Failed to fetch clients', error);
  }
}

/**
 * POST /api/admin/clients
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
    const validation = createClientSchema.safeParse(body);
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

    const { data: client, error } = await supabase
      .from('clients')
      .insert({
        tenant_id: tenant.id,
        name: payload.name,
        email: payload.email ?? null,
        phone: payload.phone ?? null,
        type: payload.type ?? null,
        company: payload.company ?? null,
        notes: payload.notes ?? null,
      })
      .select('*')
      .single();

    if (error || !client) {
      return serverError('Failed to create client', error);
    }

    // Trigger webhook for client.created event
    try {
      triggerWebhookEvent("client.created", tenant.id, buildClientPayload(client));
    } catch (webhookError) {
      console.error("Failed to trigger webhook:", webhookError);
    }

    return success({
      clientId: client.id,
      name: client.name,
      email: client.email || '',
      phone: client.phone || '',
      type: client.type || (client.company ? 'Agent' : 'Homebuyer'),
      company: client.company || '',
      notes: client.notes || '',
      inspections: 0,
      lastInspection: '—',
      totalSpent: 0,
      createdAt: client.created_at,
      updatedAt: client.updated_at,
    });
  } catch (error) {
    return serverError('Failed to create client', error);
  }
}
