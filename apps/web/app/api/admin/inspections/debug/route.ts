import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getTenantId } from "@/lib/supabase/admin-helpers";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const tenantParam = url.searchParams.get("tenant");
  const tenantId = tenantParam || getTenantId();

  const [{ count: inspections }, { count: orders }, { count: clients }] = await Promise.all([
    supabaseAdmin.from("inspections").select("id", { count: "exact", head: true }).eq("tenant_id", tenantId),
    supabaseAdmin.from("orders").select("id", { count: "exact", head: true }).eq("tenant_id", tenantId),
    supabaseAdmin.from("clients").select("id", { count: "exact", head: true }).eq("tenant_id", tenantId),
  ]);

  return NextResponse.json({
    tenant_id: tenantId,
    counts: {
      inspections: inspections ?? 0,
      orders: orders ?? 0,
      clients: clients ?? 0,
    },
  });
}
