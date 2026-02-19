import { serverError, success } from '@/lib/supabase';
import { requirePermission, withAuth } from '@/lib/api/with-auth';

/**
 * GET /api/admin/payouts
 */
export const GET = withAuth(async ({ supabase, tenant, memberRole, request }) => {
  const permissionCheck = requirePermission(memberRole, 'view_billing', 'You do not have permission to view payouts');
  if (permissionCheck) return permissionCheck;

  const status = request.nextUrl.searchParams.get('status');

  let query = supabase
    .from('payouts')
    .select(`
      id,
      inspector_id,
      period_start,
      period_end,
      gross_amount,
      deductions,
      net_amount,
      status,
      paid_at,
      payment_method,
      payment_reference,
      created_at,
      inspector:profiles(id, full_name, email),
      items:payout_items(count)
    `)
    .eq('tenant_id', tenant.id)
    .order('period_end', { ascending: false })
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) {
    return serverError('Failed to fetch payouts', error);
  }

  const mapped = (data ?? []).map((payout: Record<string, unknown>) => {
    const inspector = Array.isArray(payout.inspector) ? payout.inspector[0] : payout.inspector;
    const items = Array.isArray(payout.items) ? payout.items[0] : payout.items;

    return {
      id: payout.id,
      inspector: inspector
        ? { id: inspector.id, full_name: inspector.full_name, email: inspector.email }
        : null,
      period_start: payout.period_start,
      period_end: payout.period_end,
      gross_amount: Number(payout.gross_amount ?? 0),
      deductions: Number(payout.deductions ?? 0),
      net_amount: Number(payout.net_amount ?? 0),
      status: payout.status,
      items_count: items?.count ?? 0,
      paid_at: payout.paid_at,
      payment_method: payout.payment_method,
      payment_reference: payout.payment_reference,
      created_at: payout.created_at,
    };
  });

  return success(mapped);
});
