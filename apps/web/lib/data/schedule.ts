import { shouldUseExternalApi } from "@/lib/api/feature-flags";
import { createApiClient } from "@/lib/api/client";

function getTenantSlug(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_TENANT_ID || "default";
}

export type ScheduleItem = {
  id: string;
  date: string;
  time: string;
  address: string;
  inspector: string;
  inspectorId: string;
  status: string;
  type: string;
  price: number;
  durationMinutes: number;
};

export async function fetchScheduleItems(from?: string, to?: string): Promise<ScheduleItem[]> {
  if (shouldUseExternalApi("schedule")) {
    // Use external central API
    const apiClient = createApiClient(getTenantSlug());
    const params = new URLSearchParams();
    if (from) params.append("from", from);
    if (to) params.append("to", to);
    const endpoint = params.toString() ? `/admin/schedule?${params}` : "/admin/schedule";
    return await apiClient.get<ScheduleItem[]>(endpoint);
  } else {
    // Use local Next.js API route
    const response = await fetch("/api/admin/schedule");
    if (!response.ok) {
      throw new Error("Failed to load schedule.");
    }
    const result = await response.json();
    return Array.isArray(result) ? result : (result.data ?? []);
  }
}
