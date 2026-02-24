import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { badRequest, createServiceClient, unauthorized } from "@/lib/supabase";
import { setAgentPortalSessionCookies } from "@/lib/agent-portal/session";
import { verifyAgentPortalPassword } from "@/lib/agent-portal/password";

type LoginBody = {
  email?: string;
  password?: string;
};

const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30;

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as LoginBody;
  const email = body.email?.trim().toLowerCase();
  const password = body.password ?? "";

  if (!email || !password) {
    return badRequest("email and password are required.");
  }

  const serviceClient = createServiceClient();
  const { data: agent, error } = await serviceClient
    .from("agents")
    .select("id, name, email, phone, tenant:tenants(id, name, slug, business_id), status, portal_access_enabled, portal_password_hash")
    .eq("email", email)
    .eq("portal_access_enabled", true)
    .eq("status", "active")
    .maybeSingle();

  if (error || !agent) {
    return unauthorized("Invalid email or password.");
  }

  if (!verifyAgentPortalPassword(password, agent.portal_password_hash)) {
    return unauthorized("Invalid email or password.");
  }

  const tenantData = Array.isArray(agent.tenant) ? agent.tenant[0] : agent.tenant;
  if (!tenantData) {
    return unauthorized("Workspace not found.");
  }

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();
  await serviceClient
    .from("agents")
    .update({
      magic_link_token: token,
      magic_link_expires_at: expiresAt,
      last_portal_access_at: new Date().toISOString(),
    })
    .eq("id", agent.id);

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
        profile: {
          name: agent.name,
          email: agent.email,
          phone: agent.phone,
        },
      },
    }),
    token,
    agent.id
  );
}
