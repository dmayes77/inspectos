import { useQuery } from "@tanstack/react-query";
import type { Inspection } from "@/hooks/use-inspections";

async function fetchInspection(id: string): Promise<Inspection | null> {
  try {
    const res = await fetch(`/api/admin/inspections/${id}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data?.data ?? null;
  } catch {
    return null;
  }
}

export function useInspection(id: string) {
  return useQuery({
    queryKey: ["inspection", id],
    queryFn: () => fetchInspection(id),
    enabled: !!id,
    staleTime: 1000 * 60,
    refetchOnWindowFocus: false,
  });
}
