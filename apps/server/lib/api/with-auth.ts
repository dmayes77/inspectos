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
  serverError,
} from '@/lib/supabase';
import { resolveTenant } from '@/lib/tenants';

export interface AuthContext {
  supabase: SupabaseClient;
  serviceClient: SupabaseClient;
  tenant: { id: string; name: string; slug: string };
  user: { userId: string; email?: string };
  request: NextRequest;
}

type RouteCtx<P> = { params: Promise<P> | P };
type AuthHandler<P = Record<string, string>> = (ctx: AuthContext & { params: P }) => Promise<Response>;

export function withAuth<P = Record<string, string>>(handler: AuthHandler<P>) {
  return async (request: NextRequest, routeCtx?: RouteCtx<P>): Promise<Response> => {
    try {
      const accessToken = getAccessToken(request);
      if (!accessToken) return unauthorized('Missing access token');

      const user = getUserFromToken(accessToken);
      if (!user) return unauthorized('Invalid access token');

      const tenantSlug = request.nextUrl.searchParams.get('tenant');
      const supabase = createUserClient(accessToken);
      const serviceClient = createServiceClient();
      const { tenant, error: tenantError } = await resolveTenant(serviceClient, user.userId, tenantSlug);
      if (tenantError || !tenant) return badRequest('Tenant not found');

      const params = routeCtx?.params
        ? routeCtx.params instanceof Promise
          ? await routeCtx.params
          : routeCtx.params
        : ({} as P);

      return await handler({ supabase, serviceClient, tenant, user, request, params });
    } catch (error) {
      return serverError('Internal server error', error);
    }
  };
}
