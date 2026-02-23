import { useGet, usePost, usePut, useDelete } from "@/hooks/crud";
import { useApiClient } from "@/lib/api/tenant-context";

export type ClientProperty = {
  propertyId: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  zipCode: string;
  propertyType: string;
};

export type Client = {
  clientId: string;
  name: string;
  email: string;
  phone: string;
  type: "Homebuyer" | "Real Estate Agent" | "Seller" | string;
  inspections: number;
  lastInspection: string;
  totalSpent: number;
  createdAt: string | null;
  updatedAt: string | null;
  properties?: ClientProperty[];
  archived?: boolean;
};

export function useClients() {
  const apiClient = useApiClient();
  return useGet<Client[]>("clients", async () => {
    return await apiClient.get<Client[]>("/admin/clients");
  });
}

export function useCreateClient() {
  const apiClient = useApiClient();
  return usePost<Client, Omit<Client, "clientId" | "archived">>("clients", async (data) => {
    return await apiClient.post<Client>("/admin/clients", data);
  });
}

export function useUpdateClient() {
  const apiClient = useApiClient();
  return usePut<Client | null, { clientId: string } & Partial<Client>>(
    "clients",
    async (data) => {
      return await apiClient.put<Client>(`/admin/clients/${data.clientId}`, data);
    }
  );
}

export function useDeleteClient() {
  const apiClient = useApiClient();
  return useDelete<boolean>("clients", async (clientId: string) => {
    const result = await apiClient.delete<{ deleted: boolean }>(`/admin/clients/${clientId}`);
    return result.deleted ?? true;
  });
}

export function useClientById(clientId?: string) {
  const apiClient = useApiClient();
  return useGet<Client | null>(
    clientId ? `client-${clientId}` : "client-undefined",
    async () => {
      try {
        return await apiClient.get<Client>(`/admin/clients/${clientId ?? ""}`);
      } catch {
        return null;
      }
    },
    { enabled: Boolean(clientId) }
  );
}
