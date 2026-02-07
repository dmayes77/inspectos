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
import { resolveTenant } from '@/lib/tenants';
import { validateRequestBody } from '@/lib/api/validate';
import { updateOrderSchema } from '@/lib/validations/order';
import { format } from 'date-fns';
import { triggerWebhookEvent } from '@/lib/webhooks/delivery';
import {
  buildOrderUpdatedPayload,
  buildOrderCompletedPayload,
  buildOrderCancelledPayload,
  buildSchedulePayload
} from '@/lib/webhooks/payloads';

interface RouteParams {
  params: Promise<{ id: string }>;
}

const mapOrderStatusToScheduleStatus = (status?: string | null, scheduledDate?: string | null) => {
  switch (status) {
    case "scheduled":
      return "scheduled";
    case "in_progress":
      return "in_progress";
    case "pending_report":
    case "delivered":
    case "completed":
      return "completed";
    case "cancelled":
      return "cancelled";
    default:
      return scheduledDate ? "scheduled" : "pending";
  }
};

/**
 * GET /api/admin/orders/[id]
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

    const tenantSlug = request.nextUrl.searchParams.get('tenant');
    const supabase = createUserClient(accessToken);
    const { tenant, error: tenantError } = await resolveTenant(supabase, user.userId, tenantSlug);
    if (tenantError || !tenant) {
      return badRequest('Tenant not found');
    }

    const { data, error } = await supabase
      .from("orders")
      .select(
        `
        *,
        property:properties(
          id, address_line1, address_line2, city, state, zip_code, property_type,
          year_built, square_feet, bedrooms, bathrooms, stories, foundation, garage, pool,
          basement, lot_size_acres, heating_type, cooling_type, roof_type,
          building_class, loading_docks, zoning, occupancy_type, ceiling_height,
          number_of_units, unit_mix, laundry_type, parking_spaces, elevator
        ),
        client:clients(id, name, email, phone, company, notes),
        agent:agents(id, name, email, phone, license_number, agency:agencies(id, name, email, phone)),
        inspector:profiles(id, full_name, email, avatar_url),
        schedules:order_schedules(
          id, tenant_id, order_id, schedule_type, label, service_id, package_id,
          inspector_id, slot_date, slot_start, slot_end, duration_minutes, status, notes
        ),
        inspection:inspections(
          id, order_id, order_schedule_id, status, started_at, completed_at, weather_conditions, temperature, notes,
          services:inspection_services(
            id, service_id, name, status, price, duration_minutes, template_id, notes, sort_order, inspector_id, vendor_id,
            inspector:profiles!inspection_services_inspector_id_fkey(id, full_name, email, avatar_url),
            vendor:vendors!inspection_services_vendor_id_fkey(id, name, vendor_type, email, phone)
          ),
          assignments:inspection_assignments(
            id, role, assigned_at, unassigned_at,
            inspector:profiles(id, full_name, email, avatar_url)
          )
        ),
        invoices(id, status, total, issued_at, due_at)
      `,
      )
      .eq("tenant_id", tenant.id)
      .eq("id", id)
      .single();

    if (error || !data) {
      return notFound(error?.message ?? "Order not found.");
    }

    return success(data);
  } catch (error) {
    return serverError('Failed to fetch order', error);
  }
}

/**
 * PUT /api/admin/orders/[id]
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

    const validation = await validateRequestBody(request, updateOrderSchema);
    if (validation.error) {
      return validation.error;
    }
    const payload = validation.data;

    const tenantSlug = (payload as { tenant_slug?: string }).tenant_slug || request.nextUrl.searchParams.get('tenant');
    const supabase = createUserClient(accessToken);
    const { tenant, error: tenantError } = await resolveTenant(supabase, user.userId, tenantSlug);
    if (tenantError || !tenant) {
      return badRequest('Tenant not found');
    }

    // Fetch current order to track status changes
    const { data: currentOrder } = await supabase
      .from("orders")
      .select("status")
      .eq("tenant_id", tenant.id)
      .eq("id", id)
      .single();

    const previousStatus = currentOrder?.status;

    // Build update object with only provided fields
    const updateData: Record<string, unknown> = {};
    if (payload.client_id !== undefined) updateData.client_id = payload.client_id;
    if (payload.agent_id !== undefined) updateData.agent_id = payload.agent_id;
    if (payload.inspector_id !== undefined) updateData.inspector_id = payload.inspector_id;
    if (payload.property_id !== undefined) updateData.property_id = payload.property_id;
    if (payload.status !== undefined) updateData.status = payload.status;
    if (payload.scheduled_date !== undefined) updateData.scheduled_date = payload.scheduled_date;
    if (payload.scheduled_time !== undefined) updateData.scheduled_time = payload.scheduled_time;
    if (payload.duration_minutes !== undefined) updateData.duration_minutes = payload.duration_minutes;
    if (payload.services) {
      const subtotal = payload.services.reduce((sum: number, service: { price: number }) => sum + service.price, 0);
      const duration = payload.services.reduce((sum: number, service: { duration_minutes?: number }) => sum + (service.duration_minutes ?? 0), 0);
      if (payload.subtotal === undefined) updateData.subtotal = subtotal;
      if (payload.total === undefined) updateData.total = subtotal;
      if (payload.duration_minutes === undefined && duration > 0) {
        updateData.duration_minutes = duration;
      }
    }
    if (payload.subtotal !== undefined) updateData.subtotal = payload.subtotal;
    if (payload.discount !== undefined) updateData.discount = payload.discount;
    if (payload.tax !== undefined) updateData.tax = payload.tax;
    if (payload.total !== undefined) updateData.total = payload.total;
    if (payload.payment_status !== undefined) updateData.payment_status = payload.payment_status;
    if (payload.report_delivered_at !== undefined) updateData.report_delivered_at = payload.report_delivered_at;
    if (payload.source !== undefined) updateData.source = payload.source;
    if (payload.internal_notes !== undefined) updateData.internal_notes = payload.internal_notes;
    if (payload.client_notes !== undefined) updateData.client_notes = payload.client_notes;

    // Handle status transitions
    if (payload.status === "completed" && !updateData.completed_at) {
      updateData.completed_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from("orders")
      .update(updateData)
      .eq("tenant_id", tenant.id)
      .eq("id", id)
      .select(
        `
        *,
        property:properties(
          id, address_line1, address_line2, city, state, zip_code, property_type,
          year_built, square_feet, bedrooms, bathrooms, stories, foundation, garage, pool,
          basement, lot_size_acres, heating_type, cooling_type, roof_type,
          building_class, loading_docks, zoning, occupancy_type, ceiling_height,
          number_of_units, unit_mix, laundry_type, parking_spaces, elevator
        ),
        client:clients(id, name, email, phone),
        agent:agents(id, name, email, phone),
        inspector:profiles(id, full_name, email),
        schedules:order_schedules(
          id, tenant_id, order_id, schedule_type, label, service_id, package_id,
          inspector_id, slot_date, slot_start, slot_end, duration_minutes, status, notes
        ),
        inspection:inspections(
          id, order_id, order_schedule_id, status,
          services:inspection_services(
            id, service_id, name, status, price, duration_minutes, template_id, inspector_id, vendor_id,
            inspector:profiles!inspection_services_inspector_id_fkey(id, full_name, email, avatar_url),
            vendor:vendors!inspection_services_vendor_id_fkey(id, name, vendor_type, email, phone)
          ),
          assignments:inspection_assignments(
            id, role, assigned_at, unassigned_at,
            inspector:profiles(id, full_name, email, avatar_url)
          )
        )
      `,
      )
      .single();

    if (error || !data) {
      return serverError(error?.message ?? "Failed to update order.", error);
    }

    // Update inspection services if provided
    if (payload.services && Array.isArray(payload.services) && payload.services.length > 0) {
      // Get the inspection for this order
      const inspection = Array.isArray(data.inspection) ? data.inspection[0] : data.inspection;

      if (inspection?.id) {
        // For each service in the payload, update the corresponding inspection_service
        for (const service of payload.services) {
          // Find the existing inspection_service by matching service_id or name
          const existingService = inspection.services?.find(
            (s: { service_id: string | null; name: string }) =>
              (service.service_id && s.service_id === service.service_id) ||
              s.name === service.name
          );

          if (existingService?.id) {
            // Update the existing inspection_service with new assignments
            const updateData: { inspector_id?: string | null; vendor_id?: string | null } = {};
            if (service.inspector_id !== undefined) updateData.inspector_id = service.inspector_id;
            if (service.vendor_id !== undefined) updateData.vendor_id = service.vendor_id;

            if (Object.keys(updateData).length > 0) {
              await supabase
                .from("inspection_services")
                .update(updateData)
                .eq("id", existingService.id);
            }
          }
        }
      }
    }

    const propertyId = data.property_id;
    const assignedClientId = data.client?.id ?? data.client_id ?? null;
    if (propertyId && assignedClientId) {
      const ownerDate = format(new Date(), "yyyy-MM-dd");
      await supabase
        .from("property_owners")
        .update({ end_date: ownerDate, is_primary: false })
        .eq("tenant_id", tenant.id)
        .eq("property_id", propertyId)
        .is("end_date", null);

      await supabase.from("property_owners").insert({
        tenant_id: tenant.id,
        property_id: propertyId,
        client_id: assignedClientId,
        start_date: ownerDate,
        is_primary: true,
      });
    }

    let primarySchedule = Array.isArray(data.schedules) && data.schedules.length > 0 ? data.schedules[0] : null;
    let scheduleChanged = false;
    const shouldSyncSchedule =
      payload.scheduled_date !== undefined ||
      payload.scheduled_time !== undefined ||
      payload.duration_minutes !== undefined ||
      payload.inspector_id !== undefined ||
      payload.status !== undefined;

    if (shouldSyncSchedule) {
      const scheduleUpdate: Record<string, unknown> = {};
      if (payload.scheduled_date !== undefined) scheduleUpdate.slot_date = payload.scheduled_date;
      if (payload.scheduled_time !== undefined) scheduleUpdate.slot_start = payload.scheduled_time;
      if (payload.duration_minutes !== undefined) scheduleUpdate.duration_minutes = payload.duration_minutes;
      if (payload.inspector_id !== undefined) scheduleUpdate.inspector_id = payload.inspector_id;
      scheduleUpdate.status = mapOrderStatusToScheduleStatus(payload.status ?? data.status, payload.scheduled_date ?? data.scheduled_date ?? null);

      if (primarySchedule) {
        const { data: refreshedSchedule, error: scheduleUpdateError } = await supabase
          .from("order_schedules")
          .update(scheduleUpdate)
          .eq("id", primarySchedule.id)
          .select(
            "id, tenant_id, order_id, schedule_type, label, service_id, package_id, inspector_id, slot_date, slot_start, slot_end, duration_minutes, status, notes",
          )
          .single();
        if (scheduleUpdateError) {
          return serverError(scheduleUpdateError.message, scheduleUpdateError);
        }
        primarySchedule = refreshedSchedule ?? { ...primarySchedule, ...scheduleUpdate };
      } else {
        const { data: insertedSchedule, error: scheduleInsertError } = await supabase
          .from("order_schedules")
          .insert({
            tenant_id: tenant.id,
            order_id: data.id,
            schedule_type: "primary",
            label: payload.services?.[0]?.name ?? data.inspection?.services?.[0]?.name ?? "Primary Inspection",
            service_id: payload.services?.[0]?.service_id ?? data.inspection?.services?.[0]?.service_id ?? null,
            ...scheduleUpdate,
          })
          .select(
            "id, tenant_id, order_id, schedule_type, label, service_id, package_id, inspector_id, slot_date, slot_start, slot_end, duration_minutes, status, notes",
          )
          .single();
        if (scheduleInsertError) {
          return serverError(scheduleInsertError.message, scheduleInsertError);
        }
        primarySchedule = insertedSchedule ?? null;
      }

      if (primarySchedule && data.inspection?.id && !data.inspection.order_schedule_id) {
        await supabase.from("inspections").update({ order_schedule_id: primarySchedule.id }).eq("id", data.inspection.id);
        data.inspection.order_schedule_id = primarySchedule.id;
      }

      scheduleChanged = true;

      // Trigger schedule webhooks
      if (primarySchedule) {
        try {
          // Fetch complete schedule data with inspector details
          const { data: completeSchedule } = await supabase
            .from("order_schedules")
            .select(`
              id, order_id, schedule_type, label, slot_date, slot_start, slot_end,
              duration_minutes, status, created_at, updated_at,
              inspector:profiles(id, full_name, email)
            `)
            .eq("id", primarySchedule.id)
            .single();

          if (completeSchedule) {
            // Flatten inspector relation if it's an array
            const inspectorData = Array.isArray(completeSchedule.inspector)
              ? completeSchedule.inspector[0]
              : completeSchedule.inspector;

            const scheduleData = {
              ...completeSchedule,
              inspector: inspectorData || null
            };

            // Determine if this was a creation or update
            const wasJustCreated = !Array.isArray(data.schedules) || data.schedules.length === 0;

            if (wasJustCreated) {
              triggerWebhookEvent("schedule.created", tenant.id, buildSchedulePayload(scheduleData));
            } else {
              triggerWebhookEvent("schedule.updated", tenant.id, buildSchedulePayload(scheduleData));

              // Trigger schedule.cancelled if status changed to cancelled
              if (scheduleData.status === "cancelled") {
                triggerWebhookEvent("schedule.cancelled", tenant.id, buildSchedulePayload(scheduleData));
              }
            }
          }
        } catch (error) {
          console.error("Failed to trigger schedule webhook:", error);
        }
      }
    }

    if (scheduleChanged && primarySchedule) {
      const others = Array.isArray(data.schedules) ? data.schedules.filter((schedule: { id: string | null }) => schedule?.id !== primarySchedule.id) : [];
      data.schedules = [...others, primarySchedule];
    }

    if (payload.services) {
      let inspectionId = data.inspection?.id ?? null;
      if (!inspectionId) {
        const { data: createdInspection, error: inspectionError } = await supabase
          .from("inspections")
          .insert({
            tenant_id: tenant.id,
            order_id: data.id,
            order_schedule_id: primarySchedule?.id ?? null,
            template_id: payload.services[0]?.template_id ?? null,
            template_version: 1,
            status: "draft",
          })
          .select("id, order_schedule_id")
          .single();

        if (inspectionError || !createdInspection) {
          return serverError(inspectionError?.message ?? "Failed to create inspection.", inspectionError);
        }
        inspectionId = createdInspection.id;
        data.inspection = {
          ...(data.inspection ?? {}),
          id: inspectionId,
          order_schedule_id: createdInspection.order_schedule_id ?? primarySchedule?.id ?? null,
        } as typeof data.inspection;
      }

      await supabase.from("inspection_services").delete().eq("inspection_id", inspectionId);

      const inspectionServices = payload.services.map((service: any, index: number) => ({
        inspection_id: inspectionId,
        service_id: service.service_id,
        template_id: service.template_id ?? null,
        name: service.name,
        price: service.price,
        duration_minutes: service.duration_minutes ?? null,
        inspector_id: (service as { inspector_id?: string | null }).inspector_id ?? null,
        vendor_id: (service as { vendor_id?: string | null }).vendor_id ?? null,
        status: "pending" as const,
        sort_order: index,
      }));

      const { error: servicesError } = await supabase.from("inspection_services").insert(inspectionServices);

      if (servicesError) {
        return serverError(servicesError.message, servicesError);
      }
    }

    // Trigger webhooks based on what changed
    try {
      // Always trigger order.updated
      triggerWebhookEvent("order.updated", tenant.id, buildOrderUpdatedPayload(data));

      // Trigger status-specific events
      if (payload.status === "completed" && previousStatus !== "completed") {
        triggerWebhookEvent("order.completed", tenant.id, buildOrderCompletedPayload(data));
      }

      if (payload.status === "cancelled" && previousStatus !== "cancelled") {
        triggerWebhookEvent("order.cancelled", tenant.id, buildOrderCancelledPayload(data));
      }
    } catch (error) {
      // Log but don't fail the request
      console.error("Failed to trigger webhook:", error);
    }

    return success(data);
  } catch (error) {
    return serverError('Failed to update order', error);
  }
}

/**
 * DELETE /api/admin/orders/[id]
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

    // Check if order can be deleted (not completed or in_progress)
    const { data: order } = await supabase.from("orders").select("status").eq("tenant_id", tenant.id).eq("id", id).single();

    if (order && ["completed", "in_progress"].includes(order.status)) {
      return badRequest("Cannot delete an order that is in progress or completed.");
    }

    const { error } = await supabase.from("orders").delete().eq("tenant_id", tenant.id).eq("id", id);

    if (error) {
      return serverError('Failed to delete order', error);
    }

    return success(true);
  } catch (error) {
    return serverError('Failed to delete order', error);
  }
}
