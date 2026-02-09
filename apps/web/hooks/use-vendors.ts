import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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

  return useQuery<Vendor[]>({
    queryKey: ["vendors"],
    queryFn: async () => apiClient.get<Vendor[]>("/admin/vendors"),
  });
}

export function useVendor(id: string) {
  const apiClient = useApiClient();

  return useQuery<Vendor>({
    queryKey: ["vendors", id],
    queryFn: async () => apiClient.get<Vendor>(`/admin/vendors/${id}`),
    enabled: !!id,
  });
}

export function useCreateVendor() {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<Vendor>) => apiClient.post<Vendor>("/admin/vendors", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendors"] });
    },
  });
}

export function useUpdateVendor() {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Vendor> & { id: string }) =>
      apiClient.put<Vendor>(`/admin/vendors/${id}`, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["vendors"] });
      queryClient.invalidateQueries({ queryKey: ["vendors", variables.id] });
    },
  });
}

export function useDeleteVendor() {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => apiClient.delete<boolean>(`/admin/vendors/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendors"] });
    },
  });
}
