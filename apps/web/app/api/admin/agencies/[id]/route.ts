import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getTenantId } from "@/lib/supabase/admin-helpers";
import { validateRequestBody } from "@/lib/api/validate";
import { updateAgencySchema } from "@/lib/validations/agency";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const tenantId = getTenantId();
  const { id } = await params;

  const { data, error } = await supabaseAdmin
    .from("agencies")
    .select(`
      *,
      agents:agents(id, name, email, phone, status, total_referrals, total_revenue)
    `)
    .eq("tenant_id", tenantId)
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: { message: error?.message ?? "Agency not found." } },
      { status: 404 }
    );
  }

  return NextResponse.json({ data });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const tenantId = getTenantId();
  const { id } = await params;

  const validation = await validateRequestBody(request, updateAgencySchema);
  if (validation.error) {
    return validation.error;
  }
  const payload = validation.data;

  const updateData: Record<string, unknown> = {};
  if (payload.name !== undefined) updateData.name = payload.name;
  if (payload.license_number !== undefined) updateData.license_number = payload.license_number;
  if (payload.email !== undefined) updateData.email = payload.email;
  if (payload.phone !== undefined) updateData.phone = payload.phone;
  if (payload.website !== undefined) updateData.website = payload.website || null;
  if (payload.address_line1 !== undefined) updateData.address_line1 = payload.address_line1;
  if (payload.address_line2 !== undefined) updateData.address_line2 = payload.address_line2;
  if (payload.city !== undefined) updateData.city = payload.city;
  if (payload.state !== undefined) updateData.state = payload.state;
  if (payload.zip_code !== undefined) updateData.zip_code = payload.zip_code;
  if (payload.status !== undefined) updateData.status = payload.status;
  if (payload.notes !== undefined) updateData.notes = payload.notes;

  const { data, error } = await supabaseAdmin
    .from("agencies")
    .update(updateData)
    .eq("tenant_id", tenantId)
    .eq("id", id)
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: { message: error?.message ?? "Failed to update agency." } },
      { status: 500 }
    );
  }

  return NextResponse.json({ data });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const tenantId = getTenantId();
  const { id } = await params;

  // Check if agency has active agents
  const { count } = await supabaseAdmin
    .from("agents")
    .select("*", { count: "exact", head: true })
    .eq("agency_id", id)
    .eq("status", "active");

  if (count && count > 0) {
    return NextResponse.json(
      { error: { message: "Cannot delete agency with active agents. Deactivate or reassign agents first." } },
      { status: 400 }
    );
  }

  const { error } = await supabaseAdmin
    .from("agencies")
    .delete()
    .eq("tenant_id", tenantId)
    .eq("id", id);

  if (error) {
    return NextResponse.json(
      { error: { message: error.message } },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
