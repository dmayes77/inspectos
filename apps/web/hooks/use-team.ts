// Returns only inspectors (role === 'INSPECTOR')
import { useGet, usePost, usePut, useDelete } from "@/hooks/crud";
import { useApiClient } from "@/lib/api/tenant-context";

export type TeamMember = {
  id: string;
  memberId: string;
  teamMemberId: string;
  avatarUrl?: string;
  name: string;
  email: string;
  phone: string;
  isInspector: boolean;
  role: "OWNER" | "ADMIN" | "INSPECTOR" | "OFFICE_STAFF";
  status: "active" | "on_leave" | "inactive";
  location: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  stateRegion?: string;
  postalCode?: string;
  country?: string;
  inspections: number;
  rating: number | null;
  certifications: string[];
  joinedDate: string;
  customPermissions: string[];
  weeklyAvailability?: Array<{
    day: string;
    window?: string;
    available?: boolean;
    startTime?: string;
    endTime?: string;
  }>;
  availabilityExceptions?: Array<{
    id: string;
    type: string;
    startDate: string;
    endDate: string;
    status: string;
  }>;
};

export type InspectorOption = {
  teamMemberId: string;
  name: string;
};

export type CreateTeamMemberInput = {
  name: string;
  email: string;
  password?: string;
  sendLoginDetails?: boolean;
  phone?: string;
  role: TeamMember["role"];
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  stateRegion?: string;
  postalCode?: string;
  country?: string;
  isInspector?: boolean;
  avatarUrl?: string;
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
  return usePost<TeamMember, CreateTeamMemberInput>("team", async (data) => {
    const payload = {
      name: data.name,
      email: data.email,
      password: data.password,
      send_login_details: data.sendLoginDetails ?? false,
      phone: data.phone,
      role: data.role,
      is_inspector: Boolean(data.isInspector) || data.role === "INSPECTOR",
      address_line1: data.addressLine1,
      address_line2: data.addressLine2,
      city: data.city,
      state_region: data.stateRegion,
      postal_code: data.postalCode,
      country: data.country,
    };
    const result = await apiClient.post<{ user_id: string; member_id?: string | null }>("/admin/team", payload);
    return {
      id: result.user_id ?? "",
      memberId: result.member_id ?? "",
      teamMemberId: result.user_id ?? "",
      avatarUrl: data.avatarUrl,
      name: data.name,
      email: data.email,
      phone: data.phone ?? "",
      isInspector: data.role === "INSPECTOR" ? true : Boolean(data.isInspector),
      role: data.role,
      status: "active",
      location: [data.city, data.stateRegion].filter(Boolean).join(", "),
      addressLine1: data.addressLine1,
      addressLine2: data.addressLine2,
      city: data.city,
      stateRegion: data.stateRegion,
      postalCode: data.postalCode,
      country: data.country,
      inspections: 0,
      rating: null,
      certifications: [],
      joinedDate: "",
      customPermissions: [],
      weeklyAvailability: [],
      availabilityExceptions: [],
    };
  });
}

export function useUpdateTeamMember() {
  const apiClient = useApiClient();
  return usePut<TeamMember | null, { memberId: string } & Partial<TeamMember>>("team", async ({ memberId, ...data }) => {
    const resolvedMemberId = memberId?.trim()?.toUpperCase();
    if (!resolvedMemberId || resolvedMemberId === "UNDEFINED") {
      throw new Error("Missing team member id.");
    }
    if (!/^[A-Z0-9]{10}$/.test(resolvedMemberId)) {
      throw new Error("Invalid team member id.");
    }
    await apiClient.put(`/admin/team/${resolvedMemberId}`, data);
    return { memberId: resolvedMemberId, ...data } as TeamMember;
  });
}

export function useDeleteTeamMember() {
  const apiClient = useApiClient();
  // Soft delete: sets status to 'inactive' only
  return useDelete<boolean>("team", async (memberId: string) => {
    await apiClient.delete(`/admin/team/${memberId.trim().toUpperCase()}`);
    return true;
  });
}
