"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

function getSafeRedirectPath(nextParam: string | null, fallback = "/app/overview"): string {
  if (!nextParam) return fallback;
  if (!nextParam.startsWith("/")) return fallback;
  if (nextParam.startsWith("//")) return fallback;
  return nextParam;
}

function AuthCallbackPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const hasStartedRef = useRef(false);

  const redirectPath = useMemo(() => {
    const requested = searchParams.get("next");
    return getSafeRedirectPath(requested, "/app/overview");
  }, [searchParams]);

  useEffect(() => {
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;

    let cancelled = false;

    const finish = async () => {
      const providerError = searchParams.get("error_description") || searchParams.get("error");
      if (providerError) {
        if (!cancelled) {
          setError(providerError);
        }
        return;
      }

      const code = searchParams.get("code");
      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) {
          if (!cancelled) {
            setError(exchangeError.message);
          }
          return;
        }
      }

      const hash = typeof window !== "undefined" ? window.location.hash : "";
      if (hash.startsWith("#")) {
        const params = new URLSearchParams(hash.slice(1));
        const accessToken = params.get("access_token");
        const refreshToken = params.get("refresh_token");

        if (accessToken && refreshToken) {
          const { error: setSessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (setSessionError) {
            if (!cancelled) {
              setError(setSessionError.message);
            }
            return;
          }
        }
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        if (!cancelled) {
          setError("Authentication link is invalid or expired. Please request a new email.");
        }
        return;
      }

      if (!cancelled) {
        router.replace(redirectPath);
      }
    };

    void finish();

    return () => {
      cancelled = true;
    };
  }, [redirectPath, router, searchParams]);

  if (error) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-6 text-center">
        <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-[50vh] items-center justify-center px-6 text-center">
      <p className="text-sm text-muted-foreground">Completing sign in...</p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[50vh] items-center justify-center px-6 text-center"><p className="text-sm text-muted-foreground">Loading...</p></div>}>
      <AuthCallbackPageContent />
    </Suspense>
  );
}
