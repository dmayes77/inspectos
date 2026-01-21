// Returns only inspectors (role === 'INSPECTOR')
import { useGet, usePost, usePut, useDelete } from "@/hooks/crud";
import {
  fetchInspectors,
  fetchTeamMembers,
  createTeamMember,
  updateTeamMemberById,
  deleteTeamMemberById,
} from "@/lib/data/admin-data";

export type TeamMember = {
  id: string;
  teamMemberId: string;
  avatarUrl?: string;
  name: string;
  email: string;
  phone: string;
  role: "OWNER" | "ADMIN" | "INSPECTOR" | "OFFICE_STAFF";
  status: "active" | "on_leave" | "inactive";
  location: string;
  inspections: number;
  rating: number | null;
  certifications: string[];
  joinedDate: string;
  customPermissions: string[];
};

export type InspectorOption = {
  teamMemberId: string;
  name: string;
};

export function useInspectors() {
  return useGet<InspectorOption[]>("inspectors", async () => fetchInspectors());
}

export function useTeamMembers() {
  return useGet<TeamMember[]>("team", async () => fetchTeamMembers());
}

export function useCreateTeamMember() {
  return usePost<TeamMember, Partial<TeamMember>>("team", async (data) => createTeamMember(data));
}

export function useUpdateTeamMember() {
  return usePut<TeamMember | null, { teamMemberId: string } & Partial<TeamMember>>("team", async ({ teamMemberId, ...data }) =>
    updateTeamMemberById({ teamMemberId, ...data })
  );
}

export function useDeleteTeamMember() {
  // Soft delete: sets status to 'inactive' only
  return useDelete<boolean>("team", async (teamMemberId: string) => deleteTeamMemberById(teamMemberId));
}
