import { useGet, usePost, usePut, useDelete } from "@/hooks/crud";
import {
  fetchClients,
  createClient,
  updateClientById,
  deleteClientById,
  fetchClientById,
} from "@/lib/data/admin-data";

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
  return useGet<Client[]>("clients", async () => fetchClients());
}

export function useCreateClient() {
  return usePost<Client, Omit<Client, "clientId" | "archived">>("clients", async (data) => createClient(data));
}

export function useUpdateClient() {
  return usePut<Client | null, { clientId: string } & Partial<Client>>(
    "clients",
    async (data) => updateClientById(data)
  );
}

export function useDeleteClient() {
  return useDelete<boolean>("clients", async (clientId: string) => deleteClientById(clientId));
}

export function useClientById(clientId?: string) {
  return useGet<Client | null>(
    clientId ? `client-${clientId}` : "client-undefined",
    async () => (await fetchClientById(clientId ?? "")) ?? null,
    { enabled: Boolean(clientId) }
  );
}
