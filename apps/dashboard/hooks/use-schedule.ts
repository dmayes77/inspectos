import { useGet } from "@/hooks/crud";
import { useApiClient } from "@/lib/api/tenant-context";

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

export function useSchedule(from?: string, to?: string) {
  const apiClient = useApiClient();
  return useGet<ScheduleItem[]>("schedule", async () => {
    const params = new URLSearchParams();
    if (from) params.append("from", from);
    if (to) params.append("to", to);
    const endpoint = params.toString() ? `/admin/schedule?${params}` : "/admin/schedule";
    return await apiClient.get<ScheduleItem[]>(endpoint);
  });
}
