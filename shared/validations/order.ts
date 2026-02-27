import { z } from "zod";

/**
 * Validation schema for order API requests
 */

export const orderServiceSchema = z.object({
  service_id: z.string().uuid("Invalid service ID"),
  template_id: z.string().uuid("Invalid template ID").optional(),
  name: z.string().min(1, "Service name is required"),
  price: z.number().min(0, "Price must be non-negative"),
  duration_minutes: z.number().int().positive().optional(),
  inspector_id: z.string().uuid("Invalid inspector ID").optional().nullable(),
  vendor_id: z.string().uuid("Invalid vendor ID").optional().nullable(),
});

export const createOrderSchema = z.object({
  client_id: z.string().uuid("Invalid client ID").optional().nullable(),
  agent_id: z.string().uuid("Invalid agent ID").optional().nullable(),
  inspector_id: z.string().uuid("Invalid inspector ID").optional().nullable(),
  property_id: z.string().uuid("Invalid property ID"),
  scheduled_date: z.string().optional().nullable(),
  scheduled_time: z.string().optional().nullable(),
  duration_minutes: z.number().int().positive().optional(),
  services: z.array(orderServiceSchema).min(1, "At least one service is required"),
  source: z.string().max(100).optional().nullable(),
  labor_cost: z.number().min(0).optional(),
  travel_cost: z.number().min(0).optional(),
  overhead_cost: z.number().min(0).optional(),
  other_cost: z.number().min(0).optional(),
  internal_notes: z.string().max(5000).optional().nullable(),
  client_notes: z.string().max(5000).optional().nullable(),
  primary_contact_type: z.enum(["agent", "client"]).optional().nullable(),
});

export const updateOrderSchema = z.object({
  client_id: z.string().uuid("Invalid client ID").optional().nullable(),
  agent_id: z.string().uuid("Invalid agent ID").optional().nullable(),
  inspector_id: z.string().uuid("Invalid inspector ID").optional().nullable(),
  property_id: z.string().uuid("Invalid property ID").optional(),
  status: z.enum([
    'pending',
    'scheduled',
    'in_progress',
    'pending_report',
    'delivered',
    'completed',
    'cancelled'
  ]).optional(),
  scheduled_date: z.string().optional().nullable(),
  scheduled_time: z.string().optional().nullable(),
  duration_minutes: z.number().int().positive().optional(),
  services: z.array(orderServiceSchema).min(1).optional(),
  subtotal: z.number().min(0).optional(),
  discount: z.number().min(0).optional(),
  tax: z.number().min(0).optional(),
  total: z.number().min(0).optional(),
  labor_cost: z.number().min(0).optional(),
  travel_cost: z.number().min(0).optional(),
  overhead_cost: z.number().min(0).optional(),
  other_cost: z.number().min(0).optional(),
  payment_status: z.enum(['unpaid', 'partial', 'paid', 'refunded']).optional(),
  report_delivered_at: z.string().optional().nullable(),
  source: z.string().max(100).optional().nullable(),
  internal_notes: z.string().max(5000).optional().nullable(),
  client_notes: z.string().max(5000).optional().nullable(),
  primary_contact_type: z.enum(["agent", "client"]).optional().nullable(),
});

export const scheduleOrderSchema = z.object({
  scheduled_date: z.string().min(1, "Scheduled date is required"),
  scheduled_time: z.string().optional(),
  inspector_id: z.string().uuid("Invalid inspector ID"),
  duration_minutes: z.number().int().positive().optional(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderInput = z.infer<typeof updateOrderSchema>;
export type ScheduleOrderInput = z.infer<typeof scheduleOrderSchema>;
export type OrderServiceInput = z.infer<typeof orderServiceSchema>;
