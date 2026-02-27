import { useGet, usePost, usePut, useDelete } from "@/hooks/crud";
import { useQueryClient } from "@tanstack/react-query";
import type { InspectionSchedule, InspectionScheduleStatus, InspectionScheduleType } from "@/types/inspection";
import { useApiClient } from "@/lib/api/tenant-context";
import { createOrdersApi } from "@inspectos/shared/api";
import { ordersQueryKeys } from "@inspectos/shared/query";

export type OrderStatus = "pending" | "scheduled" | "in_progress" | "pending_report" | "delivered" | "completed" | "cancelled";
export type PaymentStatus = "unpaid" | "partial" | "paid" | "refunded";
export type OrderScheduleType = InspectionScheduleType;
export type OrderScheduleStatus = InspectionScheduleStatus;
export type OrderSchedule = InspectionSchedule;

export interface InspectionAssignment {
  id: string;
  order_id: string;
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
  order_id: string;
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

export interface Order {
  id: string;
  tenant_id: string;
  order_number: string;
  client_id: string | null;
  agent_id: string | null;
  primary_contact_type: "agent" | "client" | null;
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
  labor_cost?: number;
  travel_cost?: number;
  overhead_cost?: number;
  other_cost?: number;
  total_cost?: number;
  gross_margin?: number;
  gross_margin_pct?: number;
  payment_status: PaymentStatus;
  report_delivered_at: string | null;
  source: string | null;
  internal_notes: string | null;
  client_notes: string | null;
  // Inspection field data (merged from inspections table in migration 043)
  template_id: string | null;
  template_version: number | null;
  started_at: string | null;
  weather_conditions: string | null;
  temperature: string | null;
  present_parties: unknown[] | null;
  field_notes: string | null;
  selected_type_ids: string[] | null;
  created_at: string;
  updated_at: string;
  property?: {
    id: string;
    public_id?: string;
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
    public_id?: string;
    name: string;
    email: string | null;
    phone: string | null;
    company: string | null;
  } | null;
  agent?: {
    id: string;
    public_id?: string;
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
  // Services (line items) — direct on order after migration 043
  services?: InspectionService[];
  assignments?: InspectionAssignment[];
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
  property_id: string;
  scheduled_date?: string | null;
  scheduled_time?: string | null;
  duration_minutes?: number;
  services: OrderService[];
  labor_cost?: number;
  travel_cost?: number;
  overhead_cost?: number;
  other_cost?: number;
  source?: string;
  internal_notes?: string | null;
  client_notes?: string | null;
  primary_contact_type?: "agent" | "client" | null;
}

export interface UpdateOrderInput {
  id: string;
  client_id?: string | null;
  agent_id?: string | null;
  inspector_id?: string | null;
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
  labor_cost?: number;
  travel_cost?: number;
  overhead_cost?: number;
  other_cost?: number;
  payment_status?: PaymentStatus;
  report_delivered_at?: string | null;
  source?: string;
  internal_notes?: string | null;
  client_notes?: string | null;
  primary_contact_type?: "agent" | "client" | null;
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

export function useOrders(tenantSlug: string = "demo", filters?: OrderFilters) {
  const apiClient = useApiClient();
  const ordersApi = createOrdersApi(apiClient);
  const queryKey = ordersQueryKeys.list(tenantSlug, filters);
  return useGet<Order[]>(queryKey, async () => {
    return await ordersApi.list<Order>(filters);
  });
}

export function useOrderById(orderId: string) {
  const apiClient = useApiClient();
  const ordersApi = createOrdersApi(apiClient);
  return useGet<Order | null>(
    ordersQueryKeys.detail(orderId),
    async () => {
      try {
        return await ordersApi.getById<Order>(orderId);
      } catch {
        return null;
      }
    },
    { enabled: !!orderId },
  );
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  const apiClient = useApiClient();
  const ordersApi = createOrdersApi(apiClient);
  return usePost<Order, CreateOrderInput>(ordersQueryKeys.all, async (data) => {
    return await ordersApi.create<Order, CreateOrderInput>(data);
  }, {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ordersQueryKeys.all });
    },
  });
}

export function useUpdateOrder() {
  const queryClient = useQueryClient();
  const apiClient = useApiClient();
  const ordersApi = createOrdersApi(apiClient);
  return usePut<Order, UpdateOrderInput>(ordersQueryKeys.all, async (data) => {
    return await ordersApi.update<Order, UpdateOrderInput>(data);
  }, {
    onSuccess: (updatedOrder) => {
      queryClient.invalidateQueries({ queryKey: ordersQueryKeys.all });
      if (updatedOrder?.id) {
        queryClient.invalidateQueries({ queryKey: ordersQueryKeys.detail(updatedOrder.id) });
      }
    },
  });
}

export function useDeleteOrder() {
  const apiClient = useApiClient();
  const ordersApi = createOrdersApi(apiClient);
  return useDelete<boolean>(ordersQueryKeys.all, async (id: string) => {
    await ordersApi.remove(id);
    return true;
  });
}
