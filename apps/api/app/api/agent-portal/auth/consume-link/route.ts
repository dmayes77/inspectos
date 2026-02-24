import { NextRequest, NextResponse } from "next/server";
import { badRequest, createServiceClient, unauthorized } from "@/lib/supabase";
import { setAgentPortalSessionCookies } from "@/lib/agent-portal/session";

type ConsumeLinkBody = {
  token?: string;
  agent_id?: string;
};

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as ConsumeLinkBody;
  const token = body.token?.trim();
  const agentId = body.agent_id?.trim();

  if (!token || !agentId) {
    return badRequest("token and agent_id are required.");
  }

  const serviceClient = createServiceClient();
  const { data: agent, error } = await serviceClient
    .from("agents")
    .select("id, name, email, phone, portal_password_hash, tenant:tenants(id, name, slug, business_id), status, portal_access_enabled, magic_link_expires_at")
    .eq("id", agentId)
    .eq("magic_link_token", token)
    .maybeSingle();

  if (error || !agent) {
    return unauthorized("Invite link is invalid.");
  }

  if (!agent.portal_access_enabled || agent.status !== "active") {
    return unauthorized("Portal access is disabled for this agent.");
  }

  if (!agent.magic_link_expires_at || new Date(agent.magic_link_expires_at) <= new Date()) {
    return unauthorized("Invite link has expired.");
  }

  const tenantData = Array.isArray(agent.tenant) ? agent.tenant[0] : agent.tenant;
  if (!tenantData) {
    return unauthorized("Tenant not found for this invite.");
  }

  const onboardingRequired = !agent.portal_password_hash;
  await serviceClient
    .from("agents")
    .update({
      last_portal_access_at: new Date().toISOString(),
      portal_invite_consumed_at: onboardingRequired ? new Date().toISOString() : undefined,
    })
    .eq("id", agentId);

  const response = setAgentPortalSessionCookies(
    NextResponse.json({
      success: true,
      data: {
        onboarding_required: onboardingRequired,
        profile: {
          name: agent.name,
          email: agent.email,
          phone: agent.phone,
        },
        workspace: {
          id: tenantData.id,
          name: tenantData.name,
          slug: tenantData.slug,
          businessId: tenantData.business_id,
          role: "agent",
        },
      },
    }),
    token,
    agentId
  );

  return response;
}
