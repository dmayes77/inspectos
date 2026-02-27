"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { useRequestPasswordReset } from "@/hooks/use-auth";

export default function ForgotPasswordPage() {
  const forgotPasswordMutation = useRequestPasswordReset();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await forgotPasswordMutation.mutateAsync({
        email,
        redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
      });
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : "Unable to send reset link.");
      setIsSubmitting(false);
      return;
    }

    setSent(true);
    setIsSubmitting(false);
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
            Forgot Password
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Enter your email and we&apos;ll send you a reset link.
          </p>
        </div>

        {sent ? (
          <div className="rounded-md border border-green-200 bg-green-50 p-4 text-sm text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400">
            Check your email — a password reset link has been sent to <strong>{email}</strong>.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
                className="h-11 w-full rounded-md border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
              />
            </div>

            {error && (
              <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center rounded-md bg-brand-500 px-4 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-600 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Sending..." : "Send reset link"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
