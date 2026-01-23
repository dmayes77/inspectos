import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getTenantId } from "@/lib/supabase/admin-helpers";

export async function GET() {
  const tenantId = getTenantId();

  const { data, error } = await supabaseAdmin
    .from("tenant_members")
    .select("user_id, role, profiles(id, full_name, email)")
    .eq("tenant_id", tenantId)
    .in("role", ["inspector"]);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const inspectors = (data ?? []).map((row) => {
    // Supabase types nested relations as arrays, but single() returns an object
    const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
    return {
      teamMemberId: profile?.id ?? row.user_id,
      name: profile?.full_name ?? profile?.email ?? "Unknown",
    };
  });

  return NextResponse.json(inspectors);
}
