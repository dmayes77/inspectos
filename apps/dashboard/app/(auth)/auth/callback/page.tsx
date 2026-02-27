"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useExchangeCode, useSetSession } from "@/hooks/use-auth";

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

function getApiBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api").replace(/\/+$/, "");
}

function AuthCallbackPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
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
      console.info("[auth:callback] entered", {
        href: typeof window !== "undefined" ? window.location.href : "server",
      });

      const providerError = searchParams.get("error_description") || searchParams.get("error");
      if (providerError) {
        console.warn("[auth:callback] provider error", { providerError });
        if (!cancelled) {
          setError(providerError);
        }
        return;
      }

      const tokenHash = searchParams.get("token_hash");
      const otpType = searchParams.get("type");
      if (tokenHash && otpType) {
        console.info("[auth:callback] token_hash flow -> api /auth/confirm", {
          type: otpType,
          tokenHashLength: tokenHash.length,
          next: redirectPath,
        });
        if (typeof window !== "undefined") {
          const confirmUrl = new URL(`${getApiBaseUrl()}/auth/confirm`);
          confirmUrl.searchParams.set("token_hash", tokenHash);
          confirmUrl.searchParams.set("type", otpType);
          confirmUrl.searchParams.set("next", redirectPath);
          window.location.replace(confirmUrl.toString());
        }
        return;
      }

      const code = searchParams.get("code");
      let completedWithServerSession = false;
      if (code) {
        try {
          console.info("[auth:callback] code flow -> exchange session");
          await withTimeout(exchangeCodeMutation.mutateAsync({ code }), 10000, "Sign-in exchange timed out.");
          completedWithServerSession = true;
          console.info("[auth:callback] exchange session success");
        } catch (exchangeError) {
          console.warn("[auth:callback] exchange session failed", { exchangeError });
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
            console.info("[auth:callback] hash token flow -> set session");
            await withTimeout(
              setSessionMutation.mutateAsync({ accessToken, refreshToken }),
              10000,
              "Session restore timed out."
            );
            completedWithServerSession = true;
            console.info("[auth:callback] set session success");
          } catch (setSessionError) {
            console.warn("[auth:callback] set session failed", { setSessionError });
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
          console.info("[auth:callback] email verified without session -> /welcome?confirmed=1");
          router.replace("/welcome?confirmed=1");
        }
        return;
      }

      if (!cancelled) {
        console.info("[auth:callback] completed -> redirect", { redirectPath });
        router.replace(redirectPath);
      }
    };

    void finish();

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [exchangeCodeMutation, redirectPath, router, searchParams, setSessionMutation]);

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
