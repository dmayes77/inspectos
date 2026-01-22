import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getTenantId } from "@/lib/supabase/admin-helpers";

export async function GET(request: NextRequest) {
  const tenantId = getTenantId();
  const searchParams = request.nextUrl.searchParams;
  const clientId = searchParams.get("client_id");

  let query = supabaseAdmin
    .from("properties")
    .select(
      "*, client:clients(id, name, email, phone)"
    )
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (clientId) {
    query = query.eq("client_id", clientId);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: { message: error.message } }, { status: 500 });
  }

  return NextResponse.json({ data: data ?? [] });
}

export async function POST(request: Request) {
  const tenantId = getTenantId();
  const payload = await request.json();

  const {
    client_id,
    address_line1,
    address_line2,
    city,
    state,
    zip_code,
    property_type,
    year_built,
    square_feet,
    notes,
  } = payload ?? {};

  if (!address_line1 || !city || !state || !zip_code) {
    return NextResponse.json(
      { error: { message: "Missing required fields: address_line1, city, state, zip_code" } },
      { status: 400 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from("properties")
    .insert({
      tenant_id: tenantId,
      client_id: client_id ?? null,
      address_line1,
      address_line2: address_line2 ?? null,
      city,
      state,
      zip_code,
      property_type: property_type ?? "residential",
      year_built: year_built ?? null,
      square_feet: square_feet ?? null,
      notes: notes ?? null,
    })
    .select("*, client:clients(id, name, email, phone)")
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: { message: error?.message ?? "Failed to create property." } },
      { status: 500 }
    );
  }

  return NextResponse.json({ data });
}
