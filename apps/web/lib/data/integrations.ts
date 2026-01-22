export type IntegrationType = 'email' | 'sms' | 'payments' | 'accounting' | 'payroll' | 'calendar';
export type IntegrationStatus = 'connected' | 'disconnected' | 'error' | 'pending';

export type Integration = {
  id: string;
  type: IntegrationType;
  provider: string;
  status: IntegrationStatus;
  config: Record<string, unknown>;
  connected_at: string | null;
  last_sync_at: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
};

export type IntegrationConfig = {
  email: { provider: 'sendgrid' | 'mailgun' | 'ses'; apiKey?: string };
  sms: { provider: 'twilio' | 'bandwidth'; accountSid?: string; authToken?: string };
  payments: { provider: 'stripe' | 'square'; publishableKey?: string; secretKey?: string };
  accounting: { provider: 'quickbooks' | 'xero'; clientId?: string; clientSecret?: string };
  payroll: { provider: 'gusto' | 'adp'; apiKey?: string };
  calendar: { provider: 'google' | 'outlook'; clientId?: string };
};

export async function fetchIntegrations(): Promise<Integration[]> {
  const response = await fetch("/api/admin/integrations");
  if (!response.ok) {
    throw new Error("Failed to load integrations.");
  }
  return response.json();
}

export async function connectIntegration(
  type: IntegrationType,
  provider: string,
  config?: Record<string, unknown>
): Promise<Integration> {
  const response = await fetch("/api/admin/integrations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type, provider, config }),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || "Failed to connect integration.");
  }
  return response.json();
}

export async function disconnectIntegration(id: string): Promise<void> {
  const response = await fetch(`/api/admin/integrations/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || "Failed to disconnect integration.");
  }
}

export async function updateIntegrationConfig(
  id: string,
  config: Record<string, unknown>
): Promise<Integration> {
  const response = await fetch(`/api/admin/integrations/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ config }),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || "Failed to update integration.");
  }
  return response.json();
}
