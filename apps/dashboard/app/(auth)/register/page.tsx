"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, Eye, EyeOff } from "lucide-react";
import { useResendConfirmation, useSignup } from "@/hooks/use-auth";
import { ApiError } from "@/lib/api/client";
import { getPasswordPolicyChecks, validatePasswordPolicy } from "@/lib/password-policy";

function parseRateLimitCooldownSeconds(error: unknown): number | null {
  if (!(error instanceof ApiError) || error.status !== 429) {
    return null;
  }

  const match = error.message.match(/(\d+)\s*(?:s|sec|secs|second|seconds)\b/i);
  if (!match) {
    return 60;
  }

  const seconds = Number(match[1]);
  return Number.isFinite(seconds) && seconds > 0 ? seconds : 60;
}

function RegisterPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const signupMutation = useSignup();
  const resendMutation = useResendConfirmation();
  const [view, setView] = useState<"form" | "awaiting_confirmation">("form");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pendingEmail, setPendingEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const passwordChecks = getPasswordPolicyChecks(password);
  const isRateLimited = cooldownSeconds > 0;

  useEffect(() => {
    if (!isRateLimited) return;
    const timer = window.setInterval(() => {
      setCooldownSeconds((current) => (current > 0 ? current - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [isRateLimited]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);

    const trimmedEmail = email.trim();
    if (!fullName.trim() || !trimmedEmail) {
      setError("Complete all required fields.");
      return;
    }

    const passwordError = validatePasswordPolicy(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    setIsSubmitting(true);
    console.info("[auth:register] submit", {
      email: trimmedEmail,
    });
    try {
      const signUpResult = await signupMutation.mutateAsync({
        email: trimmedEmail,
        password,
        full_name: fullName.trim(),
      });
      console.info("[auth:register] signup response", {
        requires_email_confirmation: signUpResult.requires_email_confirmation,
        user_id: signUpResult.user?.id ?? null,
      });

      if (!signUpResult.requires_email_confirmation) {
        console.info("[auth:register] no email confirmation required; redirecting to /welcome");
        router.push("/welcome");
        return;
      }

      setPendingEmail(trimmedEmail);
      setView("awaiting_confirmation");
      setNotice("Waiting for email confirmation.");
    } catch (err) {
      const cooldown = parseRateLimitCooldownSeconds(err);
      if (cooldown) {
        setCooldownSeconds((current) => Math.max(current, cooldown));
      }
      setError(err instanceof Error ? err.message : "Could not create account.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (!pendingEmail) return;
    console.info("[auth:register] resend confirmation", {
      email: pendingEmail,
    });
    setIsResending(true);
    setError(null);
    try {
      await resendMutation.mutateAsync({ email: pendingEmail });
      setNotice("Confirmation email resent.");
    } catch (err) {
      const cooldown = parseRateLimitCooldownSeconds(err);
      if (cooldown) {
        setCooldownSeconds((current) => Math.max(current, cooldown));
      }
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
          <h1 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90 sm:text-3xl">
            Check your email
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            We sent a confirmation link to <span className="font-medium">{pendingEmail}</span>.
            Confirm your email on this device and continue to onboarding from that link.
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
          {isRateLimited ? (
            <p className="mt-2 text-sm text-amber-600 dark:text-amber-400">
              Please wait {cooldownSeconds}s before trying again.
            </p>
          ) : null}

          <button
            type="button"
            onClick={handleResend}
            disabled={isResending || isRateLimited}
            className="mt-6 inline-flex w-full items-center justify-center rounded-md border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-900"
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
              className="h-11 w-full rounded-md border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
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
              className="h-11 w-full rounded-md border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
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
                className="h-11 w-full rounded-md border border-gray-300 bg-transparent px-4 py-2.5 pr-11 text-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
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
          {isRateLimited ? (
            <p className="text-sm text-amber-600 dark:text-amber-400">
              Too many attempts. Try again in {cooldownSeconds}s.
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting || isRateLimited}
            className="flex w-full items-center justify-center rounded-md bg-brand-500 px-4 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
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
