import { useGet, usePost, usePut, useDelete } from "@/hooks/crud";
import { getClients, addClient, updateClient, deleteClient, getClientById } from "@/lib/mock/clients";

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
  return useGet<Client[]>("clients", async () => Promise.resolve(getClients()));
}

export function useCreateClient() {
  return usePost<Client, Omit<Client, "clientId" | "archived">>("clients", async (data) => Promise.resolve(addClient(data)));
}

export function useUpdateClient() {
  return usePut<Client | null, { clientId: string } & Partial<Client>>(
    "clients",
    async ({ clientId, ...data }) => Promise.resolve(updateClient(clientId, data))
  );
}

export function useDeleteClient() {
  return useDelete<boolean>("clients", async (clientId: string) => Promise.resolve(deleteClient(clientId)));
}

export function useClientById(clientId: string) {
  return useGet<Client | null>(`client-${clientId}`, async () => Promise.resolve(getClientById(clientId)));
}
