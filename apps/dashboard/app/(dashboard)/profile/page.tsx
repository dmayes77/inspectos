"use client";

import { useState, useEffect, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Loader2 } from "lucide-react";
import { useProfile, useUpdateProfile, type ProfileUpdate } from "@/hooks/use-profile";
import { toast } from "sonner";
import { uploadCurrentUserAvatar } from "@/lib/api/media";

// Facebook icon
function FacebookIcon() {
  return (
    <svg className="fill-current" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M11.6666 11.2503H13.7499L14.5833 7.91699H11.6666V6.25033C11.6666 5.39251 11.6666 4.58366 13.3333 4.58366H14.5833V1.78374C14.3118 1.7477 13.2858 1.66699 12.2023 1.66699C9.94025 1.66699 8.33325 3.04771 8.33325 5.58342V7.91699H5.83325V11.2503H8.33325V18.3337H11.6666V11.2503Z" fill="" />
    </svg>
  );
}

function TwitterIcon() {
  return (
    <svg className="fill-current" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M15.1708 1.875H17.9274L11.9049 8.75833L18.9899 18.125H13.4424L9.09742 12.4442L4.12578 18.125H1.36745L7.80912 10.7625L1.01245 1.875H6.70078L10.6283 7.0675L15.1708 1.875ZM14.2033 16.475H15.7308L5.87078 3.43833H4.23162L14.2033 16.475Z" fill="" />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg className="fill-current" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M5.78381 4.16645C5.78351 4.84504 5.37181 5.45569 4.74286 5.71045C4.11391 5.96521 3.39331 5.81321 2.92083 5.32613C2.44836 4.83904 2.31837 4.11413 2.59216 3.49323C2.86596 2.87233 3.48886 2.47942 4.16715 2.49978C5.06804 2.52682 5.78422 3.26515 5.78381 4.16645ZM5.83381 7.06645H2.50048V17.4998H5.83381V7.06645ZM11.1005 7.06645H7.78381V17.4998H11.0672V12.0248C11.0672 8.97475 15.0422 8.69142 15.0422 12.0248V17.4998H18.3338V10.8914C18.3338 5.74978 12.4505 5.94145 11.0672 8.46642L11.1005 7.06645Z" fill="" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg className="fill-current" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10.8567 1.66699C11.7946 1.66854 12.2698 1.67351 12.6805 1.68573L12.8422 1.69102C13.0291 1.69766 13.2134 1.70599 13.4357 1.71641C14.3224 1.75738 14.9273 1.89766 15.4586 2.10391C16.0078 2.31572 16.4717 2.60183 16.9349 3.06503C17.3974 3.52822 17.6836 3.99349 17.8961 4.54141C18.1016 5.07197 18.2419 5.67753 18.2836 6.56433C18.2935 6.78655 18.3015 6.97088 18.3081 7.15775L18.3133 7.31949C18.3255 7.73011 18.3311 8.20543 18.3328 9.1433L18.3335 9.76463V10.2348L18.333 10.8562C18.3314 11.794 18.3265 12.2694 18.3142 12.68L18.3089 12.8417C18.3023 13.0286 18.294 13.213 18.2836 13.4351C18.2426 14.322 18.1016 14.9268 17.8961 15.458C17.6842 16.0074 17.3974 16.4713 16.9349 16.9345C16.4717 17.397 16.0057 17.6831 15.4586 17.8955C14.9273 18.1011 14.3224 18.2414 13.4357 18.2831C13.2134 18.293 13.0291 18.3011 12.8422 18.3076L12.6805 18.3128C12.2698 18.3251 11.7946 18.3306 10.8567 18.3324L10.2353 18.333H9.76516L9.14375 18.3325C8.20591 18.331 7.7306 18.326 7.31997 18.3137L7.15824 18.3085C6.97136 18.3018 6.78703 18.2935 6.56481 18.2831C5.67801 18.2421 5.07384 18.1011 4.5419 17.8955C3.99328 17.6838 3.5287 17.397 3.06551 16.9345C2.60231 16.4713 2.3169 16.0053 2.1044 15.458C1.89815 14.9268 1.75856 14.322 1.7169 13.4351C1.707 13.213 1.69892 13.0286 1.69238 12.8417L1.68714 12.68C1.67495 12.2694 1.66939 11.794 1.66759 10.8562L1.66748 9.1433C1.66903 8.20543 1.67399 7.73011 1.68621 7.31949L1.69151 7.15775C1.69815 6.97088 1.70648 6.78655 1.7169 6.56433C1.75786 5.67683 1.89815 5.07266 2.1044 4.54141C2.3162 3.9928 2.60231 3.52822 3.06551 3.06503C3.5287 2.60183 3.99398 2.31641 4.5419 2.10391C5.07315 1.89766 5.67731 1.75808 6.56481 1.71641C6.78703 1.70652 6.97136 1.69844 7.15824 1.6919L7.31997 1.68666C7.7306 1.67446 8.20591 1.6689 9.14375 1.6671L10.8567 1.66699ZM10.0002 5.83308C7.69781 5.83308 5.83356 7.69935 5.83356 9.99972C5.83356 12.3021 7.69984 14.1664 10.0002 14.1664C12.3027 14.1664 14.1669 12.3001 14.1669 9.99972C14.1669 7.69732 12.3006 5.83308 10.0002 5.83308ZM10.0002 7.49974C11.381 7.49974 12.5002 8.61863 12.5002 9.99972C12.5002 11.3805 11.3813 12.4997 10.0002 12.4997C8.6195 12.4997 7.50023 11.3809 7.50023 9.99972C7.50023 8.61897 8.61908 7.49974 10.0002 7.49974ZM14.3752 4.58308C13.8008 4.58308 13.3336 5.04967 13.3336 5.62403C13.3336 6.19841 13.8002 6.66572 14.3752 6.66572C14.9496 6.66572 15.4169 6.19913 15.4169 5.62403C15.4169 5.04967 14.9488 4.58236 14.3752 4.58308Z" fill="" />
    </svg>
  );
}

