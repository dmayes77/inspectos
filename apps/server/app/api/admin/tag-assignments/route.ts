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
import {
  createTagAssignmentSchema,
  tagAssignmentDeleteSchema,
  tagAssignmentQuerySchema,
} from '@/lib/validations/tag-assignment';

const formatValidationErrors = (issues: { path: PropertyKey[]; message: string }[]) =>
  issues.map((issue: { path: PropertyKey[]; message: string }) => ({
    field: issue.path.map(String).join('.'),
    message: issue.message,
  }));

/**
 * GET /api/admin/tag-assignments
 * Query params: scope, entityId
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

    const scope = request.nextUrl.searchParams.get('scope');
    const entityId = request.nextUrl.searchParams.get('entityId');
    const queryValidation = tagAssignmentQuerySchema.safeParse({ scope, entityId });

    if (!queryValidation.success) {
      return badRequest('Validation failed', { details: formatValidationErrors(queryValidation.error.issues) });
    }
    const { scope: validatedScope, entityId: validatedEntityId } = queryValidation.data;

    const tenantSlug = request.nextUrl.searchParams.get('tenant');
    const supabase = createUserClient(accessToken);
    const { tenant, error: tenantError } = await resolveTenant(supabase, user.userId, tenantSlug);
    if (tenantError || !tenant) {
      return badRequest('Tenant not found');
    }

    const { data, error } = await supabase
      .from('tag_assignments')
      .select('tag_id')
      .eq('tenant_id', tenant.id)
      .eq('scope', validatedScope)
      .eq('entity_id', validatedEntityId);

    if (error) {
      return serverError('Failed to fetch tag assignments', error);
    }

    return success({ tagIds: (data ?? []).map((row: { tag_id: string }) => row.tag_id) });
  } catch (error) {
    return serverError('Failed to fetch tag assignments', error);
  }
}

/**
 * POST /api/admin/tag-assignments
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

    const validation = await validateRequestBody(request, createTagAssignmentSchema);
    if (validation.error) {
      return validation.error;
    }
    const { scope, entityId, tagId } = validation.data;

    const tenantSlug = (request as NextRequest).nextUrl?.searchParams.get('tenant');
    const supabase = createUserClient(accessToken);
    const { tenant, error: tenantError } = await resolveTenant(supabase, user.userId, tenantSlug);
    if (tenantError || !tenant) {
      return badRequest('Tenant not found');
    }

    // Verify tag exists and scope matches
    const { data: tagRow } = await supabase
      .from('tags')
      .select('id, scope')
      .eq('tenant_id', tenant.id)
      .eq('id', tagId)
      .maybeSingle();

    if (!tagRow) {
      return badRequest('Tag not found for tenant.');
    }

    if (tagRow.scope !== scope) {
      return badRequest('Tag scope does not match entity scope.');
    }

    const { data, error } = await supabase
      .from('tag_assignments')
      .insert({
        tenant_id: tenant.id,
        scope,
        entity_id: entityId,
        tag_id: tagId,
      })
      .select('id, tag_id')
      .single();

    if (error || !data) {
      return serverError(error?.message ?? 'Failed to assign tag.', error);
    }

    // TODO: Trigger workflows for tag_added event
    // await runWorkflowsForTagChange({ tenantId: tenant.id, scope, entityId, tagId, triggerType: 'tag_added' });

    return success({ id: data.id, tagId: data.tag_id });
  } catch (error) {
    return serverError('Failed to assign tag', error);
  }
}

/**
 * DELETE /api/admin/tag-assignments
 * Query params: scope, entityId, tagId
 */
export async function DELETE(request: NextRequest) {
  try {
    const accessToken = getAccessToken(request);
    if (!accessToken) {
      return unauthorized('Missing access token');
    }

    const user = getUserFromToken(accessToken);
    if (!user) {
      return unauthorized('Invalid access token');
    }

    const scope = request.nextUrl.searchParams.get('scope');
    const entityId = request.nextUrl.searchParams.get('entityId');
    const tagId = request.nextUrl.searchParams.get('tagId');
    const queryValidation = tagAssignmentDeleteSchema.safeParse({ scope, entityId, tagId });

    if (!queryValidation.success) {
      return badRequest('Validation failed', { details: formatValidationErrors(queryValidation.error.issues) });
    }
    const { scope: validatedScope, entityId: validatedEntityId, tagId: validatedTagId } = queryValidation.data;

    const tenantSlug = request.nextUrl.searchParams.get('tenant');
    const supabase = createUserClient(accessToken);
    const { tenant, error: tenantError } = await resolveTenant(supabase, user.userId, tenantSlug);
    if (tenantError || !tenant) {
      return badRequest('Tenant not found');
    }

    // Verify tag exists and scope matches
    const { data: tagRow } = await supabase
      .from('tags')
      .select('id, scope')
      .eq('tenant_id', tenant.id)
      .eq('id', validatedTagId)
      .maybeSingle();

    if (!tagRow) {
      return badRequest('Tag not found for tenant.');
    }

    if (tagRow.scope !== validatedScope) {
      return badRequest('Tag scope does not match entity scope.');
    }

    const { error } = await supabase
      .from('tag_assignments')
      .delete()
      .eq('tenant_id', tenant.id)
      .eq('scope', validatedScope)
      .eq('entity_id', validatedEntityId)
      .eq('tag_id', validatedTagId);

    if (error) {
      return serverError(error.message ?? 'Failed to delete tag assignment.', error);
    }

    // TODO: Trigger workflows for tag_removed event
    // await runWorkflowsForTagChange({ tenantId: tenant.id, scope: validatedScope, entityId: validatedEntityId, tagId: validatedTagId, triggerType: 'tag_removed' });

    return success(true);
  } catch (error) {
    return serverError('Failed to delete tag assignment', error);
  }
}
