import { useGet } from "@/hooks/crud";
import { useApiClient } from "@/lib/api/tenant-context";
import { createScheduleApi } from "@inspectos/shared/api";
import { scheduleQueryKeys } from "@inspectos/shared/query";

export type ScheduleItem = {
  id: string;
  orderNumber?: string;
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
  const scheduleApi = createScheduleApi(apiClient);
  return useGet<ScheduleItem[]>(scheduleQueryKeys.list(from, to), async () => {
    return await scheduleApi.list<ScheduleItem>(from, to);
  });
}
