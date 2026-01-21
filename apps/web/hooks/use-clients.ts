import { useGet, usePost, usePut, useDelete } from "@/hooks/crud";
import {
  fetchClients,
  createClient,
  updateClientById,
  deleteClientById,
  fetchClientById,
} from "@/lib/data/admin-data";

export type Client = {
  clientId: string;
  name: string;
  email: string;
  phone: string;
  type: "Homebuyer" | "Real Estate Agent" | "Seller" | string;
  inspections: number;
  lastInspection: string;
  totalSpent: number;
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

export function useClientById(clientId: string) {
  return useGet<Client | null>(`client-${clientId}`, async () => fetchClientById(clientId));
}
