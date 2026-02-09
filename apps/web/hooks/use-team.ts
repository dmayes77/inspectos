// Returns only inspectors (role === 'INSPECTOR')
import { useGet, usePost, usePut, useDelete } from "@/hooks/crud";
import { useApiClient } from "@/lib/api/tenant-context";

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
  const apiClient = useApiClient();
  return useGet<InspectorOption[]>("inspectors", async () => {
    return await apiClient.get<InspectorOption[]>("/admin/inspectors");
  });
}

export function useTeamMembers() {
  const apiClient = useApiClient();
  return useGet<TeamMember[]>("team", async () => {
    return await apiClient.get<TeamMember[]>("/admin/team");
  });
}

export function useCreateTeamMember() {
  const apiClient = useApiClient();
  return usePost<TeamMember, Partial<TeamMember>>("team", async (data) => {
    const payload = {
      name: data.name,
      email: data.email,
      phone: data.phone,
      role: data.role,
    };
    const result = await apiClient.post<{ user_id: string }>("/admin/team", payload);
    return {
      id: result.user_id ?? "",
      teamMemberId: result.user_id ?? "",
      avatarUrl: data.avatarUrl,
      name: data.name ?? "",
      email: data.email ?? "",
      phone: data.phone ?? "",
      role: data.role ?? "INSPECTOR",
      status: data.status ?? "active",
      location: data.location ?? "",
      inspections: data.inspections ?? 0,
      rating: data.rating ?? null,
      certifications: data.certifications ?? [],
      joinedDate: data.joinedDate ?? "",
      customPermissions: data.customPermissions ?? [],
    };
  });
}

export function useUpdateTeamMember() {
  const apiClient = useApiClient();
  return usePut<TeamMember | null, { teamMemberId: string } & Partial<TeamMember>>("team", async ({ teamMemberId, ...data }) => {
    const memberId = teamMemberId?.trim();
    if (!memberId || memberId === "undefined") {
      throw new Error("Missing team member id.");
    }
    if (!/^[0-9a-fA-F-]{36}$/.test(memberId)) {
      throw new Error("Invalid team member id.");
    }
    await apiClient.put(`/admin/team/${memberId}`, data);
    return { teamMemberId, ...data } as TeamMember;
  });
}

export function useDeleteTeamMember() {
  const apiClient = useApiClient();
  // Soft delete: sets status to 'inactive' only
  return useDelete<boolean>("team", async (teamMemberId: string) => {
    await apiClient.delete(`/admin/team/${teamMemberId}`);
    return true;
  });
}
