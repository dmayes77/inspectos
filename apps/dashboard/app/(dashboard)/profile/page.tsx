"use client";

import { useState, useEffect, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IdPageLayout } from "@/components/shared/id-page-layout";
import { extractDomain, logoDevUrl } from "@inspectos/shared/utils/logos";
import {
  CameraIcon,
  LoaderIcon,
} from "@/components/icons";
import { Globe, Plus, Trash2 } from "lucide-react";
import { useProfile, useUpdateProfile, type ProfileUpdate } from "@/hooks/use-profile";
import { toast } from "sonner";
import { uploadCurrentUserAvatar } from "@/lib/api/media";

type SocialPreview = {
  label: string;
  url: string | null;
  icon: React.ReactNode;
  surfaceClass: string;
};

const SOCIAL_LABEL_BY_DOMAIN: Record<string, string> = {
  "facebook.com": "Facebook",
  "x.com": "X",
  "twitter.com": "X",
  "linkedin.com": "LinkedIn",
  "lnkd.in": "LinkedIn",
  "instagram.com": "Instagram",
  "youtube.com": "YouTube",
  "youtu.be": "YouTube",
  "tiktok.com": "TikTok",
  "threads.net": "Threads",
  "snapchat.com": "Snapchat",
  "pinterest.com": "Pinterest",
  "reddit.com": "Reddit",
  "discord.com": "Discord",
  "discord.gg": "Discord",
};

const SOCIAL_FIELD_KEYS = [
  "social_facebook",
  "social_twitter",
  "social_linkedin",
  "social_instagram",
] as const;

type SocialFieldKey = (typeof SOCIAL_FIELD_KEYS)[number];

function parseSocialPreview(urlValue: string): SocialPreview {
  const normalized = urlValue.trim().toLowerCase();
  const value = normalized.startsWith("http://") || normalized.startsWith("https://")
    ? normalized
    : `https://${normalized}`;

  try {
    const domain = extractDomain(value);
    const hostname = domain?.replace(/^www\./, "") ?? "";
    const matchedKey = Object.keys(SOCIAL_LABEL_BY_DOMAIN).find(
      (key) => hostname === key || hostname.endsWith(`.${key}`)
    );
    const label = matchedKey ? SOCIAL_LABEL_BY_DOMAIN[matchedKey] : hostname || "Website";
    const logoUrl = logoDevUrl(hostname, { size: 64, format: "png", theme: "light", retina: true });

    if (logoUrl) {
      return {
        label,
        url: logoUrl,
        icon: (
          <img
            src={logoUrl}
            alt={`${label} logo`}
            className="h-4 w-4 object-contain"
            loading="lazy"
            decoding="async"
          />
        ),
        surfaceClass: "bg-white border-gray-200 dark:bg-gray-900 dark:border-gray-700",
      };
    }

    return {
      label,
      url: null,
      icon: <Globe className="h-4 w-4 text-sky-600 dark:text-sky-400" />,
      surfaceClass: "bg-sky-50 border-sky-200 dark:bg-sky-950/30 dark:border-sky-800",
    };
  } catch {
    return {
      label: "Link",
      url: null,
      icon: <Globe className="h-4 w-4 text-sky-600 dark:text-sky-400" />,
      surfaceClass: "bg-sky-50 border-sky-200 dark:bg-sky-950/30 dark:border-sky-800",
    };
  }
}

function buildSocialLinksFromProfile(profile: {
  social_links?: string[] | null;
  social_facebook?: string | null;
  social_twitter?: string | null;
  social_linkedin?: string | null;
  social_instagram?: string | null;
}): string[] {
  const fromArray = Array.isArray(profile.social_links)
    ? profile.social_links.map((value) => value?.trim() ?? "").filter(Boolean)
    : [];
  if (fromArray.length > 0) {
    return fromArray;
  }

  const links = [
    profile.social_facebook,
    profile.social_twitter,
    profile.social_linkedin,
    profile.social_instagram,
  ]
    .map((value) => value?.trim() ?? "")
    .filter(Boolean);

  return links.length > 0 ? links : [""];
}

function applySocialLinksToPayload(base: ProfileUpdate, links: string[]): ProfileUpdate {
  const sanitized = links.map((link) => link.trim()).filter(Boolean);
  const next = { ...base };
  next.social_links = sanitized;

  for (let index = 0; index < SOCIAL_FIELD_KEYS.length; index += 1) {
    const key = SOCIAL_FIELD_KEYS[index] as SocialFieldKey;
    next[key] = sanitized[index] ?? null;
  }

  return next;
}

