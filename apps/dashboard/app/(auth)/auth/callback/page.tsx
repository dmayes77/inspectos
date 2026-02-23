"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthSession, useExchangeCode, useSetSession } from "@/hooks/use-auth";

function getSafeRedirectPath(nextParam: string | null, fallback = "/app/overview"): string {
  if (!nextParam) return fallback;
  if (!nextParam.startsWith("/")) return fallback;
  if (nextParam.startsWith("//")) return fallback;
  return nextParam;
}

function AuthCallbackPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const exchangeCodeMutation = useExchangeCode();
  const setSessionMutation = useSetSession();
  const { refetch: refetchSession } = useAuthSession();
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
        try {
          await exchangeCodeMutation.mutateAsync({ code });
        } catch (exchangeError) {
          if (!cancelled) {
            setError(exchangeError instanceof Error ? exchangeError.message : "Could not complete sign in.");
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
          try {
            await setSessionMutation.mutateAsync({ accessToken, refreshToken });
          } catch (setSessionError) {
            if (!cancelled) {
              setError(setSessionError instanceof Error ? setSessionError.message : "Could not restore session.");
            }
            return;
          }
        }
      }

      const sessionResult = await refetchSession();
      if (sessionResult.error || !sessionResult.data?.user?.id) {
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
