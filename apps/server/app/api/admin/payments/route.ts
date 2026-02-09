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

type PaymentRow = {
  id: string;
  amount: number | null;
  method: string | null;
  status: string | null;
  paid_at: string | null;
  invoice: { id: string; client: { name: string } | { name: string }[] | null } | { id: string; client: { name: string } | { name: string }[] | null}[] | null;
};

/**
 * GET /api/admin/payments
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

    const { data, error } = await supabase
      .from('payments')
      .select('id, amount, method, status, paid_at, invoice:invoices(id, client:clients(name))')
      .eq('tenant_id', tenant.id)
      .order('paid_at', { ascending: false });

    if (error) {
      return serverError('Failed to fetch payments', error);
    }

    const mapped = (data as PaymentRow[] ?? []).map((payment) => {
      const invoice = Array.isArray(payment.invoice) ? payment.invoice[0] : payment.invoice;
      const client = Array.isArray(invoice?.client) ? invoice.client[0] : invoice?.client;
      return {
        paymentId: payment.id,
        invoiceId: invoice?.id ?? '',
        clientName: client?.name ?? '',
        amount: Number(payment.amount ?? 0),
        method: payment.method,
        status: payment.status,
        paidDate: payment.paid_at ? new Date(payment.paid_at).toISOString().slice(0, 10) : '',
      };
    });

    return success(mapped);
  } catch (error) {
    return serverError('Failed to fetch payments', error);
  }
}

/**
 * POST /api/admin/payments
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
    const { order_id, amount, method, notes, tenant_slug } = body;

    if (!order_id || !amount || !method) {
      return badRequest('order_id, amount, and method are required');
    }

    const tenantSlug = tenant_slug || request.nextUrl.searchParams.get('tenant');
    const supabase = createUserClient(accessToken);
    const { tenant, error: tenantError } = await resolveTenant(supabase, user.userId, tenantSlug);
    if (tenantError || !tenant) {
      return badRequest('Tenant not found');
    }

    // Record the payment
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        tenant_id: tenant.id,
        order_id,
        amount,
        method,
        status: 'completed',
        paid_at: new Date().toISOString(),
        notes,
      })
      .select()
      .single();

    if (paymentError) {
      return serverError('Failed to create payment', paymentError);
    }

    // Update the order payment status
    const { error: orderError } = await supabase
      .from('orders')
      .update({ payment_status: 'paid' })
      .eq('id', order_id)
      .eq('tenant_id', tenant.id);

    if (orderError) {
      console.error('Failed to update order payment status:', orderError);
    }

    return success(payment);
  } catch (error) {
    return serverError('Failed to create payment', error);
  }
}
