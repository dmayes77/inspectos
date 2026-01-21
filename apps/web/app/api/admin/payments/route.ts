import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getTenantId } from "@/lib/supabase/admin-helpers";

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

  const mapped = (data ?? []).map((payment) => ({
    paymentId: payment.id,
    invoiceId: payment.invoice?.id ?? "",
    clientName: payment.invoice?.client?.name ?? "",
    amount: Number(payment.amount ?? 0),
    method: payment.method,
    status: payment.status,
    paidDate: payment.paid_at ? new Date(payment.paid_at).toISOString().slice(0, 10) : "",
  }));

  return NextResponse.json(mapped);
}
