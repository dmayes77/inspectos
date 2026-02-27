"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, Eye, EyeOff } from "lucide-react";
import { useAuthSession, useLogout, useResetPassword } from "@/hooks/use-auth";
import { getPasswordPolicyChecks, validatePasswordPolicy } from "@/lib/password-policy";

export default function ResetPasswordPage() {
  const router = useRouter();
  const { data: sessionData, isLoading: isLoadingSession } = useAuthSession();
  const resetPasswordMutation = useResetPassword();
  const logoutMutation = useLogout();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const checks = useMemo(() => getPasswordPolicyChecks(password), [password]);

  useEffect(() => {
    if (isLoadingSession) return;
    if (!sessionData?.user?.id) {
      setIsReady(false);
      setError("This reset link is invalid or expired. Request a new one.");
      return;
    }
    setError(null);
    setIsReady(true);
  }, [isLoadingSession, sessionData?.user?.id]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!isReady) {
      setError("Reset session is not ready. Reload the page or request a new link.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    const passwordError = validatePasswordPolicy(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    setIsSubmitting(true);
    try {
      await resetPasswordMutation.mutateAsync({ password });
    } catch (updateError) {
      setIsSubmitting(false);
      setError(updateError instanceof Error ? updateError.message : "Failed to update password.");
      return;
    }
    setIsSubmitting(false);

    setSuccess("Password updated successfully. Redirecting to sign in...");
    setTimeout(() => {
      void logoutMutation.mutateAsync();
      router.push("/login");
    }, 1200);
  };

  return (
    <div className="flex flex-col flex-1 w-full">
      <div className="w-full max-w-md pt-8 mx-auto px-6 mb-5">
        <Link
          href="/login"
          className="inline-flex items-center gap-1 text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to sign in
        </Link>
      </div>

      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto px-6 pb-12">
        <div className="mb-5 sm:mb-8">
          <h1 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90 sm:text-3xl">
            Reset Password
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Create a new password for your account.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
              New Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a new password"
                required
                className="h-11 w-full rounded-md border border-gray-300 bg-transparent px-4 py-2.5 pr-11 text-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <div className="mt-2 space-y-1 text-xs text-gray-500 dark:text-gray-400">
              {checks.map((check) => (
                <p key={check.key} className={check.met ? "text-green-600 dark:text-green-400" : undefined}>
                  {check.met ? "✓" : "•"} {check.label}
                </p>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
              Confirm Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your new password"
                required
                className="h-11 w-full rounded-md border border-gray-300 bg-transparent px-4 py-2.5 pr-11 text-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((value) => !value)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {error && <p className="text-sm text-red-500 dark:text-red-400">{error}</p>}
          {success && <p className="text-sm text-green-600 dark:text-green-400">{success}</p>}

          <button
            type="submit"
            disabled={isSubmitting || !isReady}
            className="flex w-full items-center justify-center rounded-md bg-brand-500 px-4 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-600 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Updating..." : "Update Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
