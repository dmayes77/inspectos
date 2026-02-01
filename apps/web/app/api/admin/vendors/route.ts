import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getTenantId } from "@/lib/supabase/admin-helpers";

export async function GET() {
  const tenantId = getTenantId();

  const { data: vendors, error } = await supabaseAdmin
    .from("vendors")
    .select("id, name, vendor_type, email, phone, status")
    .eq("tenant_id", tenantId)
    .order("name");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(vendors ?? []);
}

export async function POST(request: Request) {
  const tenantId = getTenantId();
  const body = await request.json();

  const { data: vendor, error } = await supabaseAdmin
    .from("vendors")
    .insert({
      tenant_id: tenantId,
      name: body.name,
      vendor_type: body.vendor_type ?? null,
      email: body.email ?? null,
      phone: body.phone ?? null,
      status: body.status ?? "active",
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(vendor);
}
