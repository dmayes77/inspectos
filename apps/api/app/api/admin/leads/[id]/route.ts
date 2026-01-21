import { NextRequest } from 'next/server';
import {
  createUserClient,
  getAccessToken,
  getUserFromToken,
  unauthorized,
  notFound,
  serverError,
  success
} from '@/lib/supabase';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/admin/leads/[id]
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
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
    const { data: lead, error } = await supabase
      .from('leads')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return notFound('Lead not found');
      }
      return serverError('Failed to fetch lead', error);
    }

    return success({
      leadId: lead.id,
      name: lead.name,
      email: lead.email || '',
      phone: lead.phone || '',
      stage: lead.stage,
      source: lead.source || '',
      notes: lead.notes || '',
      serviceName: '',
      requestedDate: '',
      estimatedValue: 0
    });
  } catch (error) {
    return serverError('Failed to fetch lead', error);
  }
}

/**
 * PUT /api/admin/leads/[id]
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
    const { name, email, phone, stage, source, notes } = body;

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email || null;
    if (phone !== undefined) updateData.phone = phone || null;
    if (stage !== undefined) updateData.stage = stage;
    if (source !== undefined) updateData.source = source || null;
    if (notes !== undefined) updateData.notes = notes || null;

    const supabase = createUserClient(accessToken);
    const { data: lead, error } = await supabase
      .from('leads')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return notFound('Lead not found');
      }
      return serverError('Failed to update lead', error);
    }

    if (!lead) {
      return notFound('Lead not found');
    }

    return success({
      leadId: lead.id,
      name: lead.name,
      email: lead.email || '',
      phone: lead.phone || '',
      stage: lead.stage,
      source: lead.source || '',
      notes: lead.notes || '',
      serviceName: '',
      requestedDate: '',
      estimatedValue: 0
    });
  } catch (error) {
    return serverError('Failed to update lead', error);
  }
}

/**
 * DELETE /api/admin/leads/[id]
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
      .from('leads')
      .delete()
      .eq('id', id);

    if (error) {
      return serverError('Failed to delete lead', error);
    }

    return success(true);
  } catch (error) {
    return serverError('Failed to delete lead', error);
  }
}
