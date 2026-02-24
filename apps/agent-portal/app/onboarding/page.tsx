"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { setStoredWorkspaceSlug } from "@/lib/workspace/selection";

type InviteProfile = {
  name: string;
  email: string;
  phone: string;
};

function AgentPortalOnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token")?.trim() ?? "";
  const agentId = searchParams.get("agent")?.trim() ?? "";
  const [profile, setProfile] = useState<InviteProfile>({
    name: "",
    email: "",
    phone: "",
  });
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoadingInvite, setIsLoadingInvite] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apiBase = useMemo(() => process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api", []);

  useEffect(() => {
    let mounted = true;
    const loadInvite = async () => {
      if (!token || !agentId) {
        setError("Invite link is missing required details.");
        setIsLoadingInvite(false);
        return;
      }

      try {
        const response = await fetch(`${apiBase}/agent-portal/auth/consume-link`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, agent_id: agentId }),
        });
        const payload = await response.json().catch(() => null);
        if (!response.ok || !payload?.success) {
          if (mounted) {
            setError(payload?.error?.message ?? "Invite link is invalid or expired.");
          }
          return;
        }

        const workspaceSlug = payload?.data?.workspace?.slug;
        if (workspaceSlug) {
          setStoredWorkspaceSlug(workspaceSlug);
        }

        if (!payload?.data?.onboarding_required) {
          router.replace(workspaceSlug ? `/orders?business=${encodeURIComponent(workspaceSlug)}` : "/workspaces");
          return;
        }

        const inviteProfile = payload?.data?.profile;
        if (mounted) {
          setProfile({
            name: inviteProfile?.name ?? "",
            email: inviteProfile?.email ?? "",
            phone: inviteProfile?.phone ?? "",
          });
        }
      } catch {
        if (mounted) {
          setError("Unable to validate invite link.");
        }
      } finally {
        if (mounted) {
          setIsLoadingInvite(false);
        }
      }
    };

    loadInvite();
    return () => {
      mounted = false;
    };
  }, [agentId, apiBase, router, token]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!profile.name.trim() || !profile.email.trim()) {
      setError("Name and email are required.");
      return;
    }
    if (!password) {
      setError("Password is required.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`${apiBase}/agent-portal/auth/complete-onboarding`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          agent_id: agentId,
          name: profile.name,
          email: profile.email,
          phone: profile.phone,
          password,
        }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.success) {
        setError(payload?.error?.message ?? "Unable to complete onboarding.");
        return;
      }

      const workspaceSlug = payload?.data?.workspace?.slug;
      if (workspaceSlug) {
        setStoredWorkspaceSlug(workspaceSlug);
      }
      router.replace(workspaceSlug ? `/orders?business=${encodeURIComponent(workspaceSlug)}` : "/workspaces");
    } catch {
      setError("Unable to complete onboarding.");
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
          display: "grid",
          gap: "1rem",
        }}
      >
        <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.85rem", letterSpacing: "0.08em", textTransform: "uppercase" }}>
          InspectOS Agent Portal
        </p>
        <h1 style={{ margin: 0, fontSize: "1.8rem", lineHeight: 1.2 }}>Complete your account setup</h1>
        <p style={{ marginTop: 0, color: "var(--muted)", lineHeight: 1.6 }}>
          Verify your profile information and set your password. After this, sign in with email and password.
        </p>

        {isLoadingInvite ? (
          <p style={{ margin: 0, color: "var(--muted)" }}>Checking invite link...</p>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "grid", gap: "0.75rem" }}>
            <label style={{ display: "grid", gap: "0.35rem", fontSize: "0.9rem" }}>
              Name
              <input
                type="text"
                value={profile.name}
                onChange={(event) => setProfile((prev) => ({ ...prev, name: event.target.value }))}
                required
                style={{ border: "1px solid var(--border)", borderRadius: "10px", padding: "0.7rem 0.75rem", background: "transparent", color: "inherit" }}
              />
            </label>
            <label style={{ display: "grid", gap: "0.35rem", fontSize: "0.9rem" }}>
              Email
              <input
                type="email"
                value={profile.email}
                onChange={(event) => setProfile((prev) => ({ ...prev, email: event.target.value }))}
                required
                style={{ border: "1px solid var(--border)", borderRadius: "10px", padding: "0.7rem 0.75rem", background: "transparent", color: "inherit" }}
              />
            </label>
            <label style={{ display: "grid", gap: "0.35rem", fontSize: "0.9rem" }}>
              Phone
              <input
                type="tel"
                value={profile.phone}
                onChange={(event) => setProfile((prev) => ({ ...prev, phone: event.target.value }))}
                style={{ border: "1px solid var(--border)", borderRadius: "10px", padding: "0.7rem 0.75rem", background: "transparent", color: "inherit" }}
              />
            </label>
            <label style={{ display: "grid", gap: "0.35rem", fontSize: "0.9rem" }}>
              New password
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                style={{ border: "1px solid var(--border)", borderRadius: "10px", padding: "0.7rem 0.75rem", background: "transparent", color: "inherit" }}
              />
            </label>
            <label style={{ display: "grid", gap: "0.35rem", fontSize: "0.9rem" }}>
              Confirm password
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
                style={{ border: "1px solid var(--border)", borderRadius: "10px", padding: "0.7rem 0.75rem", background: "transparent", color: "inherit" }}
              />
            </label>
            <button
              type="submit"
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
              {isSubmitting ? "Saving..." : "Save and continue"}
            </button>
          </form>
        )}

        {error && (
          <p style={{ margin: 0, color: "#b42318", fontSize: "0.9rem" }}>
            {error}
          </p>
        )}
      </section>
    </main>
  );
}

export default function AgentPortalOnboardingPage() {
  return (
    <Suspense fallback={null}>
      <AgentPortalOnboardingContent />
    </Suspense>
  );
}
