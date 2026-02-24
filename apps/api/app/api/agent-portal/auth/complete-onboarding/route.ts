import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { badRequest, createServiceClient, unauthorized } from "@/lib/supabase";
import { validatePasswordPolicy } from "@/lib/security/password-policy";
import { hashAgentPortalPassword } from "@/lib/agent-portal/password";
import { setAgentPortalSessionCookies } from "@/lib/agent-portal/session";

type CompleteOnboardingBody = {
  token?: string;
  agent_id?: string;
  name?: string;
  email?: string;
  phone?: string | null;
  password?: string;
};

const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30;

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as CompleteOnboardingBody;
  const token = body.token?.trim();
  const agentId = body.agent_id?.trim();
  const name = body.name?.trim();
  const email = body.email?.trim().toLowerCase();
  const phone = typeof body.phone === "string" ? body.phone.trim() : null;
  const password = body.password ?? "";

  if (!token || !agentId) {
    return badRequest("token and agent_id are required.");
  }
  if (!name || !email || !password) {
    return badRequest("name, email, and password are required.");
  }

  const passwordError = validatePasswordPolicy(password);
  if (passwordError) {
    return badRequest(passwordError);
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
    return unauthorized("Workspace not found.");
  }

  const newToken = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();
  const passwordHash = hashAgentPortalPassword(password);

  const { error: updateError } = await serviceClient
    .from("agents")
    .update({
      name,
      email,
      phone,
      portal_password_hash: passwordHash,
      portal_password_set_at: new Date().toISOString(),
      magic_link_token: newToken,
      magic_link_expires_at: expiresAt,
      last_portal_access_at: new Date().toISOString(),
    })
    .eq("id", agentId);

  if (updateError) {
    return badRequest(updateError.message || "Unable to complete onboarding.");
  }

  return setAgentPortalSessionCookies(
    NextResponse.json({
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
    }),
    newToken,
    agentId
  );
}
