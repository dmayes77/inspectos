import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getTenantId } from "@/lib/supabase/admin-helpers";
import { formatInvoiceNumber } from "@/lib/utils/invoices";

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

export async function GET() {
  const tenantId = getTenantId();
  const { data, error } = await supabaseAdmin
    .from("invoices")
    .select("id, status, total, issued_at, due_at, created_at, updated_at, client_id, order_id, client:clients(id, name), order:orders(id, order_number, client_id)")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const mapped = (data ?? []).map((invoice) => mapInvoice(invoice));
  return NextResponse.json(mapped);
}

export async function POST(request: NextRequest) {
  const tenantId = getTenantId();
  const payload = await request.json();
  const orderId = payload?.order_id?.toString?.() ?? "";

  const total = Number(payload?.total ?? 0);
  if (!orderId) {
    return NextResponse.json(
      { error: { message: "Order is required for invoices." } },
      { status: 400 }
    );
  }
  if (!Number.isFinite(total) || total <= 0) {
    return NextResponse.json(
      { error: { message: "Invoice total must be greater than zero." } },
      { status: 400 }
    );
  }

  const { data: order, error: orderError } = await supabaseAdmin
    .from("orders")
    .select("id, client_id")
    .eq("id", orderId)
    .eq("tenant_id", tenantId)
    .single();

  if (orderError || !order) {
    return NextResponse.json(
      { error: { message: orderError?.message ?? "Order not found." } },
      { status: 400 }
    );
  }

  const clientId = order.client_id ?? payload?.client_id ?? null;
  if (!clientId) {
    return NextResponse.json(
      { error: { message: "Invoice must be linked to a client." } },
      { status: 400 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from("invoices")
    .insert({
      tenant_id: tenantId,
      client_id: clientId,
      order_id: orderId,
      status: payload?.status ?? "draft",
      total,
      issued_at: normalizeDate(payload?.issued_at),
      due_at: normalizeDate(payload?.due_at),
    })
    .select("id, status, total, issued_at, due_at, created_at, updated_at, client_id, order_id, client:clients(id, name), order:orders(id, order_number, client_id)")
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: { message: error?.message ?? "Failed to create invoice." } },
      { status: 500 }
    );
  }

  return NextResponse.json({ data: mapInvoice(data) });
}
