/**
 * withAuth — Route handler wrapper that handles auth + tenant resolution.
 *
 * Eliminates the repeated boilerplate from every admin route handler:
 *   getAccessToken → getUserFromToken → createUserClient → resolveTenant
 *
 * Usage (collection route):
 *   export const GET = withAuth(async ({ supabase, tenant }) => { ... });
 *
 * Usage (dynamic route with params):
 *   export const GET = withAuth<{ id: string }>(async ({ supabase, tenant, params }) => {
 *     const { id } = params;
 *     ...
 *   });
 */

import type { NextRequest } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  createUserClient,
  createAnonClient,
  createServiceClient,
  getAccessToken,
  getUserFromToken,
  unauthorized,
  badRequest,
  paymentRequired,
  forbidden,
  serverError,
} from '@/lib/supabase';
import { readSessionTokensFromCookies } from '@/lib/auth/session-cookies';
import { resolveTenant, type TenantMemberRole } from '@/lib/tenants';
import { getBusinessApiKey, resolveBusinessByApiKey } from '@/lib/api/business-api-keys';
import { verifyBusinessBillingAccessByTenantId } from '@/lib/billing/access';
import { getRequestIp, recordAuthAuditEvent } from '@/lib/security/auth-audit';

export interface AuthContext {
  supabase: SupabaseClient;
  serviceClient: SupabaseClient;
  tenant: { id: string; name: string; slug: string; business_id?: string };
  business: { id: string; name: string; slug: string; business_id?: string };
  user: { userId: string; email?: string };
  memberRole: TenantMemberRole;
  memberPermissions: Permission[];
  request: NextRequest;
  authType?: 'user' | 'api_key';
}

export type Permission =
  | 'view_team'
  | 'create_team'
  | 'edit_team'
  | 'delete_team'
  | 'manage_roles'
  | 'view_settings'
  | 'edit_settings'
  | 'edit_branding'
  | 'view_billing'
  | 'view_invoices'
  | 'create_invoices';

const ROLE_PERMISSIONS: Record<TenantMemberRole, Permission[]> = {
  owner: [
    'view_team',
    'create_team',
    'edit_team',
    'delete_team',
    'manage_roles',
    'view_settings',
    'edit_settings',
    'edit_branding',
    'view_billing',
    'view_invoices',
    'create_invoices',
  ],
  admin: [
    'view_team',
    'create_team',
    'edit_team',
    'delete_team',
    'manage_roles',
    'view_settings',
    'edit_settings',
    'edit_branding',
    'view_billing',
    'view_invoices',
    'create_invoices',
  ],
  inspector: ['view_team'],
  viewer: ['view_team', 'view_invoices'],
  member: ['view_team', 'view_invoices'],
};

function isPermission(value: string): value is Permission {
  return (
    value === 'view_team' ||
    value === 'create_team' ||
    value === 'edit_team' ||
    value === 'delete_team' ||
    value === 'manage_roles' ||
    value === 'view_settings' ||
    value === 'edit_settings' ||
    value === 'edit_branding' ||
    value === 'view_billing' ||
    value === 'view_invoices' ||
    value === 'create_invoices'
  );
}

type RouteCtx<P> = { params: Promise<P> | P };
type AuthHandler<P = Record<string, string>> = (ctx: AuthContext & { params: P }) => Promise<Response>;

