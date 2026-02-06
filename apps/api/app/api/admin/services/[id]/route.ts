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
import { updateServiceSchema } from '@/lib/validations/service';
import { triggerWebhookEvent } from '@/lib/webhooks/delivery';
import { buildServicePayload } from '@/lib/webhooks/payloads';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/admin/services/[id]
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

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

    const { data: service, error } = await supabase
      .from('services')
      .select('*')
      .eq('tenant_id', tenant.id)
      .eq('id', id)
      .single();

    if (error || !service) {
      return serverError('Service not found', error);
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
    return serverError('Failed to fetch service', error);
  }
}

/**
 * PUT /api/admin/services/[id]
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

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
    const validation = updateServiceSchema.safeParse(body);
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

    // Build update data
    const updateData: Record<string, unknown> = {};
    if (payload.name !== undefined) updateData.name = payload.name;
    if (payload.description !== undefined) updateData.description = payload.description;
    if (payload.price !== undefined) updateData.price = payload.price;
    if (payload.durationMinutes !== undefined) updateData.duration_minutes = payload.durationMinutes;
    if (payload.category !== undefined) updateData.category = payload.category;
    if (payload.templateId !== undefined) updateData.template_id = payload.templateId;

    const { data: service, error } = await supabase
      .from('services')
      .update(updateData)
      .eq('tenant_id', tenant.id)
      .eq('id', id)
      .select('*')
      .single();

    if (error || !service) {
      return serverError('Failed to update service', error);
    }

    // Trigger webhook for service.updated event
    try {
      triggerWebhookEvent("service.updated", tenant.id, buildServicePayload(service));
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
    return serverError('Failed to update service', error);
  }
}

/**
 * DELETE /api/admin/services/[id]
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

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

    // Soft delete by setting is_active to false
    const { error } = await supabase
      .from('services')
      .update({ is_active: false })
      .eq('tenant_id', tenant.id)
      .eq('id', id);

    if (error) {
      return serverError('Failed to delete service', error);
    }

    return success({ deleted: true });
  } catch (error) {
    return serverError('Failed to delete service', error);
  }
}
