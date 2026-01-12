import { useGet, usePost, usePut, useDelete } from "@/hooks/crud";
import { getServices, addService, updateService, deleteService } from "@/lib/mock/services";

export type Service = {
  serviceId: string;
  name: string;
  description?: string;
  price?: number;
  isPackage?: boolean;
  includedServiceIds?: string[];
  includes?: string[];
};

export function useServices() {
  return useGet<Service[]>("services", async () => Promise.resolve(getServices()));
}

export function useCreateService() {
  return usePost<Service, Partial<Service>>("services", async (data) => Promise.resolve(addService(data)));
}

export function useUpdateService() {
  return usePut<Service | null, { serviceId: string } & Partial<Service>>(
    "services",
    async ({ serviceId, ...data }) => Promise.resolve(updateService(serviceId, data))
  );
}

export function useDeleteService() {
  return useDelete<boolean>("services", async (serviceId: string) => Promise.resolve(deleteService(serviceId)));
}
