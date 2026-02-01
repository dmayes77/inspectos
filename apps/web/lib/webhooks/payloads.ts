import type { Order } from "@/hooks/use-orders";

/**
 * Build payload for order.created event
 */
export function buildOrderCreatedPayload(order: Order) {
  return {
    order: {
      id: order.id,
      order_number: order.order_number,
      status: order.status,
      payment_status: order.payment_status,
      client: order.client
        ? {
            id: order.client.id,
            name: order.client.name,
            email: order.client.email,
            phone: order.client.phone,
          }
        : null,
      agent: order.agent
        ? {
            id: order.agent.id,
            name: order.agent.name,
            email: order.agent.email,
            phone: order.agent.phone,
          }
        : null,
      inspector: order.inspector
        ? {
            id: order.inspector.id,
            name: order.inspector.full_name,
            email: order.inspector.email,
          }
        : null,
      property: order.property
        ? {
            id: order.property.id,
            address_line1: order.property.address_line1,
            address_line2: order.property.address_line2,
            city: order.property.city,
            state: order.property.state,
            zip_code: order.property.zip_code,
            property_type: order.property.property_type,
          }
        : null,
      services: order.inspection?.services?.map((service) => ({
        id: service.id,
        service_id: service.service_id,
        name: service.name,
        price: service.price,
        duration_minutes: service.duration_minutes,
        status: service.status,
      })) ?? [],
      scheduled_date: order.scheduled_date,
      scheduled_time: order.scheduled_time,
      duration_minutes: order.duration_minutes,
      subtotal: order.subtotal,
      total: order.total,
      source: order.source,
      created_at: order.created_at,
      updated_at: order.updated_at,
    },
  };
}

/**
 * Build payload for order.updated event
 */
export function buildOrderUpdatedPayload(order: Order) {
  return buildOrderCreatedPayload(order);
}

/**
 * Build payload for order.completed event
 */
export function buildOrderCompletedPayload(order: Order) {
  return {
    ...buildOrderCreatedPayload(order),
    completed_at: order.completed_at,
  };
}

/**
 * Build payload for order.cancelled event
 */
export function buildOrderCancelledPayload(order: Order) {
  return buildOrderCreatedPayload(order);
}

/**
 * Build payload for inspection events
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function buildInspectionPayload(inspection: any) {
  return {
    inspection: {
      id: inspection.id,
      order_id: inspection.order_id,
      status: inspection.status,
      template_id: inspection.template_id,
      started_at: inspection.started_at,
      completed_at: inspection.completed_at,
      submitted_at: inspection.submitted_at,
      property: inspection.property
        ? {
            id: inspection.property.id,
            address_line1: inspection.property.address_line1,
            address_line2: inspection.property.address_line2,
            city: inspection.property.city,
            state: inspection.property.state,
            zip_code: inspection.property.zip_code,
          }
        : null,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      services: inspection.services?.map((service: any) => ({
        id: service.id,
        name: service.name,
        status: service.status,
        price: service.price,
      })) ?? [],
      created_at: inspection.created_at,
      updated_at: inspection.updated_at,
    },
  };
}

/**
 * Build payload for client events
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function buildClientPayload(client: any) {
  return {
    client: {
      id: client.id,
      name: client.name,
      email: client.email,
      phone: client.phone,
      company: client.company,
      notes: client.notes,
      created_at: client.created_at,
      updated_at: client.updated_at,
    },
  };
}

/**
 * Build payload for invoice events
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function buildInvoicePayload(invoice: any) {
  return {
    invoice: {
      id: invoice.id,
      invoice_number: invoice.invoice_number,
      order_id: invoice.order_id,
      status: invoice.status,
      subtotal: invoice.subtotal,
      tax: invoice.tax,
      total: invoice.total,
      client: invoice.client
        ? {
            id: invoice.client.id,
            name: invoice.client.name,
            email: invoice.client.email,
          }
        : null,
      issued_at: invoice.issued_at,
      due_at: invoice.due_at,
      paid_at: invoice.paid_at,
      created_at: invoice.created_at,
    },
  };
}

/**
 * Build payload for schedule events
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function buildSchedulePayload(schedule: any) {
  return {
    schedule: {
      id: schedule.id,
      order_id: schedule.order_id,
      schedule_type: schedule.schedule_type,
      label: schedule.label,
      slot_date: schedule.slot_date,
      slot_start: schedule.slot_start,
      slot_end: schedule.slot_end,
      duration_minutes: schedule.duration_minutes,
      status: schedule.status,
      inspector: schedule.inspector
        ? {
            id: schedule.inspector.id,
            name: schedule.inspector.full_name,
            email: schedule.inspector.email,
          }
        : null,
      created_at: schedule.created_at,
      updated_at: schedule.updated_at,
    },
  };
}
