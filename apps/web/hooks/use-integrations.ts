import { useGet, usePost, useDelete } from "@/hooks/crud";
import {
  fetchIntegrations,
  connectIntegration,
  disconnectIntegration,
  type Integration,
  type IntegrationType,
} from "@/lib/data/integrations";

export type { Integration, IntegrationType };

export function useIntegrations() {
  return useGet<Integration[]>("integrations", fetchIntegrations);
}

export function useConnectIntegration() {
  return usePost<Integration, { type: IntegrationType; provider: string; config?: Record<string, unknown> }>(
    "integrations",
    async ({ type, provider, config }) => connectIntegration(type, provider, config)
  );
}

export function useDisconnectIntegration() {
  return useDelete<void>("integrations", async (id) => disconnectIntegration(id));
}
