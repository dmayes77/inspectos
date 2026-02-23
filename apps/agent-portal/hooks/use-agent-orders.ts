"use client";

import { useQuery } from "@tanstack/react-query";
import { createOrdersApi } from "@inspectos/shared/api";
import { ordersQueryKeys } from "@inspectos/shared/query";
import { createApiClient } from "@/lib/api/client";

export type AgentOrder = {
  id: string;
  order_number: string;
  status: string;
  scheduled_date: string | null;
  scheduled_time: string | null;
  total: number;
  payment_status: string;
  property?: {
    address_line1: string;
    city: string;
    state: string;
  } | null;
  client?: {
    name: string;
  } | null;
};

export function useAgentOrders(businessSlug?: string | null) {
  return useQuery<AgentOrder[]>({
    queryKey: ordersQueryKeys.list("agent-portal", { business: businessSlug ?? null }),
    enabled: Boolean(businessSlug),
    queryFn: async () => {
      const apiClient = createApiClient();
      const ordersApi = createOrdersApi(apiClient);
      return ordersApi.list<AgentOrder>({
        business: businessSlug ?? undefined,
      });
    },
  });
}

export function useAgentOrder(orderId?: string, businessSlug?: string | null) {
  return useQuery<AgentOrder | null>({
    queryKey: [ordersQueryKeys.detail(orderId ?? "unknown"), businessSlug ?? null],
    enabled: Boolean(orderId && businessSlug),
    queryFn: async () => {
      if (!orderId) return null;
      const apiClient = createApiClient();
      const ordersApi = createOrdersApi(apiClient);
      try {
        return await ordersApi.getById<AgentOrder>(orderId, businessSlug ?? undefined);
      } catch {
        return null;
      }
    },
  });
}
