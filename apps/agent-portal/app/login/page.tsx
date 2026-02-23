"use client";

import Link from "next/link";
import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { setStoredWorkspaceSlug } from "@/lib/workspace/selection";

function AgentPortalLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token")?.trim() ?? "";
  const agentId = searchParams.get("agent")?.trim() ?? "";
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apiBase = useMemo(() => {
    return process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
  }, []);

  const canConsumeInvite = Boolean(token && agentId);

  const handleSignIn = async () => {
    if (!canConsumeInvite) return;

    setIsSubmitting(true);
    setError(null);
    try {
      const response = await fetch(`${apiBase}/agent-portal/auth/consume-link`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          agent_id: agentId,
        }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.success) {
        const message = payload?.error?.message ?? "Sign-in link is invalid or expired.";
        setError(message);
        return;
      }

      const workspaceSlug = payload?.data?.workspace?.slug;
      if (workspaceSlug) {
        setStoredWorkspaceSlug(workspaceSlug);
      }
      router.replace(workspaceSlug ? `/orders?business=${encodeURIComponent(workspaceSlug)}` : "/workspaces");
    } catch {
      setError("Unable to complete sign in. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "2rem" }}>
      <section
        style={{
          width: "min(560px, 100%)",
          border: "1px solid var(--border)",
          background: "var(--card)",
          borderRadius: "16px",
          padding: "2rem",
          boxShadow: "0 12px 40px rgba(15, 23, 42, 0.06)",
        }}
      >
        <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.85rem", letterSpacing: "0.08em", textTransform: "uppercase" }}>
          InspectOS Agent Portal
        </p>
        <h1 style={{ marginTop: "0.5rem", marginBottom: "0.75rem", fontSize: "1.8rem", lineHeight: 1.2 }}>Sign in</h1>
        <p style={{ marginTop: 0, color: "var(--muted)", lineHeight: 1.6 }}>
          Access to this portal is managed by your tenant admin. Use your invite link to continue.
        </p>

        {canConsumeInvite ? (
          <div style={{ display: "grid", gap: "0.75rem", marginTop: "1rem" }}>
            <button
              type="button"
              onClick={handleSignIn}
              disabled={isSubmitting}
              style={{
                marginTop: "0.25rem",
                border: "none",
                borderRadius: "10px",
                padding: "0.75rem 0.9rem",
                fontWeight: 600,
                background: "var(--accent)",
                color: "white",
                cursor: isSubmitting ? "default" : "pointer",
                opacity: isSubmitting ? 0.8 : 1,
              }}
            >
              {isSubmitting ? "Signing in..." : "Sign in"}
            </button>
            {error && (
              <p style={{ margin: 0, color: "#b42318", fontSize: "0.9rem" }}>
                {error}
              </p>
            )}
          </div>
        ) : (
          <p style={{ marginTop: "1rem", color: "var(--muted)", fontSize: "0.9rem" }}>
            Invite link missing. Ask your tenant admin to send a new portal invite.
          </p>
        )}

        <p style={{ marginTop: "1rem", color: "var(--muted)", fontSize: "0.9rem" }}>
          Need access? <Link href="/register">Request access</Link>
        </p>
      </section>
    </main>
  );
}

export default function AgentPortalLoginPage() {
  return (
    <Suspense fallback={null}>
      <AgentPortalLoginContent />
    </Suspense>
  );
}
