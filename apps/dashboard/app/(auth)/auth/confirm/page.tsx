"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useConfirmOtp } from "@/hooks/use-auth";

function targetPathForType(type: string | null): string {
  if (type === "recovery") return "/reset-password";
  return "/welcome";
}

function AuthConfirmPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const confirmMutation = useConfirmOtp();
  const [error, setError] = useState<string | null>(null);

  const tokenHash = useMemo(() => searchParams.get("token_hash"), [searchParams]);
  const type = useMemo(() => searchParams.get("type"), [searchParams]);

  useEffect(() => {
    let cancelled = false;

    const verify = async () => {
      if (!tokenHash || !type) {
        if (!cancelled) setError("Verification link is missing required parameters.");
        return;
      }

      try {
        await confirmMutation.mutateAsync({ tokenHash, type });
      } catch (verifyError) {
        if (!cancelled) setError(verifyError instanceof Error ? verifyError.message : "Verification failed.");
        return;
      }

      if (!cancelled) {
        router.replace(targetPathForType(type));
      }
    };

    void verify();
    return () => {
      cancelled = true;
    };
  }, [router, tokenHash, type]);

  if (error) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-6 text-center">
        <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-[50vh] items-center justify-center px-6 text-center">
      <p className="text-sm text-muted-foreground">Confirming your email...</p>
    </div>
  );
}

export default function AuthConfirmPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[50vh] items-center justify-center px-6 text-center"><p className="text-sm text-muted-foreground">Loading...</p></div>}>
      <AuthConfirmPageContent />
    </Suspense>
  );
}
