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
  billing: {
    planCode: string;
    planName: string;
    currency: string;
    baseMonthlyPrice: number;
    includedInspectors: number;
    inspectorSeatCount: number;
    maxInspectors: number;
    additionalInspectorPrice: number;
    subscriptionStatus?: string;
    trialEndsAt?: string | null;
    stripeCurrentPeriodStart?: string | null;
    stripeCurrentPeriodEnd?: string | null;
    stripeCancelAtPeriodEnd?: boolean;
  };
  onboarding: {
    dashboardWelcomeDismissedAt: string | null;
  };
  business: {
    businessId: string;
    inspectorSeatCount: number; // seats currently assigned/in use
    inspectorBilling: {
      selectedInspectorSeats: number;
      usedInspectorSeats: number;
      remainingInspectorSeats: number;
      includedInspectors: number;
      maxInspectors: number;
      additionalInspectorPrice: number;
      billableAdditionalSeats: number;
      additionalSeatsMonthlyCharge: number;
      estimatedMonthlyTotal: number;
      overSeatLimitBy: number;
      overAssignedSeats: number;
      currency: string;
    };
    apiKeyPreview: string;
    apiKeyLastRotatedAt: string | null;
  };
};

type BillingPortalResponse = {
  url: string;
};

type ChangeBillingPlanPayload = {
  planCode: "growth" | "team";
};

type ChangeBillingPlanResponse = {
  changed: boolean;
  planCode?: string;
  planName?: string;
  selectedInspectorSeats?: number;
  seatQuantity?: number;
  message?: string;
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
  billing: {
    planCode: "growth",
    planName: "Growth",
    currency: "USD",
    baseMonthlyPrice: 499,
    includedInspectors: 1,
    inspectorSeatCount: 1,
    maxInspectors: 5,
    additionalInspectorPrice: 99,
    subscriptionStatus: "trialing",
    trialEndsAt: null,
    stripeCurrentPeriodStart: null,
    stripeCurrentPeriodEnd: null,
    stripeCancelAtPeriodEnd: false,
  },
  onboarding: {
    dashboardWelcomeDismissedAt: null,
  },
  business: {
    businessId: "",
    inspectorSeatCount: 0,
    inspectorBilling: {
      selectedInspectorSeats: 1,
      usedInspectorSeats: 0,
      remainingInspectorSeats: 1,
      includedInspectors: 1,
      maxInspectors: 5,
      additionalInspectorPrice: 99,
      billableAdditionalSeats: 0,
      additionalSeatsMonthlyCharge: 0,
      estimatedMonthlyTotal: 499,
      overSeatLimitBy: 0,
      overAssignedSeats: 0,
      currency: "USD",
    },
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

export function useCreateBillingPortalSession() {
  const apiClient = useApiClient();
  return usePost<BillingPortalResponse, void>(
    "settings",
    async () => {
      return await apiClient.post<BillingPortalResponse>("/admin/billing/portal", undefined);
    }
  );
}

export function useChangeBillingPlan() {
  const apiClient = useApiClient();
  return usePost<ChangeBillingPlanResponse, ChangeBillingPlanPayload>(
    "settings",
    async (payload) => {
      return await apiClient.post<ChangeBillingPlanResponse>("/admin/billing/plan", payload);
    }
  );
}
