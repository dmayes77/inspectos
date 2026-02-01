import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface Vendor {
  id: string;
  name: string;
  vendor_type?: string | null;
  email?: string | null;
  phone?: string | null;
  status?: string;
}

// Mock API for demonstration
const mockVendors: Vendor[] = [
  { id: "1", name: "Acme Pest Control", vendor_type: "Pest", phone: "555-1234", status: "active" },
  { id: "2", name: "Roof Pros", vendor_type: "Roof", phone: "555-5678", status: "active" },
];

let vendorStore = [...mockVendors];

export function useVendors() {
  return useQuery<Vendor[]>({
    queryKey: ["vendors"],
    queryFn: async () => {
      // TODO: Create /api/admin/vendors endpoint
      const response = await fetch("/api/admin/vendors");
      if (!response.ok) {
        throw new Error("Failed to fetch vendors");
      }
      const result = await response.json();
      return Array.isArray(result) ? result : (result.data ?? []);
    },
  });
}

export function useVendor(id: string) {
  return useQuery<Vendor>({
    queryKey: ["vendors", id],
    queryFn: async () => {
      // TODO: Create /api/admin/vendors/[id] endpoint
      const response = await fetch(`/api/admin/vendors/${id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch vendor");
      }
      const result = await response.json();
      return result.data ?? result;
    },
  });
}

export function createVendor(data: any) {
  vendorStore.push({ ...data, id: String(Date.now()) });
  return Promise.resolve(data);
}

export function updateVendor(id: string, data: any) {
  const index = vendorStore.findIndex((v) => v.id === id);
  if (index !== -1) {
    vendorStore[index] = { ...vendorStore[index], ...data };
  }
  return Promise.resolve(data);
}

export function deleteVendor(id: string) {
  vendorStore = vendorStore.filter((v) => v.id !== id);
  return Promise.resolve();
}
