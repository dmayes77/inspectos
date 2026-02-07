import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getTenantId } from "@/lib/supabase/admin-helpers";

/**
 * GET /api/admin/inspections
 *
 * Query params:
 * - status: filter by status (optional)
 */
export async function GET(request: NextRequest) {
  try {
    const tenantId = getTenantId();
    const status = request.nextUrl.searchParams.get('status');

    let query = supabaseAdmin
      .from('inspections')
      .select(`
        *,
        order:orders(
          id,
          scheduled_date,
          status,
          property:properties(
            id,
            address_line1,
            address_line2,
            city,
            state,
            zip_code
          ),
          client:clients(
            id,
            name,
            email,
            phone,
            company
          ),
          inspector:profiles!orders_inspector_id_fkey(
            id,
            full_name,
            email,
            avatar_url
          )
        )
      `)
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data: inspections, error } = await query;
    if (error) {
      console.error('[GET /api/admin/inspections] Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch inspections', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(inspections || []);
  } catch (error) {
    console.error('[GET /api/admin/inspections] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch inspections' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/inspections
 */
export async function POST(request: NextRequest) {
  try {
    const tenantId = getTenantId();
    const body = await request.json();
    const {
      order_id,
      order_schedule_id,
      template_id,
      template_version,
      status,
      started_at,
      completed_at,
      weather_conditions,
      temperature,
      present_parties,
      notes,
      selected_type_ids
    } = body;

    if (!order_id || !template_id) {
      return NextResponse.json(
        { error: 'Missing required fields: order_id, template_id' },
        { status: 400 }
      );
    }

    const { data: inspection, error } = await supabaseAdmin
      .from('inspections')
      .insert({
        tenant_id: tenantId,
        order_id,
        order_schedule_id: order_schedule_id || null,
        template_id,
        template_version: template_version || 1,
        status: status || 'draft',
        started_at: started_at || null,
        completed_at: completed_at || null,
        weather_conditions: weather_conditions || null,
        temperature: temperature || null,
        present_parties: present_parties || null,
        notes: notes || null,
        selected_type_ids: selected_type_ids || []
      })
      .select('*')
      .single();

    if (error || !inspection) {
      console.error('[POST /api/admin/inspections] Database error:', error);
      return NextResponse.json(
        { error: 'Failed to create inspection', details: error?.message },
        { status: 500 }
      );
    }

    return NextResponse.json(inspection);
  } catch (error) {
    console.error('[POST /api/admin/inspections] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Failed to create inspection' },
      { status: 500 }
    );
  }
}
