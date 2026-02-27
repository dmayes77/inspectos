"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useConfirmOtp, useExchangeCode, useSetSession } from "@/hooks/use-auth";

function getSafeRedirectPath(nextParam: string | null, fallback = "/overview"): string {
  if (!nextParam) return fallback;
  if (!nextParam.startsWith("/")) return fallback;
  if (nextParam.startsWith("//")) return fallback;
  return nextParam;
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(message)), timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }) as Promise<T>;
}

function AuthCallbackPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const confirmOtpMutation = useConfirmOtp();
  const exchangeCodeMutation = useExchangeCode();
  const setSessionMutation = useSetSession();
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
    const timeoutId = window.setTimeout(() => {
      if (cancelled) return;

      const otpType = searchParams.get("type");
      if (otpType === "email") {
        router.replace("/welcome?confirmed=1");
        return;
      }

      setError("Authentication is taking longer than expected. Please retry the link.");
    }, 12000);

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
          await withTimeout(
            confirmOtpMutation.mutateAsync({ tokenHash, type: otpType }),
            10000,
            "Verification timed out."
          );
        } catch (confirmError) {
          if (!cancelled) {
            setError(confirmError instanceof Error ? confirmError.message : "Could not verify authentication link.");
          }
          return;
        }
      }

      const code = searchParams.get("code");
      let completedWithServerSession = false;
      if (code) {
        try {
          await withTimeout(exchangeCodeMutation.mutateAsync({ code }), 10000, "Sign-in exchange timed out.");
          completedWithServerSession = true;
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
            await withTimeout(
              setSessionMutation.mutateAsync({ accessToken, refreshToken }),
              10000,
              "Session restore timed out."
            );
            completedWithServerSession = true;
          } catch (setSessionError) {
            if (!cancelled) {
              setError(setSessionError instanceof Error ? setSessionError.message : "Could not restore session.");
            }
            return;
          }
        }
      }

      // For email confirmation links that do not issue a session, send users to sign in.
      if (otpType === "email" && !completedWithServerSession) {
        if (!cancelled) {
          router.replace("/welcome?confirmed=1");
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
      clearTimeout(timeoutId);
    };
  }, [confirmOtpMutation, exchangeCodeMutation, redirectPath, router, searchParams, setSessionMutation]);

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
