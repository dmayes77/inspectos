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
import { updateClientSchema } from '@/lib/validations/client';
import { triggerWebhookEvent } from '@/lib/webhooks/delivery';
import { buildClientPayload } from '@/lib/webhooks/payloads';

const mapClient = (client: Record<string, unknown>) => ({
  clientId: client.id,
  name: client.name,
  email: client.email || '',
  phone: client.phone || '',
  type: client.type || 'Homebuyer',
  company: client.company || '',
  notes: client.notes || '',
  inspections: client.inspections_count || 0,
  lastInspection: client.last_inspection_date || '—',
  totalSpent: Number(client.total_spent || 0),
  createdAt: client.created_at,
  updatedAt: client.updated_at,
});

/**
 * GET /api/admin/clients/[id]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const accessToken = getAccessToken(request);
    if (!accessToken) return unauthorized('Missing access token');

    const user = getUserFromToken(accessToken);
    if (!user) return unauthorized('Invalid access token');

    const { id } = await params;
    const tenantSlug = request.nextUrl.searchParams.get('tenant');
    const supabase = createUserClient(accessToken);
    const { tenant, error: tenantError } = await resolveTenant(supabase, user.userId, tenantSlug);
    if (tenantError || !tenant) return badRequest('Tenant not found');

    const { data: client, error } = await supabase
      .from('clients')
      .select('*')
      .eq('tenant_id', tenant.id)
      .eq('id', id)
      .single();

    if (error || !client) return notFound('Client not found');

    return success(mapClient(client));
  } catch (error) {
    return serverError('Failed to fetch client', error);
  }
}

/**
 * PUT /api/admin/clients/[id]
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const accessToken = getAccessToken(request);
    if (!accessToken) return unauthorized('Missing access token');

    const user = getUserFromToken(accessToken);
    if (!user) return unauthorized('Invalid access token');

    const { id } = await params;
    const body = await request.json();

    const validation = updateClientSchema.safeParse(body);
    if (!validation.success) {
      return validationError(validation.error.errors[0]?.message || 'Validation failed');
    }
    const payload = validation.data;

    const tenantSlug = body.tenant_slug || request.nextUrl.searchParams.get('tenant');
    const supabase = createUserClient(accessToken);
    const { tenant, error: tenantError } = await resolveTenant(supabase, user.userId, tenantSlug);
    if (tenantError || !tenant) return badRequest('Tenant not found');

    const updateData: Record<string, unknown> = {};
    if (payload.name !== undefined) updateData.name = payload.name;
    if (payload.email !== undefined) updateData.email = payload.email;
    if (payload.phone !== undefined) updateData.phone = payload.phone;
    if (payload.type !== undefined) updateData.type = payload.type;
    if (payload.company !== undefined) updateData.company = payload.company;
    if (payload.notes !== undefined) updateData.notes = payload.notes;

    const { data: client, error } = await supabase
      .from('clients')
      .update(updateData)
      .eq('tenant_id', tenant.id)
      .eq('id', id)
      .select('*')
      .single();

    if (error || !client) return serverError('Failed to update client', error);

    // Trigger webhook
    try {
      triggerWebhookEvent("client.updated", tenant.id, buildClientPayload(client));
    } catch (webhookError) {
      console.error("Failed to trigger webhook:", webhookError);
    }

    return success(mapClient(client));
  } catch (error) {
    return serverError('Failed to update client', error);
  }
}

/**
 * DELETE /api/admin/clients/[id]
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const accessToken = getAccessToken(request);
    if (!accessToken) return unauthorized('Missing access token');

    const user = getUserFromToken(accessToken);
    if (!user) return unauthorized('Invalid access token');

    const { id } = await params;
    const tenantSlug = request.nextUrl.searchParams.get('tenant');
    const supabase = createUserClient(accessToken);
    const { tenant, error: tenantError } = await resolveTenant(supabase, user.userId, tenantSlug);
    if (tenantError || !tenant) return badRequest('Tenant not found');

    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('tenant_id', tenant.id)
      .eq('id', id);

    if (error) return serverError('Failed to delete client', error);

    return success({ deleted: true });
  } catch (error) {
    return serverError('Failed to delete client', error);
  }
}
