import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getTenantId } from "@/lib/supabase/admin-helpers";

function mapRoleToDb(role: string | null | undefined) {
  switch ((role ?? "").toUpperCase()) {
    case "OWNER":
      return "owner";
    case "ADMIN":
      return "admin";
    case "INSPECTOR":
      return "inspector";
    case "OFFICE_STAFF":
      return "viewer";
    default:
      return null;
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const tenantId = getTenantId();
  const { id } = await params;
  const memberId = id?.trim?.() ?? "";
  const isValidId = /^[0-9a-fA-F-]{36}$/.test(memberId);
  if (!isValidId) {
    return NextResponse.json(
      {
        error: {
          message: "Invalid team member id.",
          received: memberId,
          length: memberId.length,
        },
      },
      { status: 400 }
    );
  }
  const payload = await request.json();

  const fullName = typeof payload?.name === "string" ? payload.name.trim() : undefined;
  const avatarUrl = typeof payload?.avatarUrl === "string" ? payload.avatarUrl : undefined;
  const role = mapRoleToDb(payload?.role);
  const email = typeof payload?.email === "string" ? payload.email.trim().toLowerCase() : undefined;
  const phone = typeof payload?.phone === "string" ? payload.phone.trim() : undefined;

  const profileUpdate: Record<string, string> = {};
  if (fullName) profileUpdate.full_name = fullName;
  if (avatarUrl) profileUpdate.avatar_url = avatarUrl;
  if (email) profileUpdate.email = email;
  if (phone) profileUpdate.phone = phone;

  if (Object.keys(profileUpdate).length > 0) {
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update(profileUpdate)
      .eq("id", memberId);

    if (profileError) {
      return NextResponse.json({ error: { message: profileError.message } }, { status: 500 });
    }
  }

  if (role) {
    const { error: memberError } = await supabaseAdmin
      .from("tenant_members")
      .update({ role })
      .eq("tenant_id", tenantId)
      .eq("user_id", memberId);

    if (memberError) {
      return NextResponse.json({ error: { message: memberError.message } }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const tenantId = getTenantId();
  const { id } = await params;
  const memberId = id?.trim?.() ?? "";
  const isValidId = /^[0-9a-fA-F-]{36}$/.test(memberId);
  if (!isValidId) {
    return NextResponse.json(
      {
        error: {
          message: "Invalid team member id.",
          received: memberId,
          length: memberId.length,
        },
      },
      { status: 400 }
    );
  }

  const { error } = await supabaseAdmin
    .from("tenant_members")
    .delete()
    .eq("tenant_id", tenantId)
    .eq("user_id", memberId);

  if (error) {
    return NextResponse.json({ error: { message: error.message } }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
