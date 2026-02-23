"use client";

import { ReactNode, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { AdminShell } from "@/layout/admin-shell";
import { BrandColorProvider } from "@/context/brand-color";
import { useGet } from "@/hooks/crud";
import { useApiClient } from "@/lib/api/tenant-context";
import type { UserProfile } from "@/hooks/use-profile";
import { useAuthSession } from "@/hooks/use-auth";

type SessionUser = { id: string; email: string | null } | null | undefined;

export function AdminLayoutClient({ children }: { children: ReactNode }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: sessionData, isLoading: isCheckingSession } = useAuthSession();
  const sessionUser: SessionUser =
    isCheckingSession ? undefined : (sessionData?.user ? sessionData.user : null);
  const lastUserIdRef = useRef<string | null>(null);
  const apiClient = useApiClient();

  useEffect(() => {
    const currentUserId = sessionUser?.id ?? null;

    if (lastUserIdRef.current && lastUserIdRef.current !== currentUserId) {
      // Prevent cached tenant-scoped data from leaking between users/businesses.
      queryClient.clear();
    }

    if (currentUserId === null) {
      queryClient.clear();
    }

    lastUserIdRef.current = currentUserId;
  }, [queryClient, sessionUser?.id]);

  // Redirect to login when session is gone — rAF lets open portals clean up first
  useEffect(() => {
    if (sessionUser === null) {
      const returnTo = typeof window !== "undefined"
        ? `${window.location.pathname}${window.location.search}`
        : "/overview";
      requestAnimationFrame(() => router.replace(`/login?url=${encodeURIComponent(returnTo)}`));
    }
  }, [sessionUser, router]);

  const isAuthenticated = sessionUser != null;

  const { data: profile } = useGet<UserProfile>(
    "profile",
    () => apiClient.get<UserProfile>("/admin/profile"),
    { enabled: isAuthenticated, retry: false }
  );

  if (!isAuthenticated) return null;

  const user = profile
    ? {
        name: profile.full_name || profile.email,
        email: profile.email,
        avatarUrl: profile.avatar_url ?? undefined,
      }
    : undefined;

  return (
    <AdminShell user={user}>
      <BrandColorProvider />
      {children}
    </AdminShell>
  );
}
