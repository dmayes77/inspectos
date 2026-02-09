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
import { formatInvoiceNumber } from '@inspectos/shared/utils/invoices';
import { triggerWebhookEvent } from '@/lib/webhooks/delivery';
import { buildInvoicePayload } from '@/lib/webhooks/payloads';

type RawInvoice = {
  id: string;
  status: string | null;
  total: number | null;
  issued_at: string | null;
  due_at: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  client_id?: string | null;
  order_id?: string | null;
  client?: { id: string; name: string } | { id: string; name: string }[] | null;
  order?: { id: string; order_number: string; client_id: string | null } | { id: string; order_number: string; client_id: string | null }[] | null;
};

const mapInvoice = (invoice: RawInvoice) => {
  const client = Array.isArray(invoice.client) ? invoice.client[0] : invoice.client;
  const order = Array.isArray(invoice.order) ? invoice.order[0] : invoice.order;
  return {
    invoiceId: invoice.id,
    invoiceNumber: formatInvoiceNumber(invoice.id),
    clientId: invoice.client_id ?? client?.id ?? null,
    clientName: client?.name ?? "",
    orderId: invoice.order_id ?? order?.id ?? null,
    orderNumber: order?.order_number ?? "",
    amount: Number(invoice.total ?? 0),
    issuedDate: invoice.issued_at ? new Date(invoice.issued_at).toISOString().slice(0, 10) : "",
    dueDate: invoice.due_at ? new Date(invoice.due_at).toISOString().slice(0, 10) : "",
    status: invoice.status ?? "draft",
    createdAt: invoice.created_at ?? null,
    updatedAt: invoice.updated_at ?? null,
  };
};

const normalizeDate = (value?: string | null) => {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
};

/**
 * GET /api/admin/invoices
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
      .from('invoices')
      .select('id, status, total, issued_at, due_at, created_at, updated_at, client_id, order_id, client:clients(id, name), order:orders(id, order_number, client_id)')
      .eq('tenant_id', tenant.id)
      .order('created_at', { ascending: false });

    if (error) {
      return serverError('Failed to fetch invoices', error);
    }

    const mapped = (data ?? []).map((invoice) => mapInvoice(invoice));
    return success(mapped);
  } catch (error) {
    return serverError('Failed to fetch invoices', error);
  }
}

/**
 * POST /api/admin/invoices
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

    const payload = await request.json();
    const tenantSlug = payload.tenant_slug || request.nextUrl.searchParams.get('tenant');
    const supabase = createUserClient(accessToken);
    const { tenant, error: tenantError } = await resolveTenant(supabase, user.userId, tenantSlug);
    if (tenantError || !tenant) {
      return badRequest('Tenant not found');
    }

    const orderId = payload?.order_id?.toString?.() ?? "";
    const total = Number(payload?.total ?? 0);

    if (!orderId) {
      return badRequest('Order is required for invoices.');
    }
    if (!Number.isFinite(total) || total <= 0) {
      return badRequest('Invoice total must be greater than zero.');
    }

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, client_id')
      .eq('id', orderId)
      .eq('tenant_id', tenant.id)
      .single();

    if (orderError || !order) {
      return badRequest(orderError?.message ?? 'Order not found.');
    }

    const clientId = order.client_id ?? payload?.client_id ?? null;
    if (!clientId) {
      return badRequest('Invoice must be linked to a client.');
    }

    const { data, error } = await supabase
      .from('invoices')
      .insert({
        tenant_id: tenant.id,
        client_id: clientId,
        order_id: orderId,
        status: payload?.status ?? "draft",
        total,
        issued_at: normalizeDate(payload?.issued_at),
        due_at: normalizeDate(payload?.due_at),
      })
      .select('id, status, total, issued_at, due_at, created_at, updated_at, client_id, order_id, client:clients(id, name), order:orders(id, order_number, client_id)')
      .single();

    if (error || !data) {
      return serverError(error?.message ?? 'Failed to create invoice.', error);
    }

    // Trigger webhook for invoice.created event
    try {
      // Fetch complete invoice data including all fields
      const { data: completeInvoice } = await supabase
        .from('invoices')
        .select(`
          id, invoice_number, order_id, status, subtotal, tax, total,
          issued_at, due_at, paid_at, created_at,
          client:clients(id, name, email)
        `)
        .eq('id', data.id)
        .single();

      if (completeInvoice) {
        // Flatten client relation if it's an array
        const clientData = Array.isArray(completeInvoice.client)
          ? completeInvoice.client[0]
          : completeInvoice.client;

        const invoiceData = {
          ...completeInvoice,
          client: clientData || null
        };

        triggerWebhookEvent("invoice.created", tenant.id, buildInvoicePayload(invoiceData));
      }
    } catch (webhookError) {
      console.error("Failed to trigger webhook:", webhookError);
    }

    return success(mapInvoice(data));
  } catch (error) {
    return serverError('Failed to create invoice', error);
  }
}
