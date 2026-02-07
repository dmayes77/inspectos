import type { InspectionSchedule, InspectionScheduleStatus, InspectionScheduleType } from "@/types/inspection";
import { shouldUseExternalApi } from "@/lib/api/feature-flags";
import { createApiClient } from "@/lib/api/client";

/**
 * Get tenant slug from environment
 * TODO: In production, this should come from user session or URL
 */
function getTenantSlug(): string {
  const isDevelopment =
    process.env.NODE_ENV === 'development' ||
    process.env.NEXT_PUBLIC_VERCEL_ENV === 'preview' ||
    process.env.NEXT_PUBLIC_IS_DEV_DEPLOYMENT === 'true';
  if (isDevelopment && process.env.NEXT_PUBLIC_SUPABASE_TENANT_ID) {
    return process.env.NEXT_PUBLIC_SUPABASE_TENANT_ID;
  }
  return "default";
}

/**
 * Orders data layer
 * Handles order CRUD operations
 * Orders are the central business unit replacing jobs
 */

export type OrderStatus = "pending" | "scheduled" | "in_progress" | "pending_report" | "delivered" | "completed" | "cancelled";

export type PaymentStatus = "unpaid" | "partial" | "paid" | "refunded";

export type OrderScheduleType = InspectionScheduleType;
export type OrderScheduleStatus = InspectionScheduleStatus;
export type OrderSchedule = InspectionSchedule;

export interface InspectionAssignment {
  id: string;
  inspection_id: string;
  inspector_id: string;
  role: "lead" | "assistant" | "tech";
  assigned_at: string;
  unassigned_at: string | null;
  created_at: string;
  updated_at: string;
  inspector?: {
    id: string;
    full_name: string | null;
    email: string;
    avatar_url: string | null;
  } | null;
}

export interface InspectionService {
  id: string;
  inspection_id: string;
  service_id: string | null;
  template_id: string | null;
  inspector_id: string | null;
  vendor_id: string | null;
  name: string;
  price: number;
  duration_minutes: number | null;
  status: "pending" | "in_progress" | "completed" | "skipped";
  sort_order: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  template?: {
    id: string;
    name: string;
  };
  inspector?: {
    id: string;
    full_name: string | null;
    email: string;
    avatar_url: string | null;
  } | null;
  vendor?: {
    id: string;
    name: string;
    vendor_type: string | null;
    email: string | null;
    phone: string | null;
  } | null;
}

export interface OrderInspection {
  id: string;
  order_id: string;
  template_id: string;
  inspector_id: string;
  status: "draft" | "in_progress" | "completed" | "submitted";
  started_at: string | null;
  completed_at: string | null;
  weather_conditions: string | null;
  temperature: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  order_schedule_id?: string | null;
  order_schedule?: OrderSchedule | null;
  services?: InspectionService[];
  assignments?: InspectionAssignment[];
}

export interface Order {
  id: string;
  tenant_id: string;
  order_number: string;
  client_id: string | null;
  agent_id: string | null;
  inspector_id: string | null;
  property_id: string;
  status: OrderStatus;
  scheduled_date: string | null;
  scheduled_time: string | null;
  duration_minutes: number;
  completed_at: string | null;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  payment_status: PaymentStatus;
  report_delivered_at: string | null;
  source: string | null;
  internal_notes: string | null;
  client_notes: string | null;
  created_at: string;
  updated_at: string;
  // Expanded relations
  property?: {
    id: string;
    address_line1: string;
    address_line2: string | null;
    city: string;
    state: string;
    zip_code: string;
    property_type: string;
    year_built: number | null;
    square_feet: number | null;
    bedrooms?: number | null;
    bathrooms?: number | null;
    stories?: string | null;
    foundation?: string | null;
    garage?: string | null;
    pool?: boolean | null;
    basement?: "none" | "unfinished" | "finished" | "partial" | null;
    lot_size_acres?: number | null;
    heating_type?: string | null;
    cooling_type?: string | null;
    roof_type?: string | null;
    building_class?: "A" | "B" | "C" | null;
    loading_docks?: number | null;
    zoning?: string | null;
    occupancy_type?: string | null;
    ceiling_height?: number | null;
    number_of_units?: number | null;
    unit_mix?: string | null;
    laundry_type?: "in-unit" | "shared" | "none" | null;
    parking_spaces?: number | null;
    elevator?: boolean | null;
  };
  client?: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    company: string | null;
  } | null;
  agent?: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    agency?: {
      id: string;
      name: string;
    } | null;
  } | null;
  inspector?: {
    id: string;
    full_name: string | null;
    email: string;
    avatar_url: string | null;
  } | null;
  inspection?: OrderInspection | null;
  schedules?: OrderSchedule[];
  invoices?: Array<{
    id: string;
    status: string;
    total: number;
    issued_at: string | null;
    due_at: string | null;
  }>;
}

export interface OrderService {
  service_id: string;
  template_id?: string;
  name: string;
  price: number;
  duration_minutes?: number;
}

export interface CreateOrderInput {
  tenant_slug?: string;
  client_id?: string | null;
  agent_id?: string | null;
  inspector_id?: string | null;
  inspection_id?: string;
  property_id: string;
  scheduled_date?: string | null;
  scheduled_time?: string | null;
  duration_minutes?: number;
  services: OrderService[];
  source?: string;
  internal_notes?: string | null;
  client_notes?: string | null;
}

