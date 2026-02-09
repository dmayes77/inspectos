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
import { createEmailTemplateSchema } from '@inspectos/shared/validations/email-template';

/**
 * GET /api/admin/email-templates
 */
export async function GET(request: NextRequest) {
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
      .select('id, name, subject, body, category, description, is_system')
      .eq('tenant_id', tenant.id)
      .order('name');

    if (error) {
      return serverError('Failed to fetch email templates', error);
    }

    return success(
      (data ?? []).map((template: { id: string; name: string; subject: string; body: string; category: string | null; description: string | null; is_system: boolean }) => ({
        id: template.id,
        name: template.name,
        subject: template.subject,
        body: template.body,
        category: template.category ?? null,
        description: template.description ?? null,
        isSystem: template.is_system,
      }))
    );
  } catch (error) {
    return serverError('Failed to fetch email templates', error);
  }
}

/**
 * POST /api/admin/email-templates
 */
export async function POST(request: Request) {
  try {
    const accessToken = getAccessToken(request as NextRequest);
    if (!accessToken) {
      return unauthorized('Missing access token');
    }

    const user = getUserFromToken(accessToken);
    if (!user) {
      return unauthorized('Invalid access token');
    }

    const validation = await validateRequestBody(request, createEmailTemplateSchema);
    if (validation.error) {
      return validation.error;
    }
    const payload = validation.data;

    const tenantSlug = (request as NextRequest).nextUrl?.searchParams.get('tenant');
    const supabase = createUserClient(accessToken);
    const { tenant, error: tenantError } = await resolveTenant(supabase, user.userId, tenantSlug);
    if (tenantError || !tenant) {
      return badRequest('Tenant not found');
    }

    const { data, error } = await supabase
      .from('email_templates')
      .insert({
        tenant_id: tenant.id,
        name: payload.name,
        subject: payload.subject,
        body: payload.body,
        category: payload.category ?? null,
        description: payload.description ?? null,
        is_system: false,
      })
      .select('id, name, subject, body, category, description, is_system')
      .single();

    if (error || !data) {
      return serverError(error?.message ?? 'Failed to create email template.', error);
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
    return serverError('Failed to create email template', error);
  }
}
