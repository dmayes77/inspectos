"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { AdminShell } from "@/layout/admin-shell";
import { BrandColorProvider } from "@/context/brand-color";
import { useGet } from "@/hooks/crud";
import { useApiClient } from "@/lib/api/tenant-context";
import type { UserProfile } from "@/hooks/use-profile";

export function AdminLayoutClient({ children }: { children: ReactNode }) {
  const router = useRouter();
  // undefined = still checking, null = no session, Session = authenticated
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const apiClient = useApiClient();

  useEffect(() => {
    // Get initial session then subscribe to auth state changes
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Redirect to login when session is gone — rAF lets open portals clean up first
  useEffect(() => {
    if (session === null) {
      const returnTo = typeof window !== "undefined"
        ? `${window.location.pathname}${window.location.search}`
        : "/app/overview";
      requestAnimationFrame(() => router.replace(`/login?url=${encodeURIComponent(returnTo)}`));
    }
  }, [session, router]);

  const isAuthenticated = session != null;

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
