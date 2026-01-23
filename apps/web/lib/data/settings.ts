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
};

export const defaultSettings: TenantSettings = {
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
};

export async function fetchSettings(): Promise<TenantSettings> {
  const response = await fetch("/api/admin/settings");
  if (!response.ok) {
    throw new Error("Failed to load settings.");
  }
  const data = await response.json();
  return { ...defaultSettings, ...data };
}

export async function updateSettings(settings: Partial<TenantSettings>): Promise<TenantSettings> {
  const response = await fetch("/api/admin/settings", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(settings),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || "Failed to update settings.");
  }
  return response.json();
}
