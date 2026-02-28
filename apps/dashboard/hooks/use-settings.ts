import { useGet, usePost, usePut } from "@/hooks/crud";
import { useApiClient } from "@/lib/api/tenant-context";
import { createSettingsApi } from "@inspectos/shared/api";
import { settingsQueryKeys } from "@inspectos/shared/query";

type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends Array<infer U>
    ? Array<DeepPartial<U>>
    : T[K] extends object
      ? DeepPartial<T[K]>
      : T[K];
};

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
    primaryColor: "#2563eb",
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
  const settingsApi = createSettingsApi(apiClient);
  return useGet<TenantSettings>(settingsQueryKeys.all, async () => {
    const data = await settingsApi.get<TenantSettings>();
    return { ...defaultSettings, ...data };
  });
}

export function useUpdateSettings() {
  const apiClient = useApiClient();
  const settingsApi = createSettingsApi(apiClient);
  return usePut<TenantSettings, DeepPartial<TenantSettings>>(
    settingsQueryKeys.all,
    async (settings) => {
      return await settingsApi.update<TenantSettings>(settings);
    }
  );
}

export function useRegenerateApiKey() {
  const apiClient = useApiClient();
  const settingsApi = createSettingsApi(apiClient);
  return usePost<{ apiKey: string; apiKeyPreview: string; apiKeyLastRotatedAt: string }, void>(
    settingsQueryKeys.all,
    async () => {
      return await settingsApi.regenerateApiKey<{ apiKey: string; apiKeyPreview: string; apiKeyLastRotatedAt: string }>();
    }
  );
}

export function useCreateBillingPortalSession() {
  const apiClient = useApiClient();
  const settingsApi = createSettingsApi(apiClient);
  return usePost<BillingPortalResponse, void>(
    settingsQueryKeys.all,
    async () => {
      return await settingsApi.createBillingPortalSession<BillingPortalResponse>();
    }
  );
}

export function useChangeBillingPlan() {
  const apiClient = useApiClient();
  const settingsApi = createSettingsApi(apiClient);
  return usePost<ChangeBillingPlanResponse, ChangeBillingPlanPayload>(
    settingsQueryKeys.all,
    async (payload) => {
      return await settingsApi.changeBillingPlan<ChangeBillingPlanResponse>(payload);
    }
  );
}
