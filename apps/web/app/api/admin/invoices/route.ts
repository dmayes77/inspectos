import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getTenantId } from "@/lib/supabase/admin-helpers";

export async function GET() {
  const tenantId = getTenantId();
  const { data, error } = await supabaseAdmin
    .from("invoices")
    .select("id, status, total, issued_at, due_at, client:clients(id, name)")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const mapped = (data ?? []).map((invoice) => ({
    invoiceId: invoice.id,
    clientName: invoice.client?.name ?? "",
    amount: Number(invoice.total ?? 0),
    issuedDate: invoice.issued_at ? new Date(invoice.issued_at).toISOString().slice(0, 10) : "",
    dueDate: invoice.due_at ? new Date(invoice.due_at).toISOString().slice(0, 10) : "",
    status: invoice.status,
  }));

  return NextResponse.json(mapped);
}
