import { useGet, usePost, usePut, useDelete } from "@/hooks/crud";
import { fetchServices, createService, updateServiceById, deleteServiceById } from "@/lib/data/admin-data";
import type { ServiceType as Service } from "@/types/service";

export type { Service };

export function useServices() {
  return useGet<Service[]>("services", async () => (await fetchServices()) ?? []);
}

export function useCreateService() {
  return usePost<Service, Partial<Service>>("services", async (data) => createService(data));
}

export function useUpdateService() {
  return usePut<Service | null, { serviceId: string } & Partial<Service>>(
    "services",
    async (data) => updateServiceById(data)
  );
}

export function useDeleteService() {
  return useDelete<boolean>("services", async (serviceId: string) => deleteServiceById(serviceId));
}
