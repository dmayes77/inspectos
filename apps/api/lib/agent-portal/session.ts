import type { NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase";

export const AGENT_PORTAL_TOKEN_COOKIE = "agent_portal_token";
export const AGENT_PORTAL_AGENT_COOKIE = "agent_portal_agent_id";

type AgentPortalSession = {
  id: string;
  tenant_id: string;
  email: string | null;
  status: string;
  portal_access_enabled: boolean;
  magic_link_expires_at: string | null;
};

export async function resolveAgentPortalSession(request: NextRequest): Promise<AgentPortalSession | null> {
  const token = request.cookies.get(AGENT_PORTAL_TOKEN_COOKIE)?.value?.trim();
  const agentId = request.cookies.get(AGENT_PORTAL_AGENT_COOKIE)?.value?.trim();
  if (!token || !agentId) return null;

  const serviceClient = createServiceClient();
  const { data: agent, error } = await serviceClient
    .from("agents")
    .select("id, tenant_id, email, status, portal_access_enabled, magic_link_expires_at")
    .eq("id", agentId)
    .eq("magic_link_token", token)
    .maybeSingle();

  if (error || !agent) return null;
  if (!agent.portal_access_enabled || agent.status !== "active") return null;
  if (!agent.magic_link_expires_at || new Date(agent.magic_link_expires_at) <= new Date()) return null;

  return agent as AgentPortalSession;
}
