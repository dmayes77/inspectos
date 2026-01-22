import { useGet, usePost, usePut, useDelete } from "@/hooks/crud";
import {
  fetchAgencies,
  fetchAgencyById,
  createAgency,
  updateAgency,
  deleteAgency,
  type Agency,
  type CreateAgencyInput,
  type UpdateAgencyInput,
  type AgencyFilters,
} from "@/lib/data/agencies";

export type { Agency, CreateAgencyInput, UpdateAgencyInput, AgencyFilters };

export function useAgencies(tenantSlug: string = "demo", filters?: AgencyFilters) {
  return useGet<Agency[]>(
    `agencies-${tenantSlug}-${JSON.stringify(filters ?? {})}`,
    async () => fetchAgencies(tenantSlug, filters)
  );
}

export function useAgencyById(agencyId: string) {
  return useGet<Agency | null>(
    `agency-${agencyId}`,
    async () => {
      try {
        return await fetchAgencyById(agencyId);
      } catch {
        return null;
      }
    },
    { enabled: !!agencyId }
  );
}

export function useCreateAgency() {
  return usePost<Agency, CreateAgencyInput>("agencies", async (data) => createAgency(data));
}

export function useUpdateAgency() {
  return usePut<Agency, UpdateAgencyInput>("agencies", async (data) => updateAgency(data));
}

export function useDeleteAgency() {
  return useDelete<boolean>("agencies", async (id: string) => deleteAgency(id));
}
