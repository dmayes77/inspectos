import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getTenantId } from "@/lib/supabase/admin-helpers";

function mapRole(role: string | null | undefined) {
  switch ((role ?? "").toLowerCase()) {
    case "owner":
      return "OWNER";
    case "admin":
      return "ADMIN";
    case "inspector":
      return "INSPECTOR";
    case "viewer":
      return "OFFICE_STAFF";
    default:
      return "OFFICE_STAFF";
  }
}

function formatJoinedDate(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

export async function GET() {
  const tenantId = getTenantId();

  const { data, error } = await supabaseAdmin
    .from("tenant_members")
    .select("user_id, role, created_at, profiles(id, full_name, email, avatar_url, phone)")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: { message: error.message } }, { status: 500 });
  }

  const members = (data ?? []).map((row) => {
    const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
    return {
      id: profile?.id ?? row.user_id,
      teamMemberId: profile?.id ?? row.user_id,
      avatarUrl: profile?.avatar_url ?? undefined,
      name: profile?.full_name ?? profile?.email ?? "Unknown",
      email: profile?.email ?? "",
      phone: profile?.phone ?? "",
      role: mapRole(row.role),
      status: "active",
      location: "",
      inspections: 0,
      rating: null,
      certifications: [],
      joinedDate: formatJoinedDate(row.created_at),
      customPermissions: [],
    };
  });

  return NextResponse.json({ data: members });
}

export async function POST(request: NextRequest) {
  const tenantId = getTenantId();
  const payload = await request.json();

  const email = (payload?.email as string | undefined)?.trim().toLowerCase();
  const name = (payload?.name as string | undefined)?.trim();
  const role = (payload?.role as string | undefined)?.toLowerCase();

  if (!email) {
    return NextResponse.json({ error: { message: "Email is required." } }, { status: 400 });
  }

  const { data: usersResult, error: userError } = await supabaseAdmin.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  });
  const user = usersResult?.users?.find((candidate) => candidate.email?.toLowerCase() === email);
  if (userError || !user) {
    return NextResponse.json(
      { error: { message: "Auth user not found. Create the user in Supabase Auth first." } },
      { status: 400 }
    );
  }

  const userId = user.id;

  const phone = typeof payload?.phone === "string" ? payload.phone.trim() : undefined;

  if (name || phone) {
    await supabaseAdmin
      .from("profiles")
      .upsert(
        { id: userId, email, full_name: name, phone: phone ?? null },
        { onConflict: "id" }
      );
  }

  const memberRole = ["owner", "admin", "inspector", "viewer"].includes(role ?? "") ? role : "viewer";

  const { error: memberError } = await supabaseAdmin
    .from("tenant_members")
    .upsert({ tenant_id: tenantId, user_id: userId, role: memberRole }, { onConflict: "tenant_id,user_id" });

  if (memberError) {
    return NextResponse.json({ error: { message: memberError.message } }, { status: 500 });
  }

  return NextResponse.json({ data: { user_id: userId } });
}