function SocialLink({ icon, href }: { icon: React.ReactNode; href?: string | null }) {
  return (
    <a
      href={href || "#"}
      target={href ? "_blank" : undefined}
      rel="noreferrer"
      onClick={!href ? (e) => e.preventDefault() : undefined}
      className="flex h-11 w-11 items-center justify-center gap-2 rounded-full border border-gray-300 bg-white text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
    >
      {icon}
    </a>
  );
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">{label}</Label>
      {children}
    </div>
  );
}

function getInitials(name: string | null | undefined, email?: string | null): string {
  if (name) return name.split(" ").filter(Boolean).map((n) => n[0].toUpperCase()).slice(0, 2).join("");
  return email?.[0]?.toUpperCase() ?? "U";
}

export default function ProfilePage() {
  const { data: profile, isLoading } = useProfile();
  const updateMutation = useUpdateProfile();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const avatarUploadMutation = useMutation({
    mutationFn: uploadCurrentUserAvatar,
  });

  useEffect(() => {
    if (profile?.avatar_url) setAvatarUrl(profile.avatar_url);
  }, [profile?.avatar_url]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    try {
      if (!profile?.id) throw new Error("Not authenticated");
      const { avatarUrl: publicUrl } = await avatarUploadMutation.mutateAsync(file);

      setAvatarUrl(publicUrl);
      updateMutation.mutate(
        { avatar_url: publicUrl },
        {
          onSuccess: () => toast.success("Avatar updated"),
          onError: () => toast.error("Failed to save avatar"),
        }
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setAvatarUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const [form, setForm] = useState<ProfileUpdate>({
    full_name: "", phone: "", bio: "",
    social_facebook: "", social_twitter: "", social_linkedin: "", social_instagram: "",
    address_line1: "", address_line2: "",
    city: "", state_region: "", country: "", postal_code: "",
  });

  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name ?? "",
        phone: profile.phone ?? "",
        bio: profile.bio ?? "",
        social_facebook: profile.social_facebook ?? "",
        social_twitter: profile.social_twitter ?? "",
        social_linkedin: profile.social_linkedin ?? "",
        social_instagram: profile.social_instagram ?? "",
        address_line1: profile.address_line1 ?? "",
        address_line2: profile.address_line2 ?? "",
        city: profile.city ?? "",
        state_region: profile.state_region ?? "",
        country: profile.country ?? "",
        postal_code: profile.postal_code ?? "",
      });
    }
  }, [profile]);

  const set = (key: keyof ProfileUpdate) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSave = () => {
    updateMutation.mutate(form, {
      onSuccess: () => toast.success("Profile updated"),
      onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to save"),
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  const initials = getInitials(profile?.full_name, profile?.email);
  const displayName = profile?.full_name || profile?.email?.split("@")[0] || "Your Name";
  const location = [form.city, form.state_region, form.country].filter(Boolean).join(", ");

  return (
    <div>
      <div className="rounded-sm border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <h3 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-7">
          Profile
        </h3>

        <div className="space-y-6">
          {/* ── Meta card ── */}
          <div className="p-5 border border-gray-200 rounded-sm dark:border-gray-800 lg:p-6">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex flex-col items-center w-full gap-6 xl:flex-row">
                <div className="relative w-20 h-20 shrink-0">
                  <Avatar className="h-20 w-20 border border-gray-200 dark:border-gray-800">
                    <AvatarImage src={avatarUrl ?? undefined} className="object-cover" />
                    <AvatarFallback className="text-xl font-semibold bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-400">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={avatarUploading}
                    className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-brand-500 text-white shadow-md hover:bg-brand-600 disabled:opacity-60 transition-colors"
                  >
                    {avatarUploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                </div>
                <div className="order-3 xl:order-2">
                  <h4 className="mb-1 text-lg font-semibold text-center text-gray-800 dark:text-white/90 xl:text-left">
                    {displayName}
                  </h4>
                  {profile?.role && (
                    <p className="mb-2 text-sm font-medium text-center text-brand-600 dark:text-brand-400 xl:text-left capitalize">
                      {profile.role}
                    </p>
                  )}
                  <div className="flex flex-col items-center gap-1 text-center xl:flex-row xl:gap-3 xl:text-left">
                    {form.bio && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">{form.bio}</p>
                    )}
                    {form.bio && location && (
                      <div className="hidden h-3.5 w-px bg-gray-300 dark:bg-gray-700 xl:block" />
                    )}
                    {location && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">{location}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center order-2 gap-2 grow xl:order-3 xl:justify-end">
                  <SocialLink icon={<FacebookIcon />} href={form.social_facebook} />
                  <SocialLink icon={<TwitterIcon />} href={form.social_twitter} />
                  <SocialLink icon={<LinkedInIcon />} href={form.social_linkedin} />
                  <SocialLink icon={<InstagramIcon />} href={form.social_instagram} />
                </div>
              </div>
            </div>
          </div>

          {/* ── Personal Information ── */}
          <div className="p-5 border border-gray-200 rounded-sm dark:border-gray-800 lg:p-6">
            <h4 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-6">
              Personal Information
            </h4>
            <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
              <FieldRow label="Full Name">
                <Input value={form.full_name ?? ""} onChange={set("full_name")} placeholder="Jane Smith" />
              </FieldRow>
              <FieldRow label="Email Address">
                <Input value={profile?.email ?? ""} disabled className="opacity-60 cursor-not-allowed" />
              </FieldRow>
              <FieldRow label="Phone">
                <Input type="tel" value={form.phone ?? ""} onChange={set("phone")} placeholder="+1 (555) 000-0000" />
              </FieldRow>
              <FieldRow label="Bio">
                <Input value={form.bio ?? ""} onChange={set("bio")} placeholder="e.g. Senior Inspector" />
              </FieldRow>
            </div>
          </div>

          {/* ── Social Links ── */}
          <div className="p-5 border border-gray-200 rounded-sm dark:border-gray-800 lg:p-6">
            <h4 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-6">
              Social Links
            </h4>
            <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
              <FieldRow label="Facebook">
                <Input value={form.social_facebook ?? ""} onChange={set("social_facebook")} placeholder="https://facebook.com/yourprofile" />
              </FieldRow>
              <FieldRow label="X.com">
                <Input value={form.social_twitter ?? ""} onChange={set("social_twitter")} placeholder="https://x.com/yourhandle" />
              </FieldRow>
              <FieldRow label="LinkedIn">
                <Input value={form.social_linkedin ?? ""} onChange={set("social_linkedin")} placeholder="https://linkedin.com/in/yourprofile" />
              </FieldRow>
              <FieldRow label="Instagram">
                <Input value={form.social_instagram ?? ""} onChange={set("social_instagram")} placeholder="https://instagram.com/yourhandle" />
              </FieldRow>
            </div>
          </div>

          {/* ── Address ── */}
          <div className="p-5 border border-gray-200 rounded-sm dark:border-gray-800 lg:p-6">
            <h4 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-6">
              Address
            </h4>
            <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
              <FieldRow label="Street Address">
                <Input value={form.address_line1 ?? ""} onChange={set("address_line1")} placeholder="123 Main St" />
              </FieldRow>
              <FieldRow label="Apt, Suite, etc.">
                <Input value={form.address_line2 ?? ""} onChange={set("address_line2")} placeholder="Suite 100" />
              </FieldRow>
              <FieldRow label="City">
                <Input value={form.city ?? ""} onChange={set("city")} placeholder="Phoenix" />
              </FieldRow>
              <FieldRow label="State / Province">
                <Input value={form.state_region ?? ""} onChange={set("state_region")} placeholder="Arizona" />
              </FieldRow>
              <FieldRow label="Postal Code">
                <Input value={form.postal_code ?? ""} onChange={set("postal_code")} placeholder="85001" />
              </FieldRow>
              <FieldRow label="Country">
                <Input value={form.country ?? ""} onChange={set("country")} placeholder="United States" />
              </FieldRow>
            </div>
          </div>

          {/* ── Save ── */}
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
