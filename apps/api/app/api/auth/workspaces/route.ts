import { NextRequest, NextResponse } from "next/server";
import {
  clearSessionCookies,
  readSessionTokensFromCookies,
  setSessionCookies,
} from "@/lib/auth/session-cookies";
import { createAnonClient, createServiceClient, unauthorized } from "@/lib/supabase";

type AgentWorkspaceRow = {
  id: string;
  tenant:
    | {
        id: string;
        name: string;
        slug: string;
        business_id: string | null;
      }
    | Array<{
        id: string;
        name: string;
        slug: string;
        business_id: string | null;
      }>
    | null;
};

async function fetchWorkspaces(email: string) {
  const serviceClient = createServiceClient();
  const normalizedEmail = email.trim().toLowerCase();
  const { data, error } = await serviceClient
    .from("agents")
    .select("id, tenant:tenants(id, name, slug, business_id)")
    .ilike("email", normalizedEmail)
    .eq("status", "active")
    .eq("portal_access_enabled", true);

  if (error) {
    throw error;
  }

  const workspaces = (data ?? []) as AgentWorkspaceRow[];
  return workspaces
    .map((workspace) => {
      const tenantData = Array.isArray(workspace.tenant) ? workspace.tenant[0] : workspace.tenant;
      if (!tenantData) return null;
      return {
        id: tenantData.id,
        name: tenantData.name,
        slug: tenantData.slug,
        businessId: tenantData.business_id,
        role: "agent",
      };
    })
    .filter((workspace): workspace is NonNullable<typeof workspace> => workspace !== null);
}

export async function GET(request: NextRequest) {
  const { accessToken, refreshToken } = readSessionTokensFromCookies(request);
  if (!accessToken && !refreshToken) {
    return unauthorized("Not authenticated");
  }

  const supabase = createAnonClient();

  if (accessToken) {
    const { data, error } = await supabase.auth.getUser(accessToken);
    if (!error && data.user) {
      const email = data.user.email?.trim().toLowerCase();
      if (!email) {
        return unauthorized("No email associated with account");
      }
      const workspaces = await fetchWorkspaces(email);
      return NextResponse.json({
        success: true,
        data: { workspaces },
      });
    }
  }

  if (!refreshToken) {
    const response = NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "Session expired" } },
      { status: 401 }
    );
    return clearSessionCookies(response);
  }

  const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession({
    refresh_token: refreshToken,
  });

  if (refreshError || !refreshed.session || !refreshed.user) {
    const response = NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "Session expired" } },
      { status: 401 }
    );
    return clearSessionCookies(response);
  }

  const email = refreshed.user.email?.trim().toLowerCase();
  if (!email) {
    const response = NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "No email associated with account" } },
      { status: 401 }
    );
    return clearSessionCookies(response);
  }

  const workspaces = await fetchWorkspaces(email);
  const response = NextResponse.json({
    success: true,
    data: {
      workspaces,
    },
  });

  return setSessionCookies(response, {
    accessToken: refreshed.session.access_token,
    refreshToken: refreshed.session.refresh_token,
  });
}
