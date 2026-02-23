import { useGet, usePost, usePut, useDelete } from "@/hooks/crud";
import { useApiClient } from "@/lib/api/tenant-context";

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
  return useGet<Vendor[]>("vendors", () => apiClient.get<Vendor[]>("/admin/vendors"));
}

export function useVendor(id: string) {
  const apiClient = useApiClient();
  return useGet<Vendor>(
    ["vendors", id],
    () => apiClient.get<Vendor>(`/admin/vendors/${id}`),
    { enabled: !!id },
  );
}

export function useCreateVendor() {
  const apiClient = useApiClient();
  return usePost<Vendor, Partial<Vendor>>(
    "vendors",
    (data) => apiClient.post<Vendor>("/admin/vendors", data),
  );
}

export function useUpdateVendor() {
  const apiClient = useApiClient();
  return usePut<Vendor, Partial<Vendor> & { id: string }>(
    "vendors",
    ({ id, ...data }) => apiClient.put<Vendor>(`/admin/vendors/${id}`, data),
  );
}

export function useDeleteVendor() {
  const apiClient = useApiClient();
  return useDelete<boolean>(
    "vendors",
    (id) => apiClient.delete<boolean>(`/admin/vendors/${id}`),
  );
}
