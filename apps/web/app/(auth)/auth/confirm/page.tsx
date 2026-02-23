"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { EmailOtpType } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

function targetPathForType(type: string | null): string {
  if (type === "recovery") return "/reset-password";
  return "/welcome";
}

export default function AuthConfirmPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
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

      const { error: verifyError } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: type as EmailOtpType,
      });

      if (verifyError) {
        if (!cancelled) setError(verifyError.message);
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
