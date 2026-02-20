"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, ChevronLeft } from "lucide-react";
import { supabase } from "@/lib/supabase";

const REGISTER_API_URL = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api"}/auth/register`;

type PlanCode = "growth" | "team";

const PLAN_OPTIONS: Array<{
  code: PlanCode;
  name: string;
  baseMonthlyPrice: number;
  includedInspectors: number;
  maxInspectors: number;
  additionalInspectorPrice: number;
}> = [
  {
    code: "growth",
    name: "Growth",
    baseMonthlyPrice: 399,
    includedInspectors: 1,
    maxInspectors: 5,
    additionalInspectorPrice: 89,
  },
  {
    code: "team",
    name: "Team",
    baseMonthlyPrice: 1290,
    includedInspectors: 5,
    maxInspectors: 15,
    additionalInspectorPrice: 79,
  },
];

function RegisterPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    companyName: "",
    companySlug: "",
    planCode: "growth" as PlanCode,
    agreeToTrial: false,
    agreeToAutopay: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (step === 1) {
      if (!form.fullName.trim() || !form.email.trim() || form.password.length < 8) {
        setError("Complete all required account fields.");
        return;
      }
      setError(null);
      setStep(2);
      return;
    }

    if (step === 2) {
      if (!form.companyName.trim()) {
        setError("Company name is required.");
        return;
      }
      setError(null);
      setStep(3);
      return;
    }

    if (
      !form.agreeToTrial ||
      !form.agreeToAutopay
    ) {
      setError("Accept trial + autopay terms to continue.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const signUpResult = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: { data: { full_name: form.fullName } },
      });

      if (signUpResult.error) throw new Error(signUpResult.error.message);

      if (!signUpResult.data.session) {
        const signInResult = await supabase.auth.signInWithPassword({
          email: form.email,
          password: form.password,
        });
        if (signInResult.error) {
          throw new Error("Check your email to confirm your account before signing in.");
        }
      }

      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) throw new Error("Could not start session. Please sign in.");

      const response = await fetch(REGISTER_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          email: form.email,
          company_name: form.companyName,
          company_slug: form.companySlug,
          selected_plan: PLAN_OPTIONS.find((plan) => plan.code === form.planCode),
          trial: {
            enabled: true,
            days: 30,
            consented_to_trial: true,
            consented_to_autopay: true,
          },
        }),
      });

      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error || "Failed to create business.");

      const tenantId = payload?.data?.business?.id as string | undefined;
      if (!tenantId) {
        throw new Error("Business created but missing tenant reference.");
      }

      const checkoutResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api"}/auth/stripe-checkout`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            tenant_id: tenantId,
            plan_code: form.planCode,
            trial_days: 30,
          }),
        }
      );

      const checkoutPayload = await checkoutResponse.json();
      if (!checkoutResponse.ok || !checkoutPayload?.data?.url) {
        throw new Error(checkoutPayload?.error || "Failed to start secure billing checkout.");
      }

      window.location.href = checkoutPayload.data.url;
      return;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  };

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
            Set up your inspection business workspace.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="rounded-lg border border-gray-200 px-4 py-3 text-xs font-medium text-gray-600 dark:border-gray-800 dark:text-gray-300">
            Step {step} of 3
          </div>

          {step === 1 && (
            <>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.fullName}
                  onChange={set("fullName")}
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
                  value={form.email}
                  onChange={set("email")}
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
                    value={form.password}
                    onChange={set("password")}
                    placeholder="Create a password (8+ chars)"
                    minLength={8}
                    required
                    className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 pr-11 text-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Company Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.companyName}
                  onChange={set("companyName")}
                  placeholder="Acme Inspections"
                  required
                  className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Company Slug{" "}
                  <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={form.companySlug}
                  onChange={set("companySlug")}
                  placeholder="acme"
                  className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                />
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-400">Choose a plan</p>
                {PLAN_OPTIONS.map((plan) => (
                  <label
                    key={plan.code}
                    className={`flex cursor-pointer items-start gap-3 rounded-lg border px-4 py-3 ${
                      form.planCode === plan.code
                        ? "border-brand-500 bg-brand-50/50 dark:border-brand-700 dark:bg-brand-950/20"
                        : "border-gray-300 dark:border-gray-700"
                    }`}
                  >
                    <input
                      type="radio"
                      name="plan"
                      value={plan.code}
                      checked={form.planCode === plan.code}
                      onChange={() => setForm((prev) => ({ ...prev, planCode: plan.code }))}
                      className="mt-1"
                    />
                    <div className="text-sm">
                      <p className="font-semibold text-gray-900 dark:text-gray-100">
                        {plan.name} - ${plan.baseMonthlyPrice}/mo
                      </p>
                      <p className="text-gray-600 dark:text-gray-400">
                        {plan.includedInspectors} included inspector seat(s), up to {plan.maxInspectors}, then $
                        {plan.additionalInspectorPrice}/seat
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div className="rounded-lg border border-gray-300 p-4 text-sm dark:border-gray-700">
                <p className="font-semibold text-gray-900 dark:text-gray-100">Secure billing setup with Stripe</p>
                <p className="mt-1 text-gray-600 dark:text-gray-400">
                  Click continue to securely add your payment method in Stripe Checkout. Your card is not stored in InspectOS.
                </p>
              </div>

              <label className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={form.agreeToTrial}
                  onChange={(e) => setForm((prev) => ({ ...prev, agreeToTrial: e.target.checked }))}
                  className="mt-1"
                />
                I agree to start a 30-day free trial.
              </label>
              <label className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={form.agreeToAutopay}
                  onChange={(e) => setForm((prev) => ({ ...prev, agreeToAutopay: e.target.checked }))}
                  className="mt-1"
                />
                I authorize recurring charges after trial ends based on my selected plan.
              </label>
            </>
          )}

          {error && (
            <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
          )}

          <div className="flex items-center gap-3">
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep((prev) => (prev === 3 ? 2 : 1))}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-900"
              >
                Back
              </button>
            )}
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 rounded-lg bg-brand-500 px-4 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {step < 3 ? "Continue" : isSubmitting ? "Preparing secure checkout..." : "Continue to secure checkout"}
            </button>
          </div>
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
