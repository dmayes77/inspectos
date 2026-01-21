import { useGet, usePost, usePut, useDelete } from "@/hooks/crud";
import {
  fetchInspections,
  createInspection,
  updateInspectionById,
  deleteInspectionById,
} from "@/lib/data/admin-data";
import type { Inspection } from "@/types/inspection";

export function useInspections() {
  return useGet<Inspection[]>("inspections", async () => fetchInspections());
}

export function useCreateInspection() {
  return usePost<Inspection, Partial<Inspection> & { types?: string[]; type?: string }>(
    "inspections",
    async (data) => createInspection(data)
  );
}

export function useUpdateInspection() {
  return usePut<Inspection | null, { inspectionId: string } & Partial<Inspection>>(
    "inspections",
    async (data) => updateInspectionById(data)
  );
}

export function useDeleteInspection() {
  return useDelete<boolean>("inspections", async (inspectionId: string) => deleteInspectionById(inspectionId));
}
