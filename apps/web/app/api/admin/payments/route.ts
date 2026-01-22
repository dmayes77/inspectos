import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getTenantId } from "@/lib/supabase/admin-helpers";

type PaymentRow = {
  id: string;
  amount: number | null;
  method: string | null;
  status: string | null;
  paid_at: string | null;
  invoice: { id: string; client: { name: string } | { name: string }[] | null } | { id: string; client: { name: string } | { name: string }[] | null }[] | null;
};

export async function GET() {
  const tenantId = getTenantId();
  const { data, error } = await supabaseAdmin
    .from("payments")
    .select("id, amount, method, status, paid_at, invoice:invoices(id, client:clients(name))")
    .eq("tenant_id", tenantId)
    .order("paid_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const mapped = (data as PaymentRow[] ?? []).map((payment) => {
    // Supabase types nested relations as arrays, but single() returns an object
    const invoice = Array.isArray(payment.invoice) ? payment.invoice[0] : payment.invoice;
    const client = Array.isArray(invoice?.client) ? invoice.client[0] : invoice?.client;
    return {
      paymentId: payment.id,
      invoiceId: invoice?.id ?? "",
      clientName: client?.name ?? "",
      amount: Number(payment.amount ?? 0),
      method: payment.method,
      status: payment.status,
      paidDate: payment.paid_at ? new Date(payment.paid_at).toISOString().slice(0, 10) : "",
    };
  });

  return NextResponse.json(mapped);
}

export async function POST(request: NextRequest) {
  const tenantId = getTenantId();
  const body = await request.json();

  const { order_id, amount, method, notes } = body;

  if (!order_id || !amount || !method) {
    return NextResponse.json(
      { error: "order_id, amount, and method are required" },
      { status: 400 }
    );
  }

  // Record the payment
  const { data: payment, error: paymentError } = await supabaseAdmin
    .from("payments")
    .insert({
      tenant_id: tenantId,
      order_id,
      amount,
      method,
      status: "completed",
      paid_at: new Date().toISOString(),
      notes,
    })
    .select()
    .single();

  if (paymentError) {
    return NextResponse.json({ error: paymentError.message }, { status: 500 });
  }

  // Update the order payment status
  const { error: orderError } = await supabaseAdmin
    .from("orders")
    .update({ payment_status: "paid" })
    .eq("id", order_id)
    .eq("tenant_id", tenantId);

  if (orderError) {
    // Payment was recorded but order update failed - log but don't fail
    console.error("Failed to update order payment status:", orderError);
  }

  return NextResponse.json(payment, { status: 201 });
}
