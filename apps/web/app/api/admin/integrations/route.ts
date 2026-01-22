import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getTenantId } from "@/lib/supabase/admin-helpers";

export async function GET() {
  const tenantId = getTenantId();
  const { data, error } = await supabaseAdmin
    .from("integrations")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("type");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}

export async function POST(request: NextRequest) {
  const tenantId = getTenantId();
  const body = await request.json();

  const { type, provider, config } = body;

  if (!type || !provider) {
    return NextResponse.json(
      { error: "type and provider are required" },
      { status: 400 }
    );
  }

  // Check if integration already exists for this type
  const { data: existing } = await supabaseAdmin
    .from("integrations")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("type", type)
    .single();

  if (existing) {
    // Update existing integration
    const { data, error } = await supabaseAdmin
      .from("integrations")
      .update({
        provider,
        config: config || {},
        status: "connected",
        connected_at: new Date().toISOString(),
        error_message: null,
      })
      .eq("id", existing.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  }

  // Create new integration
  const { data, error } = await supabaseAdmin
    .from("integrations")
    .insert({
      tenant_id: tenantId,
      type,
      provider,
      config: config || {},
      status: "connected",
      connected_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
