"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { supabase } from "@/lib/supabase";

const REGISTER_API_URL = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api"}/auth/register`;
const CHECKOUT_API_URL = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api"}/auth/stripe-checkout`;

type PlanCode = "growth" | "team";

const PLAN_OPTIONS = [
  {
    code: "growth" as PlanCode,
    name: "Growth",
    monthly: 399,
    includedInspectors: 1,
    maxInspectors: 5,
    additionalInspectorPrice: 89,
  },
  {
    code: "team" as PlanCode,
    name: "Team",
    monthly: 1290,
    includedInspectors: 5,
    maxInspectors: 15,
    additionalInspectorPrice: 79,
  },
];

function WelcomePageContent() {
  const searchParams = useSearchParams();
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [planCode, setPlanCode] = useState<PlanCode>("growth");
  const [inspectorSeats, setInspectorSeats] = useState(PLAN_OPTIONS[0].includedInspectors);
  const [agreeToTrial, setAgreeToTrial] = useState(false);
  const [agreeToAutopay, setAgreeToAutopay] = useState(false);

  const selectedPlan = useMemo(
    () => PLAN_OPTIONS.find((plan) => plan.code === planCode) ?? PLAN_OPTIONS[0],
    [planCode]
  );

  useEffect(() => {
    let active = true;
    const init = async () => {
      const { data } = await supabase.auth.getSession();
      if (!active) return;
      setAccessToken(data.session?.access_token ?? null);
      setIsLoadingSession(false);
    };
    init();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setAccessToken(session?.access_token ?? null);
      setIsLoadingSession(false);
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    setInspectorSeats((current) =>
      Math.max(selectedPlan.includedInspectors, Math.min(selectedPlan.maxInspectors, current))
    );
  }, [selectedPlan.includedInspectors, selectedPlan.maxInspectors]);

  const handleContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!accessToken) {
      setError("Sign in from your confirmation email link to continue setup.");
      return;
    }
    if (!companyName.trim()) {
      setError("Business name is required.");
      return;
    }
    if (!agreeToTrial || !agreeToAutopay) {
      setError("Accept the trial and billing terms to continue.");
      return;
    }

    const normalizedInspectorSeats = Math.max(
      selectedPlan.includedInspectors,
      Math.min(selectedPlan.maxInspectors, inspectorSeats)
    );

    setIsSubmitting(true);
    try {
      const registerResponse = await fetch(REGISTER_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          company_name: companyName.trim(),
          allow_existing_membership: true,
          inspector_seat_count: normalizedInspectorSeats,
          selected_plan: {
            code: selectedPlan.code,
            name: selectedPlan.name,
            baseMonthlyPrice: selectedPlan.monthly,
            includedInspectors: selectedPlan.includedInspectors,
            maxInspectors: selectedPlan.maxInspectors,
            additionalInspectorPrice: selectedPlan.additionalInspectorPrice,
          },
          trial: {
            enabled: true,
            days: 30,
            consented_to_trial: true,
            consented_to_autopay: true,
          },
        }),
      });

      const registerPayload = await registerResponse.json();
      if (!registerResponse.ok) {
        throw new Error(registerPayload?.error || "Failed to create business.");
      }

      const tenantId = registerPayload?.data?.business?.id as string | undefined;
      if (!tenantId) {
        throw new Error("Business created but missing tenant reference.");
      }

      const checkoutResponse = await fetch(CHECKOUT_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          tenant_id: tenantId,
          plan_code: selectedPlan.code,
          trial_days: 30,
          inspector_seat_count: normalizedInspectorSeats,
        }),
      });

      const checkoutPayload = await checkoutResponse.json();
      if (!checkoutResponse.ok || !checkoutPayload?.data?.url) {
        throw new Error(checkoutPayload?.error || "Failed to start Stripe checkout.");
      }

      window.location.href = checkoutPayload.data.url as string;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not continue to secure checkout.");
      setIsSubmitting(false);
    }
  };

  if (isLoadingSession) {
    return <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">Loading...</div>;
  }

  if (!accessToken) {
    return (
      <div className="flex flex-col flex-1 w-full overflow-y-auto">
        <div className="w-full max-w-md pt-8 mx-auto px-6 mb-5">
          <Link
            href="/login?url=/welcome"
            className="inline-flex items-center gap-1 text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            <ChevronLeft className="w-4 h-4" />
            Go to sign in
          </Link>
        </div>
        <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto px-6 pb-12">
          <h1 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90 sm:text-3xl">
            Confirm your email first
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Open the confirmation email and use that link so you arrive here signed in.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 w-full overflow-y-auto">
      <div className="w-full max-w-xl pt-8 mx-auto px-6 mb-5">
        <Link
          href="/login"
          className="inline-flex items-center gap-1 text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </Link>
      </div>

      <div className="flex flex-col justify-center flex-1 w-full max-w-xl mx-auto px-6 pb-12">
        <div className="mb-6">
          <h1 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90 sm:text-3xl">
            Welcome to InspectOS
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Complete your business setup, then continue to secure Stripe checkout for your 30-day trial.
          </p>
          {searchParams.get("stripe") === "cancel" ? (
            <p className="mt-3 text-sm text-amber-600 dark:text-amber-400">
              Stripe checkout was canceled. You can continue setup and try again.
            </p>
          ) : null}
        </div>

        <form onSubmit={handleContinue} className="space-y-5">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
              Business Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={companyName}
              onChange={(event) => setCompanyName(event.target.value)}
              placeholder="Acme Inspections"
              required
              className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
            />
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-400">Choose a subscription</p>
            {PLAN_OPTIONS.map((plan) => (
              <label
                key={plan.code}
                className={`flex cursor-pointer items-start gap-3 rounded-lg border px-4 py-3 ${
                  planCode === plan.code
                    ? "border-brand-500 bg-brand-50/50 dark:border-brand-700 dark:bg-brand-950/20"
                    : "border-gray-300 dark:border-gray-700"
                }`}
              >
                <input
                  type="radio"
                  name="plan"
                  value={plan.code}
                  checked={planCode === plan.code}
                  onChange={() => setPlanCode(plan.code)}
                  className="mt-1"
                />
                <div className="text-sm">
                  <p className="font-semibold text-gray-900 dark:text-gray-100">
                    {plan.name} - ${plan.monthly}/mo
                  </p>
                  <p className="text-gray-600 dark:text-gray-400">
                    Includes {plan.includedInspectors}, up to {plan.maxInspectors}, then ${plan.additionalInspectorPrice}/seat
                  </p>
                </div>
              </label>
            ))}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
              Number of Inspectors
            </label>
            <input
              type="number"
              min={selectedPlan.includedInspectors}
              max={selectedPlan.maxInspectors}
              value={inspectorSeats}
              onChange={(event) => setInspectorSeats(Number(event.target.value))}
              className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Allowed range for {selectedPlan.name}: {selectedPlan.includedInspectors} to {selectedPlan.maxInspectors}.
            </p>
          </div>

          <label className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={agreeToTrial}
              onChange={(event) => setAgreeToTrial(event.target.checked)}
              className="mt-1"
            />
            I agree to start a 30-day free trial.
          </label>
          <label className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={agreeToAutopay}
              onChange={(event) => setAgreeToAutopay(event.target.checked)}
              className="mt-1"
            />
            I authorize recurring charges after trial ends based on my selected plan and inspector seats.
          </label>

          {error ? <p className="text-sm text-red-500 dark:text-red-400">{error}</p> : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center rounded-lg bg-brand-500 px-4 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Preparing secure checkout..." : "Continue to secure checkout"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function WelcomePage() {
  return (
    <Suspense fallback={<div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">Loading...</div>}>
      <WelcomePageContent />
    </Suspense>
  );
}
