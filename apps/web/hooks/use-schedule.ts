import { useGet } from "@/hooks/crud";
import { fetchScheduleItems, type ScheduleItem } from "@/lib/data/schedule";

export function useSchedule() {
  return useGet<ScheduleItem[]>("schedule", async () => fetchScheduleItems());
}