function SocialLink({
  icon,
  href,
  label,
  surfaceClass,
}: {
  icon: React.ReactNode;
  href?: string | null;
  label: string;
  surfaceClass: string;
}) {
  return (
    <a
      href={href || "#"}
      target={href ? "_blank" : undefined}
      rel="noreferrer"
      onClick={!href ? (e) => e.preventDefault() : undefined}
      className={`flex h-11 w-11 items-center justify-center rounded-full border text-sm font-medium shadow-theme-xs transition ${surfaceClass} hover:scale-[1.03]`}
      title={label}
      aria-label={label}
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
  const [socialLinks, setSocialLinks] = useState<string[]>([""]);

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
      setSocialLinks(buildSocialLinksFromProfile(profile));
    }
  }, [profile]);

  const set = (key: keyof ProfileUpdate) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSave = () => {
    const payload = applySocialLinksToPayload(form, socialLinks);
    updateMutation.mutate(payload, {
      onSuccess: () => toast.success("Profile updated"),
      onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to save"),
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoaderIcon className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  const initials = getInitials(profile?.full_name, profile?.email);
  const displayName = profile?.full_name || profile?.email?.split("@")[0] || "Your Name";
  const location = [form.city, form.state_region, form.country].filter(Boolean).join(", ");
  const activeSocialLinks = socialLinks.map((link) => link.trim()).filter(Boolean);

  const leftContent = (
    <div className="space-y-6">
      {/* ── Meta card ── */}
      <div className="rounded-md border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/3 lg:p-6">
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
                className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-md bg-brand-500 text-white shadow-md hover:bg-brand-600 disabled:opacity-60 transition-colors"
              >
                {avatarUploading ? <LoaderIcon className="h-3.5 w-3.5 animate-spin" /> : <CameraIcon className="h-3.5 w-3.5" />}
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
              {activeSocialLinks.map((url, index) => {
                const preview = parseSocialPreview(url);
                return (
                  <SocialLink
                    key={`${index}-${url}`}
                    icon={preview.icon}
                    href={url}
                    label={preview.label}
                    surfaceClass={preview.surfaceClass}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── Personal Information ── */}
      <div className="rounded-md border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/3 lg:p-6">
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
      <div className="rounded-md border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/3 lg:p-6">
        <h4 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-6">
          Social Links
        </h4>
        <div className="space-y-3">
          {socialLinks.map((value, index) => {
            const preview = value.trim() ? parseSocialPreview(value) : null;
            return (
              <div key={`social-link-${index}`} className="flex items-center gap-2">
                <Input
                  value={value}
                  onChange={(event) =>
                    setSocialLinks((prev) => prev.map((item, itemIndex) => (itemIndex === index ? event.target.value : item)))
                  }
                  placeholder="https://tiktok.com/@yourhandle or https://youtube.com/@channel"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    setSocialLinks((prev) => {
                      if (prev.length === 1) return [""];
                      return prev.filter((_, itemIndex) => itemIndex !== index);
                    })
                  }
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                {preview ? (
                  <span className="inline-flex min-w-[92px] items-center justify-center gap-1 rounded-md border border-gray-200 bg-gray-50 px-2 py-2 text-xs text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
                    {preview.icon}
                    {preview.label}
                  </span>
                ) : null}
              </div>
            );
          })}
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Add any social URL you use. We detect the platform automatically.
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={() => setSocialLinks((prev) => [...prev, ""])}
            >
              <Plus className="mr-1 h-4 w-4" />
              Add link
            </Button>
          </div>
        </div>
      </div>

      {/* ── Address ── */}
      <div className="rounded-md border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/3 lg:p-6">
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
    </div>
  );

  const rightContent = (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
              <Button onClick={handleSave} disabled={updateMutation.isPending} className="w-full">
                {updateMutation.isPending ? (
              <><LoaderIcon className="mr-2 h-4 w-4 animate-spin" />Saving...</>
                ) : (
                  "Save Changes"
                )}
          </Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Profile Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>Email: <span className="text-foreground">{profile?.email ?? "—"}</span></p>
          <p>Role: <span className="text-foreground capitalize">{profile?.role ?? "—"}</span></p>
          <p>Location: <span className="text-foreground">{location || "—"}</span></p>
        </CardContent>
      </Card>
    </>
  );

  return (
    <IdPageLayout
      title="Profile"
      description="Manage your personal details, avatar, and social links."
      breadcrumb={
        <>
          <Link href="/overview" className="text-muted-foreground transition hover:text-foreground">
            Overview
          </Link>
          <span className="text-muted-foreground">{">"}</span>
          <span className="max-w-[20rem] truncate font-medium">Profile</span>
        </>
      }
      left={leftContent}
      right={rightContent}
    />
  );
}
