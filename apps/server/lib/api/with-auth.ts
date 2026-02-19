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
  createServiceClient,
  getAccessToken,
  getUserFromToken,
  unauthorized,
  badRequest,
  forbidden,
  serverError,
} from '@/lib/supabase';
import { resolveTenant, type TenantMemberRole } from '@/lib/tenants';
import { getBusinessApiKey, resolveBusinessByApiKey } from '@/lib/api/business-api-keys';

export interface AuthContext {
  supabase: SupabaseClient;
  serviceClient: SupabaseClient;
  tenant: { id: string; name: string; slug: string; business_id?: string };
  business: { id: string; name: string; slug: string; business_id?: string };
  user: { userId: string; email?: string };
  memberRole: TenantMemberRole;
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

type RouteCtx<P> = { params: Promise<P> | P };
type AuthHandler<P = Record<string, string>> = (ctx: AuthContext & { params: P }) => Promise<Response>;

export function withAuth<P = Record<string, string>>(handler: AuthHandler<P>) {
  return async (request: NextRequest, routeCtx?: RouteCtx<P>): Promise<Response> => {
    try {
      const serviceClient = createServiceClient();
      const apiKey = getBusinessApiKey(request);
      const accessToken = getAccessToken(request);
      const businessIdentifier = request.nextUrl.searchParams.get('business');

      let supabase: SupabaseClient;
      let tenant: { id: string; name: string; slug: string; business_id?: string } | null = null;
      let memberRole: TenantMemberRole | undefined;
      let user: { userId: string; email?: string } = { userId: 'api-key' };
      let authType: 'user' | 'api_key' = 'api_key';

      if (accessToken) {
        const tokenUser = getUserFromToken(accessToken);
        if (!tokenUser) return unauthorized('Invalid access token');

        supabase = createUserClient(accessToken);
        let tenantResult = await resolveTenant(serviceClient, tokenUser.userId, businessIdentifier);
        tenant = tenantResult.tenant;
        memberRole = tenantResult.role;

        // If explicit business scoping fails, fall back to the user's default tenant.
        // This protects admin pages from hard-failing when stale env/config points at
        // a business the current user can no longer access.
        if ((!tenant || !memberRole) && businessIdentifier) {
          tenantResult = await resolveTenant(serviceClient, tokenUser.userId, null);
          tenant = tenantResult.tenant;
          memberRole = tenantResult.role;
        }

        if (tenantResult.error || !tenant) return badRequest('Business not found');
        if (!memberRole) return badRequest('Business role not found');
        user = tokenUser;
        authType = 'user';
      } else if (apiKey) {
        const keyResult = await resolveBusinessByApiKey(serviceClient, apiKey);
        if (!keyResult.key) return unauthorized('Invalid API key');
        tenant = keyResult.key.tenant;

        if (businessIdentifier) {
          const normalized = businessIdentifier.trim().toLowerCase();
          const slug = tenant.slug.toLowerCase();
          const businessId = tenant.business_id?.toLowerCase();
          if (normalized !== slug && normalized !== businessId) {
            return badRequest('Business not found');
          }
        }

        // API keys are owner-scoped by default in v1.
        memberRole = 'owner';
        supabase = serviceClient;
      } else {
        return unauthorized('Missing access token');
      }

      const params = routeCtx?.params
        ? routeCtx.params instanceof Promise
          ? await routeCtx.params
          : routeCtx.params
        : ({} as P);

      return await handler({ supabase, serviceClient, tenant, business: tenant, user, memberRole, request, params, authType });
    } catch (error) {
      return serverError('Internal server error', error);
    }
  };
}

export function requireRoles(memberRole: TenantMemberRole, allowedRoles: TenantMemberRole[], message = 'Insufficient permissions'): Response | null {
  if (allowedRoles.includes(memberRole)) {
    return null;
  }
  return forbidden(message);
}

export function hasPermission(memberRole: TenantMemberRole, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[memberRole] ?? [];
  return permissions.includes(permission);
}

export function requirePermission(memberRole: TenantMemberRole, permission: Permission, message = 'Insufficient permissions'): Response | null {
  if (hasPermission(memberRole, permission)) {
    return null;
  }
  return forbidden(message);
}
