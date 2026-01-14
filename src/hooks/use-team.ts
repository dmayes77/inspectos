// Returns only inspectors (role === 'INSPECTOR')
import { useMemo } from "react";

export function useInspectors() {
  const { data = [], isLoading } = useTeamMembers();
  const inspectors = useMemo(() => data.filter((m) => m.role === "INSPECTOR"), [data]);
  return { data: inspectors, isLoading };
}
import { useGet, usePost, usePut, useDelete } from "@/hooks/crud";
import { getTeamMembers, createTeamMember, updateTeamMember, deleteTeamMember } from "@/lib/mock/team";

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

export function useTeamMembers() {
  return useGet<TeamMember[]>("team", async () => Promise.resolve(getTeamMembers()));
}

export function useCreateTeamMember() {
  return usePost<TeamMember, Partial<TeamMember>>("team", async (data) => Promise.resolve(createTeamMember(data)));
}

export function useUpdateTeamMember() {
  return usePut<TeamMember | null, { teamMemberId: string } & Partial<TeamMember>>("team", async ({ teamMemberId, ...data }) =>
    Promise.resolve(updateTeamMember(teamMemberId, data))
  );
}

export function useDeleteTeamMember() {
  // Soft delete: sets status to 'inactive' only
  return useDelete<boolean>("team", async (teamMemberId: string) => Promise.resolve(deleteTeamMember(teamMemberId)));
}
