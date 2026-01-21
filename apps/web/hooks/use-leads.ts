import { useDelete, useGet, usePost, usePut } from "@/hooks/crud";
import { createLead, deleteLeadById, fetchLeadById, fetchLeads, updateLeadById } from "@/lib/data/leads";

export type Lead = {
  leadId: string;
  name: string;
  email: string;
  phone: string;
  stage: string;
  source: string;
  notes: string;
  serviceName: string;
  requestedDate: string;
  estimatedValue: number;
};

export function useLeads() {
  return useGet<Lead[]>("leads", async () => (await fetchLeads()) ?? [], { initialData: [] });
}

export function useLeadById(leadId: string) {
  return useGet<Lead | null>(`lead-${leadId}`, async () => fetchLeadById(leadId));
}

export function useCreateLead() {
  return usePost<Lead, Partial<Lead>>("leads", async (data) => createLead(data));
}

export function useUpdateLead() {
  return usePut<Lead | null, { leadId: string } & Partial<Lead>>("leads", async (data) => updateLeadById(data));
}

export function useDeleteLead() {
  return useDelete<boolean>("leads", async (leadId: string) => deleteLeadById(leadId));
}
