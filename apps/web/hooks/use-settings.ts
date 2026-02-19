import { useGet, usePost, usePut } from "@/hooks/crud";
import { useApiClient } from "@/lib/api/tenant-context";

export type TenantSettings = {
  company: {
    name: string;
    email: string;
    phone: string;
    website: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    timezone?: string;
  };
  branding: {
    logoUrl: string | null;
    primaryColor: string;
  };
  notifications: {
    newBooking: boolean;
    inspectionComplete: boolean;
    paymentReceived: boolean;
    reportViewed: boolean;
    weeklySummary: boolean;
  };
  business: {
    businessId: string;
    apiKeyPreview: string;
    apiKeyLastRotatedAt: string | null;
  };
};

const defaultSettings: TenantSettings = {
  company: {
    name: "",
    email: "",
    phone: "",
    website: "",
    address: "",
    city: "",
    state: "",
    zip: "",
  },
  branding: {
    logoUrl: null,
    primaryColor: "#f97316",
  },
  notifications: {
    newBooking: true,
    inspectionComplete: true,
    paymentReceived: true,
    reportViewed: false,
    weeklySummary: true,
  },
  business: {
    businessId: "",
    apiKeyPreview: "",
    apiKeyLastRotatedAt: null,
  },
};

export function useSettings() {
  const apiClient = useApiClient();
  return useGet<TenantSettings>("settings", async () => {
    const data = await apiClient.get<TenantSettings>('/admin/settings');
    return { ...defaultSettings, ...data };
  });
}

export function useUpdateSettings() {
  const apiClient = useApiClient();
  return usePut<TenantSettings, Partial<TenantSettings>>(
    "settings",
    async (settings) => {
      return await apiClient.put<TenantSettings>('/admin/settings', settings);
    }
  );
}

export function useRegenerateApiKey() {
  const apiClient = useApiClient();
  return usePost<{ apiKey: string; apiKeyPreview: string; apiKeyLastRotatedAt: string }, void>(
    "settings",
    async () => {
      return await apiClient.post<{ apiKey: string; apiKeyPreview: string; apiKeyLastRotatedAt: string }>('/admin/settings/api-key', undefined);
    }
  );
}
