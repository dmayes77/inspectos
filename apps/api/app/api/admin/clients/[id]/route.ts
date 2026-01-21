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
 * GET /api/admin/clients/[id]
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
    const { data: client, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return notFound('Client not found');
      }
      return serverError('Failed to fetch client', error);
    }

    return success({
      clientId: client.id,
      name: client.name,
      email: client.email || '',
      phone: client.phone || '',
      type: client.company ? 'Real Estate Agent' : 'Homebuyer',
      inspections: 0,
      lastInspection: '—',
      totalSpent: 0
    });
  } catch (error) {
    return serverError('Failed to fetch client', error);
  }
}

/**
 * PUT /api/admin/clients/[id]
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
    const { name, email, phone, company, notes } = body;

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email || null;
    if (phone !== undefined) updateData.phone = phone || null;
    if (company !== undefined) updateData.company = company || null;
    if (notes !== undefined) updateData.notes = notes || null;

    const supabase = createUserClient(accessToken);
    const { data: client, error } = await supabase
      .from('clients')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return notFound('Client not found');
      }
      return serverError('Failed to update client', error);
    }

    if (!client) {
      return notFound('Client not found');
    }

    return success({
      clientId: client.id,
      name: client.name,
      email: client.email || '',
      phone: client.phone || '',
      type: client.company ? 'Real Estate Agent' : 'Homebuyer',
      inspections: 0,
      lastInspection: '—',
      totalSpent: 0
    });
  } catch (error) {
    return serverError('Failed to update client', error);
  }
}

/**
 * DELETE /api/admin/clients/[id]
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
      .from('clients')
      .delete()
      .eq('id', id);

    if (error) {
      return serverError('Failed to delete client', error);
    }

    return success(true);
  } catch (error) {
    return serverError('Failed to delete client', error);
  }
}
