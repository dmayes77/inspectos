import { useGet, usePost, usePut, useDelete } from "@/hooks/crud";
import { useApiClient } from "@/lib/api/tenant-context";
import { createVendorsApi } from "@inspectos/shared/api";
import { vendorsQueryKeys } from "@inspectos/shared/query";

export type Vendor = {
  id: string;
  name: string;
  vendorType?: string;
  email?: string;
  phone?: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
};

export function useVendors() {
  const apiClient = useApiClient();
  const vendorsApi = createVendorsApi(apiClient);
  return useGet<Vendor[]>(vendorsQueryKeys.all, () => vendorsApi.list<Vendor>());
}

export function useVendor(id: string) {
  const apiClient = useApiClient();
  const vendorsApi = createVendorsApi(apiClient);
  return useGet<Vendor>(
    vendorsQueryKeys.detail(id),
    () => vendorsApi.getById<Vendor>(id),
    { enabled: !!id },
  );
}

export function useCreateVendor() {
  const apiClient = useApiClient();
  const vendorsApi = createVendorsApi(apiClient);
  return usePost<Vendor, Partial<Vendor>>(
    vendorsQueryKeys.all,
    (data) => vendorsApi.create<Vendor>(data),
  );
}

export function useUpdateVendor() {
  const apiClient = useApiClient();
  const vendorsApi = createVendorsApi(apiClient);
  return usePut<Vendor, Partial<Vendor> & { id: string }>(
    vendorsQueryKeys.all,
    ({ id, ...data }) => vendorsApi.update<Vendor>(id, data),
  );
}

export function useDeleteVendor() {
  const apiClient = useApiClient();
  const vendorsApi = createVendorsApi(apiClient);
  return useDelete<boolean>(
    vendorsQueryKeys.all,
    (id) => vendorsApi.remove<boolean>(id),
  );
}
