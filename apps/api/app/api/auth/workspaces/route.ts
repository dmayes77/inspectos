import { NextRequest, NextResponse } from "next/server";
import {
  clearSessionCookies,
  readSessionTokensFromCookies,
  setSessionCookies,
} from "@/lib/auth/session-cookies";
import { createAnonClient, createUserClient, unauthorized } from "@/lib/supabase";

type WorkspaceMembership = {
  role: string | null;
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

async function fetchWorkspaces(accessToken: string, userId: string) {
  const userClient = createUserClient(accessToken);
  const { data, error } = await userClient
    .from("tenant_members")
    .select("role, tenant:tenants(id, name, slug, business_id)")
    .eq("user_id", userId);

  if (error) {
    throw error;
  }

  const memberships = (data ?? []) as WorkspaceMembership[];
  return memberships
    .map((membership) => {
      const tenantData = Array.isArray(membership.tenant) ? membership.tenant[0] : membership.tenant;
      if (!tenantData) return null;
      return {
        id: tenantData.id,
        name: tenantData.name,
        slug: tenantData.slug,
        businessId: tenantData.business_id,
        role: membership.role,
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
      const workspaces = await fetchWorkspaces(accessToken, data.user.id);
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

  const workspaces = await fetchWorkspaces(refreshed.session.access_token, refreshed.user.id);
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
