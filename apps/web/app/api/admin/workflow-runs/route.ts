import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getTenantId } from "@/lib/supabase/admin-helpers";

export async function GET() {
  const tenantId = getTenantId();
  const { data, error } = await supabaseAdmin
    .from("workflow_runs")
    .select("id, workflow_id, scope, entity_id, status, error, started_at, completed_at")
    .eq("tenant_id", tenantId)
    .order("started_at", { ascending: false })
    .limit(200);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(
    (data ?? []).map((run) => ({
      id: run.id,
      workflowId: run.workflow_id,
      scope: run.scope,
      entityId: run.entity_id,
      status: run.status,
      error: run.error ?? null,
      startedAt: run.started_at,
      completedAt: run.completed_at ?? null,
    }))
  );
}
