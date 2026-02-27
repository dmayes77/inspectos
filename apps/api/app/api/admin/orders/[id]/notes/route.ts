import { badRequest, serverError, success } from '@/lib/supabase';
import { withAuth } from '@/lib/api/with-auth';
import { resolveIdLookup } from '@/lib/identifiers/lookup';

/**
 * GET /api/admin/orders/[id]/notes
 */
export const GET = withAuth<{ id: string }>(async ({ supabase, tenant, params }) => {
  const lookup = resolveIdLookup(params.id, { publicColumn: "order_number", transformPublicValue: (value) => value.toUpperCase() });

  // Verify order belongs to tenant
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('id, tenant_id')
    .eq(lookup.column, lookup.value)
    .eq('tenant_id', tenant.id)
    .limit(1)
    .maybeSingle();

  if (orderError || !order) {
    return badRequest('Order not found');
  }

  // Fetch notes with creator profile
  const { data: notes, error: notesError } = await supabase
    .from('order_notes')
    .select('*, created_by:profiles(id, full_name, email, avatar_url)')
    .eq('order_id', order.id)
    .eq('tenant_id', tenant.id)
    .order('created_at', { ascending: true });

  if (notesError) {
    return serverError('Failed to fetch order notes', notesError);
  }

  return success(notes || []);
});

/**
 * POST /api/admin/orders/[id]/notes
 */
export const POST = withAuth<{ id: string }>(async ({ supabase, tenant, user, params, request }) => {
  const lookup = resolveIdLookup(params.id, { publicColumn: "order_number", transformPublicValue: (value) => value.toUpperCase() });

  const body = await request.json();
  const { note_type, body: noteBody } = body;

  if (!note_type || !noteBody) {
    return badRequest('note_type and body are required');
  }

  if (!['internal', 'client'].includes(note_type)) {
    return badRequest('note_type must be "internal" or "client"');
  }

  // Verify order belongs to tenant
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('id, tenant_id')
    .eq(lookup.column, lookup.value)
    .eq('tenant_id', tenant.id)
    .limit(1)
    .maybeSingle();

  if (orderError || !order) {
    return badRequest('Order not found');
  }

  // Create note
  const { data: note, error: noteError } = await supabase
    .from('order_notes')
    .insert({
      order_id: order.id,
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
});
