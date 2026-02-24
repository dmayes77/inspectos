import { NextRequest } from "next/server";
import { createServiceClient, forbidden, success, unauthorized } from "@/lib/supabase";
import { isAgentPortalOnboardingRequired, resolveAgentPortalSession } from "@/lib/agent-portal/session";

type WorkspaceRow = {
  id: string;
  name: string;
  slug: string;
  business_id: string | null;
};

export async function GET(request: NextRequest) {
  const agentSession = await resolveAgentPortalSession(request);
  if (!agentSession) {
    return unauthorized("Not authenticated");
  }
  if (isAgentPortalOnboardingRequired(agentSession)) {
    return forbidden("Complete onboarding before accessing workspaces.");
  }

  const serviceClient = createServiceClient();
  const { data: tenant, error } = await serviceClient
    .from("tenants")
    .select("id, name, slug, business_id")
    .eq("id", agentSession.tenant_id)
    .maybeSingle();

  if (error || !tenant) {
    return unauthorized("Workspace not found");
  }

  const workspace = tenant as WorkspaceRow;
  return success({
    workspaces: [
      {
        id: workspace.id,
        name: workspace.name,
        slug: workspace.slug,
        businessId: workspace.business_id,
        role: "agent",
      },
    ],
  });
}