export interface UpdateOrderInput {
  id: string;
  client_id?: string | null;
  agent_id?: string | null;
  inspector_id?: string | null;
  inspection_id?: string | null;
  property_id?: string;
  status?: OrderStatus;
  scheduled_date?: string | null;
  scheduled_time?: string | null;
  duration_minutes?: number;
  services?: OrderService[];
  subtotal?: number;
  discount?: number;
  tax?: number;
  total?: number;
  payment_status?: PaymentStatus;
  report_delivered_at?: string | null;
  source?: string;
  internal_notes?: string | null;
  client_notes?: string | null;
}

export interface OrderFilters {
  status?: OrderStatus;
  payment_status?: PaymentStatus;
  inspector_id?: string;
  client_id?: string;
  agent_id?: string;
  from?: string;
  to?: string;
  search?: string;
}

export async function fetchOrders(tenantSlug: string, filters?: OrderFilters): Promise<Order[]> {
  if (shouldUseExternalApi("orders")) {
    const apiClient = createApiClient(tenantSlug);
    const params = new URLSearchParams();

    if (filters?.status) params.append("status", filters.status);
    if (filters?.payment_status) params.append("payment_status", filters.payment_status);
    if (filters?.inspector_id) params.append("inspector_id", filters.inspector_id);
    if (filters?.client_id) params.append("client_id", filters.client_id);
    if (filters?.agent_id) params.append("agent_id", filters.agent_id);
    if (filters?.from) params.append("from", filters.from);
    if (filters?.to) params.append("to", filters.to);
    if (filters?.search) params.append("search", filters.search);

    const endpoint = params.toString() ? `/admin/orders?${params}` : "/admin/orders";
    return await apiClient.get<Order[]>(endpoint);
  } else {
    const params = new URLSearchParams({ tenant: tenantSlug });

    if (filters?.status) params.append("status", filters.status);
    if (filters?.payment_status) params.append("payment_status", filters.payment_status);
    if (filters?.inspector_id) params.append("inspector_id", filters.inspector_id);
    if (filters?.client_id) params.append("client_id", filters.client_id);
    if (filters?.agent_id) params.append("agent_id", filters.agent_id);
    if (filters?.from) params.append("from", filters.from);
    if (filters?.to) params.append("to", filters.to);
    if (filters?.search) params.append("search", filters.search);

    const response = await fetch(`/api/admin/orders?${params}`, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "Failed to fetch orders");
    }

    const result = await response.json();
    return result.data;
  }
}

export async function fetchOrderById(id: string): Promise<Order> {
  if (shouldUseExternalApi("orders")) {
    const apiClient = createApiClient(getTenantSlug());
    return await apiClient.get<Order>(`/admin/orders/${id}`);
  } else {
    const response = await fetch(`/api/admin/orders/${id}`, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "Failed to fetch order");
    }

    const result = await response.json();
    return result.data;
  }
}

export async function createOrder(input: CreateOrderInput): Promise<Order> {
  if (shouldUseExternalApi("orders")) {
    const apiClient = createApiClient(getTenantSlug());
    return await apiClient.post<Order>("/admin/orders", input);
  } else {
    const response = await fetch(`/api/admin/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "Failed to create order");
    }

    const result = await response.json();
    return result.data;
  }
}

export async function updateOrder(input: UpdateOrderInput): Promise<Order> {
  const { id, ...data } = input;
  if (shouldUseExternalApi("orders")) {
    const apiClient = createApiClient(getTenantSlug());
    return await apiClient.put<Order>(`/admin/orders/${id}`, data);
  } else {
    const response = await fetch(`/api/admin/orders/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "Failed to update order");
    }

    const result = await response.json();
    return result.data;
  }
}

export async function deleteOrder(id: string): Promise<boolean> {
  if (shouldUseExternalApi("orders")) {
    const apiClient = createApiClient(getTenantSlug());
    await apiClient.delete(`/admin/orders/${id}`);
    return true;
  } else {
    const response = await fetch(`/api/admin/orders/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "Failed to delete order");
    }

    return true;
  }
}

export async function scheduleOrder(
  id: string,
  data: {
    scheduled_date: string;
    scheduled_time?: string;
    inspector_id: string;
    duration_minutes?: number;
  },
): Promise<Order> {
  const response = await fetch(`/api/admin/orders/${id}/schedule`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Failed to schedule order");
  }

  const result = await response.json();
  return result.data;
}

export async function cancelOrder(id: string, reason?: string): Promise<Order> {
  const response = await fetch(`/api/admin/orders/${id}/cancel`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ reason }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Failed to cancel order");
  }

  const result = await response.json();
  return result.data;
}

export async function sendClientPortalLink(orderId: string): Promise<{ success: boolean }> {
  const response = await fetch(`/api/admin/orders/${orderId}/send-client-link`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Failed to send client portal link");
  }

  return response.json();
}

export async function sendAgentPortalLink(orderId: string): Promise<{ success: boolean }> {
  const response = await fetch(`/api/admin/orders/${orderId}/send-agent-link`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Failed to send agent portal link");
  }

  return response.json();
}
