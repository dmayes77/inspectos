import type { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

export const AGENT_PORTAL_TOKEN_COOKIE = "agent_portal_token";
export const AGENT_PORTAL_AGENT_COOKIE = "agent_portal_agent_id";
const AGENT_PORTAL_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

type AgentPortalSession = {
  id: string;
  tenant_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  status: string;
  portal_access_enabled: boolean;
  portal_password_hash: string | null;
  magic_link_expires_at: string | null;
};

export async function resolveAgentPortalSession(request: NextRequest): Promise<AgentPortalSession | null> {
  const token = request.cookies.get(AGENT_PORTAL_TOKEN_COOKIE)?.value?.trim();
  const agentId = request.cookies.get(AGENT_PORTAL_AGENT_COOKIE)?.value?.trim();
  if (!token || !agentId) return null;

  const serviceClient = createServiceClient();
  const { data: agent, error } = await serviceClient
    .from("agents")
    .select("id, tenant_id, name, email, phone, status, portal_access_enabled, portal_password_hash, magic_link_expires_at")
    .eq("id", agentId)
    .eq("magic_link_token", token)
    .maybeSingle();

  if (error || !agent) return null;
  if (!agent.portal_access_enabled || agent.status !== "active") return null;
  if (!agent.magic_link_expires_at || new Date(agent.magic_link_expires_at) <= new Date()) return null;

  return agent as AgentPortalSession;
}

export function isAgentPortalOnboardingRequired(session: AgentPortalSession): boolean {
  return !session.portal_password_hash;
}

export function setAgentPortalSessionCookies(response: NextResponse, token: string, agentId: string) {
  response.cookies.set({
    name: AGENT_PORTAL_TOKEN_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: AGENT_PORTAL_COOKIE_MAX_AGE,
  });
  response.cookies.set({
    name: AGENT_PORTAL_AGENT_COOKIE,
    value: agentId,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: AGENT_PORTAL_COOKIE_MAX_AGE,
  });
  return response;
}
