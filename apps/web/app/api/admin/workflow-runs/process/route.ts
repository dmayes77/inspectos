import { NextResponse } from "next/server";
import { getTenantId } from "@/lib/supabase/admin-helpers";
import { processPendingWorkflowRuns } from "@/lib/admin/workflow-runner";

export async function POST() {
  const tenantId = getTenantId();
  await processPendingWorkflowRuns(tenantId);
  return NextResponse.json({ success: true });
}
