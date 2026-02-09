import { NextRequest } from 'next/server';
import {
  createUserClient,
  getAccessToken,
  getUserFromToken,
  unauthorized,
  badRequest,
  serverError,
  success
} from '@/lib/supabase';
import { resolveTenant } from '@/lib/tenants';

function mapRoleToDb(role: string | null | undefined) {
  switch ((role ?? '').toUpperCase()) {
    case 'OWNER':
      return 'owner';
    case 'ADMIN':
      return 'admin';
    case 'INSPECTOR':
      return 'inspector';
    case 'OFFICE_STAFF':
      return 'viewer';
    default:
      return null;
  }
}

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * PUT /api/admin/team/[id]
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  try {
    const accessToken = getAccessToken(request);
    if (!accessToken) {
      return unauthorized('Missing access token');
    }

    const user = getUserFromToken(accessToken);
    if (!user) {
      return unauthorized('Invalid access token');
    }

    const memberId = id?.trim?.() ?? '';
    const isValidId = /^[0-9a-fA-F-]{36}$/.test(memberId);
    if (!isValidId) {
      return badRequest('Invalid team member id');
    }

    const body = await request.json();
    const { name, avatarUrl, role: rawRole, email: rawEmail, phone, tenant_slug } = body;

    const tenantSlug = tenant_slug || request.nextUrl.searchParams.get('tenant');
    const supabase = createUserClient(accessToken);
    const { tenant, error: tenantError } = await resolveTenant(supabase, user.userId, tenantSlug);
    if (tenantError || !tenant) {
      return badRequest('Tenant not found');
    }

    const fullName = typeof name === 'string' ? name.trim() : undefined;
    const avatar = typeof avatarUrl === 'string' ? avatarUrl : undefined;
    const role = mapRoleToDb(rawRole);
    const email = typeof rawEmail === 'string' ? rawEmail.trim().toLowerCase() : undefined;
    const phoneNumber = typeof phone === 'string' ? phone.trim() : undefined;

    const profileUpdate: Record<string, string> = {};
    if (fullName) profileUpdate.full_name = fullName;
    if (avatar) profileUpdate.avatar_url = avatar;
    if (email) profileUpdate.email = email;
    if (phoneNumber) profileUpdate.phone = phoneNumber;

    if (Object.keys(profileUpdate).length > 0) {
      const { error: profileError } = await supabase
        .from('profiles')
        .update(profileUpdate)
        .eq('id', memberId);

      if (profileError) {
        return serverError('Failed to update profile', profileError);
      }
    }

    if (role) {
      const { error: memberError } = await supabase
        .from('tenant_members')
        .update({ role })
        .eq('tenant_id', tenant.id)
        .eq('user_id', memberId);

      if (memberError) {
        return serverError('Failed to update team member role', memberError);
      }
    }

    return success({ success: true });
  } catch (error) {
    return serverError('Failed to update team member', error);
  }
}

/**
 * DELETE /api/admin/team/[id]
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  try {
    const accessToken = getAccessToken(request);
    if (!accessToken) {
      return unauthorized('Missing access token');
    }

    const user = getUserFromToken(accessToken);
    if (!user) {
      return unauthorized('Invalid access token');
    }

    const memberId = id?.trim?.() ?? '';
    const isValidId = /^[0-9a-fA-F-]{36}$/.test(memberId);
    if (!isValidId) {
      return badRequest('Invalid team member id');
    }

    const tenantSlug = request.nextUrl.searchParams.get('tenant');
    const supabase = createUserClient(accessToken);
    const { tenant, error: tenantError } = await resolveTenant(supabase, user.userId, tenantSlug);
    if (tenantError || !tenant) {
      return badRequest('Tenant not found');
    }

    const { error } = await supabase
      .from('tenant_members')
      .delete()
      .eq('tenant_id', tenant.id)
      .eq('user_id', memberId);

    if (error) {
      return serverError('Failed to delete team member', error);
    }

    return success({ success: true });
  } catch (error) {
    return serverError('Failed to delete team member', error);
  }
}
