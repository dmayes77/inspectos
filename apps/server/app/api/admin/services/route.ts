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
import { createServiceSchema } from '@/lib/validations/service';
import { triggerWebhookEvent } from '@/lib/webhooks/delivery';
import { buildServicePayload } from '@/lib/webhooks/payloads';

/**
 * GET /api/admin/services
 *
 * Query params:
 * - tenant: tenant slug (optional; defaults to user's first tenant)
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

    const { data: services, error } = await supabase
      .from('services')
      .select('*')
      .eq('tenant_id', tenant.id)
      .order('category')
      .order('name');

    if (error) {
      return serverError('Failed to fetch services', error);
    }

    const payload = (services || []).map((service) => ({
      serviceId: service.id,
      name: service.name,
      price: service.price ?? undefined,
      durationMinutes: service.duration_minutes ?? undefined,
      templateId: service.template_id ?? null,
      description: service.description ?? undefined,
      category: service.category ?? undefined,
      status: service.is_active ? 'active' : 'inactive'
    }));

    return success(payload);
  } catch (error) {
    return serverError('Failed to fetch services', error);
  }
}

/**
 * POST /api/admin/services
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
    const validation = createServiceSchema.safeParse(body);
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

    const { data: service, error } = await supabase
      .from('services')
      .insert({
        tenant_id: tenant.id,
        name: payload.name,
        description: payload.description ?? null,
        category: payload.category ?? 'core',
        price: payload.price ?? null,
        duration_minutes: payload.durationMinutes ?? null,
        template_id: payload.templateId ?? null,
        is_active: true
      })
      .select('*')
      .single();

    if (error || !service) {
      return serverError('Failed to create service', error);
    }

    // Trigger webhook for service.created event
    try {
      triggerWebhookEvent("service.created", tenant.id, buildServicePayload(service));
    } catch (webhookError) {
      console.error("Failed to trigger webhook:", webhookError);
    }

    return success({
      serviceId: service.id,
      name: service.name,
      price: service.price ?? undefined,
      durationMinutes: service.duration_minutes ?? undefined,
      templateId: service.template_id ?? null,
      description: service.description ?? undefined,
      category: service.category ?? undefined,
      status: service.is_active ? 'active' : 'inactive'
    });
  } catch (error) {
    return serverError('Failed to create service', error);
  }
}
