const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

type ApiErrorPayload = {
  error?: string;
};

export type RegisterBusinessPayload = {
  company_name: string;
  allow_existing_membership: boolean;
  inspector_seat_count: number;
  selected_plan: {
    code: string;
    name: string;
    baseMonthlyPrice: number;
    includedInspectors: number;
    maxInspectors: number;
    additionalInspectorPrice: number;
  };
  trial: {
    enabled: boolean;
    days: number;
    consented_to_trial: boolean;
    consented_to_autopay: boolean;
  };
};

export async function registerBusiness(payload: RegisterBusinessPayload): Promise<{ tenantId: string }> {
  const response = await fetch(`${API_BASE}/auth/register`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const json = (await response.json().catch(() => ({}))) as { data?: { business?: { id?: string } } } & ApiErrorPayload;
  if (!response.ok) {
    throw new Error(json.error || "Failed to create business.");
  }
  const tenantId = json.data?.business?.id;
  if (!tenantId) {
    throw new Error("Business created but missing tenant reference.");
  }
  return { tenantId };
}

export async function createStripeCheckout(payload: {
  tenant_id: string;
  plan_code: string;
  trial_days: number;
  inspector_seat_count: number;
}): Promise<{ url: string }> {
  const response = await fetch(`${API_BASE}/auth/stripe-checkout`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const json = (await response.json().catch(() => ({}))) as { data?: { url?: string } } & ApiErrorPayload;
  if (!response.ok || !json.data?.url) {
    throw new Error(json.error || "Failed to start Stripe checkout.");
  }
  return { url: json.data.url };
}
