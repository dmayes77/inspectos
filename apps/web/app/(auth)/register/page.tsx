"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, Eye, EyeOff, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { getPasswordPolicyChecks, validatePasswordPolicy } from "@/lib/password-policy";

function getEmailRedirectUrl(): string {
  const configuredBaseUrl =
    process.env.NEXT_PUBLIC_WEB_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    (typeof window !== "undefined" ? window.location.origin : "http://localhost:3000");
  const baseUrl = configuredBaseUrl.replace(/\/+$/, "");
  return `${baseUrl}/welcome`;
}

function RegisterPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [view, setView] = useState<"form" | "awaiting_confirmation">("form");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pendingEmail, setPendingEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const passwordChecks = getPasswordPolicyChecks(password);

  useEffect(() => {
    let active = true;

    const checkSessionAndContinue = async () => {
      const { data } = await supabase.auth.getSession();
      if (!active) return;
      if (data.session) {
        router.push("/welcome");
      }
    };

    checkSessionAndContinue();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        router.push("/welcome");
      }
    });

    const interval = window.setInterval(checkSessionAndContinue, 3000);

    return () => {
      active = false;
      authListener.subscription.unsubscribe();
      window.clearInterval(interval);
    };
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);

    if (!fullName.trim() || !email.trim()) {
      setError("Complete all required fields.");
      return;
    }

    const passwordError = validatePasswordPolicy(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    setIsSubmitting(true);
    try {
      const signUpResult = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName.trim() },
          emailRedirectTo: getEmailRedirectUrl(),
        },
      });

      if (signUpResult.error) {
        throw new Error(signUpResult.error.message);
      }

      if (signUpResult.data.session) {
        router.push("/welcome");
        return;
      }

      setPendingEmail(email.trim());
      setView("awaiting_confirmation");
      setNotice("Waiting for email confirmation.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create account.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (!pendingEmail) return;
    setIsResending(true);
    setError(null);
    try {
      const { error: resendError } = await supabase.auth.resend({
        type: "signup",
        email: pendingEmail,
        options: { emailRedirectTo: getEmailRedirectUrl() },
      });
      if (resendError) {
        throw new Error(resendError.message);
      }
      setNotice("Confirmation email resent.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to resend confirmation email.");
    } finally {
      setIsResending(false);
    }
  };

  if (view === "awaiting_confirmation") {
    return (
      <div className="flex flex-col flex-1 w-full overflow-y-auto">
        <div className="w-full max-w-md pt-8 mx-auto px-6 mb-5">
          <Link
            href="/login"
            className="inline-flex items-center gap-1 text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to sign in
          </Link>
        </div>

        <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto px-6 pb-12 text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 dark:bg-brand-950/30">
            <Loader2 className="h-7 w-7 animate-spin text-brand-600 dark:text-brand-400" />
          </div>

          <h1 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90 sm:text-3xl">
            Waiting for email confirmation
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            We sent a confirmation link to <span className="font-medium">{pendingEmail}</span>.
            Confirm your email to continue to onboarding.
          </p>

          <div className="mt-6 space-y-2 text-left text-sm text-gray-600 dark:text-gray-300">
            <p>1. Open your inbox and find the InspectOS confirmation email.</p>
            <p>2. Click the confirm link.</p>
            <p>3. You will be redirected to onboarding automatically.</p>
          </div>

          {notice ? (
            <p className="mt-4 text-sm text-emerald-600 dark:text-emerald-400">{notice}</p>
          ) : null}
          {error ? (
            <p className="mt-2 text-sm text-red-500 dark:text-red-400">{error}</p>
          ) : null}

          <button
            type="button"
            onClick={handleResend}
            disabled={isResending}
            className="mt-6 inline-flex w-full items-center justify-center rounded-lg border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-900"
          >
            {isResending ? "Resending..." : "Resend confirmation email"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 w-full overflow-y-auto">
      <div className="w-full max-w-md pt-8 mx-auto px-6 mb-5">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to home
        </Link>
      </div>

      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto px-6 pb-12">
        <div className="mb-5 sm:mb-8">
          <h1 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90 sm:text-3xl">
            Create Account
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Start with your account details. Business setup comes next.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder="Jane Smith"
              required
              className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@company.com"
              required
              className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
              Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Create a password"
                minLength={10}
                required
                className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 pr-11 text-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <div className="mt-2 space-y-1">
              {passwordChecks.map((check) => (
                <p
                  key={check.key}
                  className={`text-xs ${
                    check.met ? "text-emerald-600 dark:text-emerald-400" : "text-gray-500 dark:text-gray-400"
                  }`}
                >
                  {check.met ? "✓" : "○"} {check.label}
                </p>
              ))}
            </div>
          </div>

          {error ? (
            <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
          ) : null}
          {notice ? (
            <p className="text-sm text-emerald-600 dark:text-emerald-400">{notice}</p>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center rounded-lg bg-brand-500 px-4 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-sm text-center text-gray-600 dark:text-gray-400">
          Already have an account?{" "}
          <Link
            href={searchParams.get("url") ? `/login?url=${encodeURIComponent(searchParams.get("url") as string)}` : "/login"}
            className="font-medium text-brand-500 hover:text-brand-600 dark:text-brand-400"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">Loading...</div>}>
      <RegisterPageContent />
    </Suspense>
  );
}
