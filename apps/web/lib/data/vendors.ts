import { shouldUseExternalApi } from "@/lib/api/feature-flags";
import { createApiClient } from "@/lib/api/client";

function getTenantSlug(): string {
  if (typeof window !== "undefined") {
    const pathParts = window.location.pathname.split("/");
    return pathParts[1] || "default";
  }
  return "default";
}

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

export async function fetchVendors(): Promise<Vendor[]> {
  if (shouldUseExternalApi("vendors")) {
    const apiClient = createApiClient(getTenantSlug());
    return await apiClient.get<Vendor[]>("/admin/vendors");
  } else {
    const response = await fetch("/api/admin/vendors");
    if (!response.ok) {
      throw new Error("Failed to load vendors.");
    }
    return response.json();
  }
}

export async function fetchVendorById(id: string): Promise<Vendor> {
  if (shouldUseExternalApi("vendors")) {
    const apiClient = createApiClient(getTenantSlug());
    return await apiClient.get<Vendor>(`/admin/vendors/${id}`);
  } else {
    const response = await fetch(`/api/admin/vendors/${id}`);
    if (!response.ok) {
      throw new Error("Failed to load vendor.");
    }
    return response.json();
  }
}

export async function createVendor(data: Partial<Vendor>): Promise<Vendor> {
  if (shouldUseExternalApi("vendors")) {
    const apiClient = createApiClient(getTenantSlug());
    return await apiClient.post<Vendor>("/admin/vendors", data);
  } else {
    const response = await fetch("/api/admin/vendors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error("Failed to create vendor.");
    }
    return response.json();
  }
}

export async function updateVendor(id: string, data: Partial<Vendor>): Promise<Vendor> {
  if (shouldUseExternalApi("vendors")) {
    const apiClient = createApiClient(getTenantSlug());
    return await apiClient.put<Vendor>(`/admin/vendors/${id}`, data);
  } else {
    const response = await fetch(`/api/admin/vendors/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error("Failed to update vendor.");
    }
    return response.json();
  }
}

export async function deleteVendor(id: string): Promise<boolean> {
  if (shouldUseExternalApi("vendors")) {
    const apiClient = createApiClient(getTenantSlug());
    return await apiClient.delete<boolean>(`/admin/vendors/${id}`);
  } else {
    const response = await fetch(`/api/admin/vendors/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      throw new Error("Failed to delete vendor.");
    }
    const result = await response.json();
    return result.success ?? true;
  }
}
