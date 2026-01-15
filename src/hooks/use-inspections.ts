import { useGet, usePost, usePut, useDelete } from "@/hooks/crud";
import { getInspections, addInspection, updateInspection, deleteInspection } from "@/lib/mock/inspections";
import type { Inspection } from "@/types/inspection";

export function useInspections() {
  return useGet<Inspection[]>("inspections", async () => Promise.resolve(getInspections()));
}

export function useCreateInspection() {
  return usePost<Inspection, Partial<Inspection> & { types?: string[]; type?: string }>(
    "inspections",
    async (data) => Promise.resolve(addInspection(data))
  );
}

export function useUpdateInspection() {
  return usePut<Inspection | null, { inspectionId: string } & Partial<Inspection>>(
    "inspections",
    async ({ inspectionId, ...data }) => Promise.resolve(updateInspection(inspectionId, data))
  );
}

export function useDeleteInspection() {
  return useDelete<boolean>("inspections", async (inspectionId: string) => Promise.resolve(deleteInspection(inspectionId)));
}
