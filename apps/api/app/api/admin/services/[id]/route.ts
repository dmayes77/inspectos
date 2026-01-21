import { NextRequest } from 'next/server';
import {
  createUserClient,
  getAccessToken,
  getUserFromToken,
  unauthorized,
  badRequest,
  notFound,
  serverError,
  success
} from '@/lib/supabase';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * PUT /api/admin/services/[id]
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

    const body = await request.json();
    const { name, description, category, price, durationMinutes, templateId, status } = body;

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description || null;
    if (category !== undefined) updateData.category = category;
    if (price !== undefined) updateData.price = price ?? null;
    if (durationMinutes !== undefined) updateData.duration_minutes = durationMinutes ?? null;
    if (templateId !== undefined) updateData.template_id = templateId ?? null;
    if (status !== undefined) updateData.is_active = status === 'active';

    const supabase = createUserClient(accessToken);
    const { data: service, error } = await supabase
      .from('services')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return notFound('Service not found');
      }
      return serverError('Failed to update service', error);
    }

    if (!service) {
      return notFound('Service not found');
    }

    return success({
      serviceId: service.id,
      name: service.name,
      price: service.price ?? undefined,
      durationMinutes: service.duration_minutes ?? undefined,
      templateId: service.template_id ?? null,
      description: service.description ?? undefined,
      category: service.category ?? undefined,
      status: service.is_active ? 'active' : 'inactive'
    });
  } catch (error) {
    return serverError('Failed to update service', error);
  }
}

/**
 * DELETE /api/admin/services/[id]
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

    const supabase = createUserClient(accessToken);
    const { error } = await supabase
      .from('services')
      .update({ is_active: false })
      .eq('id', id);

    if (error) {
      return serverError('Failed to archive service', error);
    }

    return success({ archived: true });
  } catch (error) {
    return serverError('Failed to archive service', error);
  }
}
