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
 * GET /api/admin/orders/[id]/notes
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: orderId } = await params;

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

    // Verify order belongs to tenant
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, tenant_id')
      .eq('id', orderId)
      .eq('tenant_id', tenant.id)
      .single();

    if (orderError || !order) {
      return badRequest('Order not found');
    }

    // Fetch notes with creator profile
    const { data: notes, error: notesError } = await supabase
      .from('order_notes')
      .select('*, created_by:profiles(id, full_name, email, avatar_url)')
      .eq('order_id', orderId)
      .eq('tenant_id', tenant.id)
      .order('created_at', { ascending: true });

    if (notesError) {
      return serverError('Failed to fetch order notes', notesError);
    }

    return success(notes || []);
  } catch (error) {
    return serverError('Failed to fetch order notes', error);
  }
}

/**
 * POST /api/admin/orders/[id]/notes
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: orderId } = await params;

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
    const { note_type, body: noteBody } = body;

    if (!note_type || !noteBody) {
      return badRequest('note_type and body are required');
    }

    if (!['internal', 'client'].includes(note_type)) {
      return badRequest('note_type must be "internal" or "client"');
    }

    const tenantSlug = body.tenant_slug || request.nextUrl.searchParams.get('tenant');
    const supabase = createUserClient(accessToken);
    const { tenant, error: tenantError } = await resolveTenant(supabase, user.userId, tenantSlug);
    if (tenantError || !tenant) {
      return badRequest('Tenant not found');
    }

    // Verify order belongs to tenant
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, tenant_id')
      .eq('id', orderId)
      .eq('tenant_id', tenant.id)
      .single();

    if (orderError || !order) {
      return badRequest('Order not found');
    }

    // Create note
    const { data: note, error: noteError } = await supabase
      .from('order_notes')
      .insert({
        order_id: orderId,
        tenant_id: tenant.id,
        note_type,
        body: noteBody,
        created_by: user.userId,
      })
      .select('*, created_by:profiles(id, full_name, email, avatar_url)')
      .single();

    if (noteError || !note) {
      return serverError('Failed to create order note', noteError);
    }

    return success(note);
  } catch (error) {
    return serverError('Failed to create order note', error);
  }
}
