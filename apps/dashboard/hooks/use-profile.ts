import { useGet, usePut } from "@/hooks/crud";
import { useApiClient } from "@/lib/api/tenant-context";
import { createProfileApi } from "@inspectos/shared/api";
import { profileQueryKeys } from "@inspectos/shared/query";

export type UserProfile = {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  bio: string | null;
  social_links: string[] | null;
  social_facebook: string | null;
  social_twitter: string | null;
  social_linkedin: string | null;
  social_instagram: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state_region: string | null;
  country: string | null;
  postal_code: string | null;
  role: string | null;
  custom_permissions?: string[] | null;
  permissions?: string[] | null;
};

export type ProfileUpdate = Partial<Omit<UserProfile, "id" | "email" | "role">>;

export function useProfile() {
  const apiClient = useApiClient();
  const profileApi = createProfileApi(apiClient);
  return useGet<UserProfile>("profile", () =>
    profileApi.get<UserProfile>()
  );
}

export function useUpdateProfile() {
  const apiClient = useApiClient();
  const profileApi = createProfileApi(apiClient);
  return usePut<UserProfile, ProfileUpdate>(
    profileQueryKeys.all,
    (updates) => profileApi.update<UserProfile>(updates)
  );
}
