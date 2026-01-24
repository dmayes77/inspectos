import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getTenantId } from "@/lib/supabase/admin-helpers";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const tenantId = getTenantId();
  const { id } = await params;
  const agentId = id?.trim?.() ?? "";

  if (!agentId) {
    return NextResponse.json(
      { error: { message: "Agent id is required." } },
      { status: 400 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from("agents")
    .update({
      magic_link_token: null,
      magic_link_expires_at: null,
    })
    .eq("id", agentId)
    .eq("tenant_id", tenantId)
    .select("id")
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: { message: error?.message || "Agent not found." } },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true });
}
