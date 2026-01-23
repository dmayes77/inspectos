import { useGet, usePut } from "@/hooks/crud";
import {
  fetchSettings,
  updateSettings,
  type TenantSettings,
} from "@/lib/data/settings";

export type { TenantSettings };

export function useSettings() {
  return useGet<TenantSettings>("settings", fetchSettings);
}

export function useUpdateSettings() {
  return usePut<TenantSettings, Partial<TenantSettings>>(
    "settings",
    async (settings) => updateSettings(settings)
  );
}
