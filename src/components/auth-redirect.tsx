"use client";

import { useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Capacitor } from "@capacitor/core";

interface AuthRedirectProps {
  children?: ReactNode;
  fallback?: ReactNode;
  requireAuth?: boolean;
}

/**
 * Unified authentication and redirect component
 *
 * Handles routing logic for both web and native app:
 * - Redirects authenticated users from marketing pages to their dashboard
 * - Redirects based on user role (Inspector → /inspector/schedule, Admin/Owner/Office → /admin/overview)
 * - In native app: Unauthenticated users are redirected to login (no marketing pages shown)
 * - In web: Unauthenticated users can view public/marketing pages
 * - Works seamlessly in both Capacitor native app and web browser
 *
 * Usage on marketing/public pages:
 * <AuthRedirect>
 *   <MarketingContent />
 * </AuthRedirect>
 *
 * Native app behavior:
 * - Opens app → Checks auth → Redirects to login OR dashboard
 * - Never shows marketing content in native app
 */
export function AuthRedirect({
  children,
  fallback = null,
  requireAuth = false
}: AuthRedirectProps) {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    async function checkAuthAndRedirect() {
      try {
        // Check if we're in a native app
        const isNative = Capacitor.isNativePlatform();

        // Check if user is authenticated
        const response = await fetch("/api/auth/session");
        const session = await response.json();

        if (session?.user) {
          // User is authenticated - redirect to appropriate dashboard
          const role = session.user.role;

          // Route based on user role
          if (role === "INSPECTOR") {
            router.replace("/inspector/schedule");
          } else if (role === "OWNER" || role === "ADMIN" || role === "OFFICE_STAFF") {
            router.replace("/admin/overview");
          } else {
            // Default to inspector if role is unclear
            router.replace("/inspector/schedule");
          }
          setShouldRender(false);
        } else {
          // User is not authenticated
          if (requireAuth || isNative) {
            // Redirect to login if:
            // 1. Auth is required for this page, OR
            // 2. We're in the native app (native app users should never see marketing pages)
            router.replace("/login");
            setShouldRender(false);
          } else {
            // Allow access to public page (web only)
            setShouldRender(true);
          }
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        // On error, redirect to login if auth required or in native app
        const isNative = Capacitor.isNativePlatform();
        if (requireAuth || isNative) {
          router.replace("/login");
          setShouldRender(false);
        } else {
          setShouldRender(true);
        }
      } finally {
        setIsChecking(false);
      }
    }

    checkAuthAndRedirect();
  }, [router, requireAuth]);

  // Show fallback while checking authentication
  if (isChecking) {
    return <>{fallback}</>;
  }

  // Don't render if we're redirecting
  if (!shouldRender) {
    return <>{fallback}</>;
  }

  // Render the page content
  return <>{children}</>;
}

/**
 * Hook to get the dashboard route for a user based on their role
 */
export function getDashboardRoute(role: string): string {
  if (role === "INSPECTOR") {
    return "/inspector/schedule";
  } else if (role === "OWNER" || role === "ADMIN" || role === "OFFICE_STAFF") {
    return "/admin/overview";
  }
  return "/inspector/schedule"; // Default
}

/**
 * Check if the current platform is native (iOS/Android)
 */
export function isNativePlatform(): boolean {
  return Capacitor.isNativePlatform();
}
