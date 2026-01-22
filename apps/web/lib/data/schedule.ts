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

export async function fetchScheduleItems(): Promise<ScheduleItem[]> {
  const response = await fetch("/api/admin/schedule");
  if (!response.ok) {
    throw new Error("Failed to load schedule.");
  }
  const result = await response.json();
  return Array.isArray(result) ? result : (result.data ?? []);
}
