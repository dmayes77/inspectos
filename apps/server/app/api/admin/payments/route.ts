import { badRequest, serverError, success } from '@/lib/supabase';
import { withAuth } from '@/lib/api/with-auth';

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
export const GET = withAuth(async ({ supabase, tenant }) => {
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
});

/**
 * POST /api/admin/payments
 */
export const POST = withAuth(async ({ supabase, tenant, request }) => {
  const body = await request.json();
  const { order_id, amount, method, notes } = body;

  if (!order_id || !amount || !method) {
    return badRequest('order_id, amount, and method are required');
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
});
