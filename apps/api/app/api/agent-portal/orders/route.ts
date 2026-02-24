import { NextRequest } from "next/server";
import { createServiceClient, forbidden, success, unauthorized } from "@/lib/supabase";
import { isAgentPortalOnboardingRequired, resolveAgentPortalSession } from "@/lib/agent-portal/session";

export async function GET(request: NextRequest) {
  const agentSession = await resolveAgentPortalSession(request);
  if (!agentSession) {
    return unauthorized("Not authenticated");
  }
  if (isAgentPortalOnboardingRequired(agentSession)) {
    return forbidden("Complete onboarding before accessing orders.");
  }

  const business = request.nextUrl.searchParams.get("business")?.trim().toLowerCase() ?? null;
  const serviceClient = createServiceClient();

  let tenantId = agentSession.tenant_id;
  if (business) {
    const { data: tenant } = await serviceClient
      .from("tenants")
      .select("id, slug, business_id")
      .eq("id", agentSession.tenant_id)
      .maybeSingle();
    if (!tenant) {
      return unauthorized("Workspace not found");
    }
    const slug = tenant.slug?.toLowerCase();
    const businessId = tenant.business_id?.toLowerCase();
    if (business !== slug && business !== businessId) {
      return unauthorized("Invalid workspace");
    }
    tenantId = tenant.id;
  }

  const { data, error } = await serviceClient
    .from("orders")
    .select(`
      id,
      order_number,
      status,
      scheduled_date,
      scheduled_time,
      total,
      payment_status,
      property:properties(address_line1, city, state),
      client:clients(name)
    `)
    .eq("tenant_id", tenantId)
    .eq("agent_id", agentSession.id)
    .order("scheduled_date", { ascending: false, nullsFirst: false });

  if (error) {
    return unauthorized("Failed to load orders");
  }

  return success(data ?? []);
}