export function withAuth<P = Record<string, string>>(handler: AuthHandler<P>) {
  return async (request: NextRequest, routeCtx?: RouteCtx<P>): Promise<Response> => {
    const route = request.nextUrl.pathname;
    const method = request.method;
    const ip = getRequestIp(request);

    const audit = (
      statusCode: 200 | 401 | 402 | 403 | 429,
      type: 'auth_success' | 'auth_failure' | 'authz_denied' | 'billing_denied' | 'rate_limited',
      reason: string,
      options?: { userId?: string; tenantId?: string; authType?: 'user' | 'api_key'; requestId?: string }
    ) => {
      recordAuthAuditEvent({
        type,
        statusCode,
        route,
        method,
        ip,
        userId: options?.userId,
        tenantId: options?.tenantId,
        authType: options?.authType,
        requestId: options?.requestId,
        reason,
      });
    };

    try {
      const serviceClient = createServiceClient();
      const apiKey = getBusinessApiKey(request);
      let accessToken = getAccessToken(request);
      if (!accessToken) {
        const { refreshToken } = readSessionTokensFromCookies(request);
        if (refreshToken) {
          const anonClient = createAnonClient();
          const { data: refreshed } = await anonClient.auth.refreshSession({ refresh_token: refreshToken });
          accessToken = refreshed.session?.access_token ?? null;
        }
      }
      const businessIdentifier = request.nextUrl.searchParams.get('business');

      let supabase: SupabaseClient;
      let tenant: { id: string; name: string; slug: string; business_id?: string } | null = null;
      let memberRole: TenantMemberRole | undefined;
      let memberPermissions: Permission[] = [];
      let user: { userId: string; email?: string } = { userId: 'api-key' };
      let authType: 'user' | 'api_key' = 'api_key';

      if (accessToken) {
        const tokenUser = getUserFromToken(accessToken);
        if (!tokenUser) {
          audit(401, 'auth_failure', 'invalid_access_token');
          return unauthorized('Invalid access token', { logContext: { route, method, ip } });
        }

        supabase = createUserClient(accessToken);
        const tenantResult = await resolveTenant(serviceClient, tokenUser.userId, businessIdentifier);
        tenant = tenantResult.tenant;
        memberRole = tenantResult.role;

        if (tenantResult.error || !tenant) {
          const isolationViolation = tenantResult.error?.message?.includes("Tenant isolation violation");
          if (isolationViolation) {
            audit(403, 'authz_denied', 'tenant_isolation_violation', { userId: tokenUser.userId });
            return badRequest('Account is linked to multiple businesses. Contact support to resolve membership.');
          }
          audit(401, 'auth_failure', 'tenant_membership_missing', { userId: tokenUser.userId });
          return unauthorized('Business membership not found', { logContext: { route, method, ip, userId: tokenUser.userId } });
        }
        if (!memberRole) {
          audit(401, 'auth_failure', 'tenant_role_missing', { userId: tokenUser.userId, tenantId: tenant.id });
          return unauthorized('Business role not found', { logContext: { route, method, ip, userId: tokenUser.userId, tenantId: tenant.id } });
        }
        const { data: profile, error: profileError } = await serviceClient
          .from('profiles')
          .select('custom_permissions')
          .eq('id', tokenUser.userId)
          .maybeSingle();
        if (profileError) {
          return serverError('Failed to load permission profile', profileError, {
            logContext: { route, method, ip, userId: tokenUser.userId, tenantId: tenant.id },
          });
        }

        const rolePermissions = ROLE_PERMISSIONS[memberRole] ?? [];
        const customPermissions = Array.isArray((profile as { custom_permissions?: unknown[] } | null)?.custom_permissions)
          ? (profile as { custom_permissions: unknown[] }).custom_permissions
              .filter((value): value is string => typeof value === 'string')
              .filter(isPermission)
          : [];
        memberPermissions = Array.from(new Set([...rolePermissions, ...customPermissions]));
        user = tokenUser;
        authType = 'user';
      } else if (apiKey) {
        const keyResult = await resolveBusinessByApiKey(serviceClient, apiKey);
        if (!keyResult.key) {
          audit(401, 'auth_failure', 'invalid_api_key', { authType: 'api_key' });
          return unauthorized('Invalid API key', { logContext: { route, method, ip, authType: 'api_key' } });
        }
        tenant = keyResult.key.tenant;

        if (businessIdentifier) {
          const normalized = businessIdentifier.trim().toLowerCase();
          const slug = tenant.slug.toLowerCase();
          const businessId = tenant.business_id?.toLowerCase();
          if (normalized !== slug && normalized !== businessId) {
            audit(401, 'auth_failure', 'business_mismatch_for_api_key', { tenantId: tenant.id, authType: 'api_key' });
            return badRequest('Business not found');
          }
        }

        // API keys are owner-scoped by default in v1.
        memberRole = 'owner';
        memberPermissions = ROLE_PERMISSIONS.owner;
        supabase = serviceClient;
      } else {
        audit(401, 'auth_failure', 'missing_access_token');
        return unauthorized('Missing access token', { logContext: { route, method, ip } });
      }

      const billingAccess = await verifyBusinessBillingAccessByTenantId(serviceClient, tenant.id);
      if (billingAccess.error) {
        return serverError('Failed to verify business billing status', billingAccess.error, {
          logContext: { route, method, ip, userId: user.userId, tenantId: tenant.id, authType },
        });
      }
      if (!billingAccess.allowed) {
        audit(402, 'billing_denied', 'subscription_unpaid', {
          userId: user.userId,
          tenantId: tenant.id,
          authType,
        });
        return paymentRequired('Business subscription is unpaid. Access is disabled until payment is received.');
      }

      const params = routeCtx?.params
        ? routeCtx.params instanceof Promise
          ? await routeCtx.params
          : routeCtx.params
        : ({} as P);

      const response = await handler({
        supabase,
        serviceClient,
        tenant,
        business: tenant,
        user,
        memberRole,
        memberPermissions,
        request,
        params,
        authType,
      });

      if (response.status < 400) {
        audit(200, 'auth_success', 'authorized_request', { userId: user.userId, tenantId: tenant.id, authType });
      } else if (response.status === 403) {
        audit(403, 'authz_denied', 'forbidden_response', { userId: user.userId, tenantId: tenant.id, authType });
      }

      return response;
    } catch (error) {
      return serverError('Internal server error', error, { logContext: { route, method, ip } });
    }
  };
}

export function requireRoles(memberRole: TenantMemberRole, allowedRoles: TenantMemberRole[], message = 'Insufficient permissions'): Response | null {
  if (allowedRoles.includes(memberRole)) {
    return null;
  }
  return forbidden(message);
}

export function hasPermission(
  memberRole: TenantMemberRole,
  permission: Permission,
  memberPermissions?: Permission[]
): boolean {
  const permissions = memberPermissions && memberPermissions.length > 0 ? memberPermissions : ROLE_PERMISSIONS[memberRole] ?? [];
  return permissions.includes(permission);
}

export function requirePermission(
  memberRole: TenantMemberRole,
  permission: Permission,
  message = 'Insufficient permissions',
  memberPermissions?: Permission[]
): Response | null {
  if (hasPermission(memberRole, permission, memberPermissions)) {
    return null;
  }
  return forbidden(message);
}
