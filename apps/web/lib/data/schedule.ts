import { shouldUseExternalApi } from "@/lib/api/feature-flags";
import { createApiClient } from "@/lib/api/client";

function getTenantSlug(): string {
  const isDevelopment =
    process.env.NODE_ENV === 'development' ||
    process.env.NEXT_PUBLIC_VERCEL_ENV === 'preview' ||
    process.env.NEXT_PUBLIC_IS_DEV_DEPLOYMENT === 'true';
  if (isDevelopment && process.env.NEXT_PUBLIC_SUPABASE_TENANT_ID) {
    return process.env.NEXT_PUBLIC_SUPABASE_TENANT_ID;
  }
  return "default";
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
    const data = await apiClient.get<ScheduleItem[]>(endpoint);
    console.log('[fetchScheduleItems] External API response:', data);
    return data;
  } else {
    // Use local Next.js API route
    const response = await fetch("/api/admin/schedule");
    console.log('[fetchScheduleItems] API response status:', response.status, response.ok);
    if (!response.ok) {
      throw new Error("Failed to load schedule.");
    }
    const result = await response.json();
    console.log('[fetchScheduleItems] API result:', {
      isArray: Array.isArray(result),
      hasData: !!result.data,
      resultLength: Array.isArray(result) ? result.length : result.data?.length,
      rawResult: result
    });
    return Array.isArray(result) ? result : (result.data ?? []);
  }
}
