"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthSession, useConfirmOtp, useExchangeCode, useSetSession } from "@/hooks/use-auth";

function getSafeRedirectPath(nextParam: string | null, fallback = "/overview"): string {
  if (!nextParam) return fallback;
  if (!nextParam.startsWith("/")) return fallback;
  if (nextParam.startsWith("//")) return fallback;
  return nextParam;
}

function AuthCallbackPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const confirmOtpMutation = useConfirmOtp();
  const exchangeCodeMutation = useExchangeCode();
  const setSessionMutation = useSetSession();
  const { refetch: refetchSession } = useAuthSession();
  const [error, setError] = useState<string | null>(null);
  const hasStartedRef = useRef(false);

  const redirectPath = useMemo(() => {
    const requested = searchParams.get("next");
    return getSafeRedirectPath(requested, "/overview");
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

      const tokenHash = searchParams.get("token_hash");
      const otpType = searchParams.get("type");
      if (tokenHash && otpType) {
        try {
          await confirmOtpMutation.mutateAsync({ tokenHash, type: otpType });
        } catch (confirmError) {
          if (!cancelled) {
            setError(confirmError instanceof Error ? confirmError.message : "Could not verify authentication link.");
          }
          return;
        }
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

      let sessionResult: Awaited<ReturnType<typeof refetchSession>> | null = null;
      try {
        sessionResult = await refetchSession();
      } catch (sessionError) {
        if (!cancelled) {
          setError(
            sessionError instanceof Error
              ? sessionError.message
              : "Authentication link is invalid or expired. Please request a new email."
          );
        }
        return;
      }

      if (sessionResult.error || !sessionResult.data?.user?.id) {
        if (!cancelled) {
          // Some Supabase email confirmation links verify the address without creating a session.
          // In that case, send the user to login instead of leaving this callback in a loading state.
          if (otpType === "email") {
            router.replace(`/login?confirmed=1&url=${encodeURIComponent(redirectPath)}`);
            return;
          }
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
  }, [confirmOtpMutation, exchangeCodeMutation, redirectPath, refetchSession, router, searchParams, setSessionMutation]);

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
