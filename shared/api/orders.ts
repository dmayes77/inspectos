import type { ApiClient } from "./client";

export interface OrdersListFilters {
  business?: string;
  status?: string;
  payment_status?: string;
  inspector_id?: string;
  client_id?: string;
  agent_id?: string;
  from?: string;
  to?: string;
  search?: string;
}

export function createOrdersApi(apiClient: ApiClient) {
  return {
    list: async <TOrder>(filters?: OrdersListFilters): Promise<TOrder[]> => {
      const params = new URLSearchParams();
      if (filters?.business) params.append("business", filters.business);
      if (filters?.status) params.append("status", filters.status);
      if (filters?.payment_status) params.append("payment_status", filters.payment_status);
      if (filters?.inspector_id) params.append("inspector_id", filters.inspector_id);
      if (filters?.client_id) params.append("client_id", filters.client_id);
      if (filters?.agent_id) params.append("agent_id", filters.agent_id);
      if (filters?.from) params.append("from", filters.from);
      if (filters?.to) params.append("to", filters.to);
      if (filters?.search) params.append("search", filters.search);
      const endpoint = params.toString() ? `/admin/orders?${params}` : "/admin/orders";
      return apiClient.get<TOrder[]>(endpoint);
    },
    getById: async <TOrder>(orderId: string, business?: string): Promise<TOrder> => {
      const query = business ? `?business=${encodeURIComponent(business)}` : "";
      return apiClient.get<TOrder>(`/admin/orders/${orderId}${query}`);
    },
    create: async <TOrder, TInput>(data: TInput): Promise<TOrder> => {
      return apiClient.post<TOrder>("/admin/orders", data);
    },
    update: async <TOrder, TInput extends { id: string }>(data: TInput): Promise<TOrder> => {
      const { id, ...updateData } = data;
      return apiClient.put<TOrder>(`/admin/orders/${id}`, updateData);
    },
    remove: async (orderId: string): Promise<void> => {
      await apiClient.delete(`/admin/orders/${orderId}`);
    },
  };
}
