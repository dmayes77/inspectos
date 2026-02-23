// Returns only inspectors (role === 'INSPECTOR')
import { useGet, usePost, usePut, useDelete } from "@/hooks/crud";
import { useApiClient } from "@/lib/api/tenant-context";
import { createTeamApi } from "@inspectos/shared/api";
import { teamQueryKeys } from "@inspectos/shared/query";

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
  color?: string;
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

function defaultColorForRole(role: TeamMember["role"]): string {
  switch (role) {
    case "OWNER":
      return "#94A3B8";
    case "ADMIN":
      return "#60A5FA";
    case "INSPECTOR":
      return "#2DD4BF";
    case "OFFICE_STAFF":
    default:
      return "#C4B5FD";
  }
}

export function useInspectors() {
  const apiClient = useApiClient();
  const teamApi = createTeamApi(apiClient);
  return useGet<InspectorOption[]>(teamQueryKeys.inspectors(), async () => {
    return await teamApi.inspectors<InspectorOption>();
  });
}

export function useTeamMembers() {
  const apiClient = useApiClient();
  const teamApi = createTeamApi(apiClient);
  return useGet<TeamMember[]>(teamQueryKeys.all, async () => {
    return await teamApi.list<TeamMember>();
  });
}

export function useCreateTeamMember() {
  const apiClient = useApiClient();
  const teamApi = createTeamApi(apiClient);
  return usePost<TeamMember, CreateTeamMemberInput>(teamQueryKeys.all, async (data) => {
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
    const result = await teamApi.create<{ user_id: string; member_id?: string | null }>(payload);
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
      color: defaultColorForRole(data.role),
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
  const teamApi = createTeamApi(apiClient);
  return usePut<TeamMember | null, { memberId: string } & Partial<TeamMember>>(teamQueryKeys.all, async ({ memberId, ...data }) => {
    const resolvedMemberId = memberId?.trim()?.toUpperCase();
    if (!resolvedMemberId || resolvedMemberId === "UNDEFINED") {
      throw new Error("Missing team member id.");
    }
    if (!/^[A-Z0-9]{10}$/.test(resolvedMemberId)) {
      throw new Error("Invalid team member id.");
    }
    await teamApi.update(resolvedMemberId, data);
    return { memberId: resolvedMemberId, ...data } as TeamMember;
  });
}

export function useDeleteTeamMember() {
  const apiClient = useApiClient();
  const teamApi = createTeamApi(apiClient);
  // Soft delete: sets status to 'inactive' only
  return useDelete<boolean>(teamQueryKeys.all, async (memberId: string) => {
    await teamApi.remove(memberId.trim().toUpperCase());
    return true;
  });
}
