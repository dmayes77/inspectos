import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getTenantId } from "@/lib/supabase/admin-helpers";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const tenantId = getTenantId();
  const { id } = await params;

  const { data: vendor, error } = await supabaseAdmin
    .from("vendors")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("id", id)
    .single();

  if (error || !vendor) {
    return NextResponse.json({ error: error?.message ?? "Vendor not found" }, { status: 404 });
  }

  return NextResponse.json(vendor);
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const tenantId = getTenantId();
  const { id } = await params;
  const body = await request.json();

  const { data: vendor, error } = await supabaseAdmin
    .from("vendors")
    .update({
      name: body.name,
      vendor_type: body.vendor_type ?? null,
      email: body.email ?? null,
      phone: body.phone ?? null,
      status: body.status ?? "active",
    })
    .eq("tenant_id", tenantId)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(vendor);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const tenantId = getTenantId();
  const { id } = await params;

  const { error } = await supabaseAdmin
    .from("vendors")
    .delete()
    .eq("tenant_id", tenantId)
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
