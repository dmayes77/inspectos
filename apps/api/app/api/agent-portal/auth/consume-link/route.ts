import { NextRequest, NextResponse } from "next/server";
import { badRequest, createServiceClient, unauthorized } from "@/lib/supabase";
import {
  AGENT_PORTAL_AGENT_COOKIE,
  AGENT_PORTAL_TOKEN_COOKIE,
} from "@/lib/agent-portal/session";

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
    .select("id, tenant:tenants(id, name, slug, business_id), status, portal_access_enabled, magic_link_expires_at")
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

  await serviceClient
    .from("agents")
    .update({ last_portal_access_at: new Date().toISOString() })
    .eq("id", agentId);

  const response = NextResponse.json({
    success: true,
    data: {
      workspace: {
        id: tenantData.id,
        name: tenantData.name,
        slug: tenantData.slug,
        businessId: tenantData.business_id,
        role: "agent",
      },
    },
  });

  response.cookies.set({
    name: AGENT_PORTAL_TOKEN_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  response.cookies.set({
    name: AGENT_PORTAL_AGENT_COOKIE,
    value: agentId,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return response;
}
