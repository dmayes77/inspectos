import { NextRequest, NextResponse } from 'next/server';
import {
  clearSessionCookies,
  readSessionTokensFromCookies,
  setSessionCookies,
} from '@/lib/auth/session-cookies';
import { createAnonClient, createServiceClient, unauthorized } from '@/lib/supabase';
import { applyCorsHeaders, buildCorsPreflightResponse } from '@/lib/cors';

type MembershipRow = {
  role: string;
  profiles:
    | { is_inspector?: boolean; avatar_url?: string | null }
    | { is_inspector?: boolean; avatar_url?: string | null }[]
    | null;
  tenant:
    | { id: string; name: string; slug: string }
    | { id: string; name: string; slug: string }[]
    | null;
};

function normalizeMembershipTenant(row: MembershipRow) {
  const tenant = Array.isArray(row.tenant) ? row.tenant[0] : row.tenant;
  if (!tenant) return null;
  return tenant;
}

function normalizeMembershipProfile(row: MembershipRow) {
  const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
  return profile ?? null;
}

function isInspectorMember(row: MembershipRow) {
  const profile = normalizeMembershipProfile(row);
  return row.role === 'inspector' || Boolean(profile?.is_inspector);
}

async function resolveTenantForUser(userId: string) {
  const serviceClient = createServiceClient();
  const { data, error } = await serviceClient
    .from('tenant_members')
    .select('role, profiles!left(is_inspector, avatar_url), tenant:tenants(id, name, slug)')
    .eq('user_id', userId);

  if (error) {
    throw error;
  }

  const memberships = (data ?? []) as MembershipRow[];
  const preferred = memberships.find(isInspectorMember) ?? memberships[0] ?? null;
  if (!preferred) return null;
  const tenant = normalizeMembershipTenant(preferred);
  if (!tenant) return null;
  const profile = normalizeMembershipProfile(preferred);

  return {
    role: preferred.role,
    tenant,
    avatarUrl: profile?.avatar_url ?? null,
  };
}

export async function GET(request: NextRequest) {
  const origin = request.headers.get('origin') ?? null;
  const { accessToken, refreshToken } = readSessionTokensFromCookies(request);
  if (!accessToken && !refreshToken) {
    return applyCorsHeaders(unauthorized('Not authenticated'), request);
  }

  const supabase = createAnonClient();

  const buildPayload = async (user: { id: string; email?: string | null }) => {
    const tenantResult = await resolveTenantForUser(user.id);
    if (!tenantResult) {
      return null;
    }

    return {
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email ?? null,
          avatar_url: tenantResult.avatarUrl,
        },
        tenant: {
          id: tenantResult.tenant.id,
          name: tenantResult.tenant.name,
          slug: tenantResult.tenant.slug,
          role: tenantResult.role,
        },
      },
    };
  };

  if (accessToken) {
    const { data, error } = await supabase.auth.getUser(accessToken);
    if (!error && data.user) {
      const payload = await buildPayload(data.user);
      if (!payload) {
        return applyCorsHeaders(unauthorized('No business membership found for this account'), request);
      }
      return applyCorsHeaders(NextResponse.json(payload), request);
    }
  }

  if (!refreshToken) {
    const response = NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Session expired' } },
      { status: 401 }
    );
    return applyCorsHeaders(clearSessionCookies(response, { origin }), request);
  }

  const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession({
    refresh_token: refreshToken,
  });

  if (refreshError || !refreshed.session || !refreshed.user) {
    const response = NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Session expired' } },
      { status: 401 }
    );
    return applyCorsHeaders(clearSessionCookies(response, { origin }), request);
  }

  const payload = await buildPayload(refreshed.user);
  if (!payload) {
    return applyCorsHeaders(unauthorized('No business membership found for this account'), request);
  }

  const response = NextResponse.json(payload);
  return applyCorsHeaders(
    setSessionCookies(response, {
      accessToken: refreshed.session.access_token,
      refreshToken: refreshed.session.refresh_token,
    }, { origin }),
    request
  );
}

export async function OPTIONS(request: NextRequest) {
  return buildCorsPreflightResponse(request, 'GET, OPTIONS');
}
