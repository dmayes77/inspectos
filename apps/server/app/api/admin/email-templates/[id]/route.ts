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
import { validateRequestBody } from '@/lib/api/validate';
import { updateEmailTemplateSchema } from '@inspectos/shared/validations/email-template';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * PUT /api/admin/email-templates/[id]
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

    const validation = await validateRequestBody(request, updateEmailTemplateSchema);
    if (validation.error) {
      return validation.error;
    }
    const payload = validation.data;

    const tenantSlug = request.nextUrl.searchParams.get('tenant');
    const supabase = createUserClient(accessToken);
    const { tenant, error: tenantError } = await resolveTenant(supabase, user.userId, tenantSlug);
    if (tenantError || !tenant) {
      return badRequest('Tenant not found');
    }

    const updateData: Record<string, string | null> = {};
    if (payload.name !== undefined) updateData.name = payload.name;
    if (payload.subject !== undefined) updateData.subject = payload.subject;
    if (payload.body !== undefined) updateData.body = payload.body;
    if (payload.category !== undefined) updateData.category = payload.category ?? null;
    if (payload.description !== undefined) updateData.description = payload.description ?? null;

    const { data, error } = await supabase
      .from('email_templates')
      .update(updateData)
      .eq('tenant_id', tenant.id)
      .eq('id', id)
      .select('id, name, subject, body, category, description, is_system')
      .single();

    if (error || !data) {
      return serverError(error?.message ?? 'Failed to update email template.', error);
    }

    return success({
      id: data.id,
      name: data.name,
      subject: data.subject,
      body: data.body,
      category: data.category ?? null,
      description: data.description ?? null,
      isSystem: data.is_system,
    });
  } catch (error) {
    return serverError('Failed to update email template', error);
  }
}

/**
 * DELETE /api/admin/email-templates/[id]
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

    const tenantSlug = request.nextUrl.searchParams.get('tenant');
    const supabase = createUserClient(accessToken);
    const { tenant, error: tenantError } = await resolveTenant(supabase, user.userId, tenantSlug);
    if (tenantError || !tenant) {
      return badRequest('Tenant not found');
    }

    const { data, error } = await supabase
      .from('email_templates')
      .delete()
      .eq('tenant_id', tenant.id)
      .eq('id', id)
      .select('id')
      .single();

    if (error || !data) {
      return serverError(error?.message ?? 'Failed to delete email template.', error);
    }

    return success(true);
  } catch (error) {
    return serverError('Failed to delete email template', error);
  }
}
