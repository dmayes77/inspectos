import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getTenantId } from "@/lib/supabase/admin-helpers";
import { validateRequestBody } from "@/lib/api/validate";
import { createAgencySchema } from "@/lib/validations/agency";

export async function GET(request: NextRequest) {
  const tenantId = getTenantId();
  const searchParams = request.nextUrl.searchParams;

  let query = supabaseAdmin
    .from("agencies")
    .select(`
      *,
      agents:agents(id, name, email, phone, status, total_referrals)
    `)
    .eq("tenant_id", tenantId)
    .order("name", { ascending: true });

  const status = searchParams.get("status");
  if (status) {
    query = query.eq("status", status);
  }

  const search = searchParams.get("search");
  if (search) {
    query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: { message: error.message } }, { status: 500 });
  }

  return NextResponse.json({ data: data ?? [] });
}

export async function POST(request: Request) {
  const tenantId = getTenantId();

  const validation = await validateRequestBody(request, createAgencySchema);
  if (validation.error) {
    return validation.error;
  }
  const payload = validation.data;

  const { data, error } = await supabaseAdmin
    .from("agencies")
    .insert({
      tenant_id: tenantId,
      name: payload.name,
      license_number: payload.license_number ?? null,
      email: payload.email ?? null,
      phone: payload.phone ?? null,
      website: payload.website || null,
      address_line1: payload.address_line1 ?? null,
      address_line2: payload.address_line2 ?? null,
      city: payload.city ?? null,
      state: payload.state ?? null,
      zip_code: payload.zip_code ?? null,
      status: payload.status ?? "active",
      notes: payload.notes ?? null,
    })
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: { message: error?.message ?? "Failed to create agency." } },
      { status: 500 }
    );
  }

  return NextResponse.json({ data });
}
