"use client";

import Link from "next/link";
import { useWorkspaces } from "@/hooks/use-workspaces";
import { setStoredWorkspaceSlug } from "@/lib/workspace/selection";

export default function AgentPortalWorkspacesPage() {
  const { data: workspaces = [], isLoading, isError, refetch } = useWorkspaces();

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "2rem" }}>
      <section
        style={{
          width: "min(760px, 100%)",
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
        <h1 style={{ marginTop: "0.5rem", marginBottom: "0.75rem", fontSize: "1.8rem", lineHeight: 1.2 }}>Choose a workspace</h1>
        <p style={{ marginTop: 0, color: "var(--muted)", lineHeight: 1.6 }}>
          Your email is linked to multiple businesses. Select one to continue. You will only see data for that specific business and your agent record inside it.
        </p>

        <div style={{ marginTop: "1rem", display: "grid", gap: "0.75rem" }}>
          {isLoading && (
            <div style={{ border: "1px solid var(--border)", borderRadius: "12px", padding: "0.9rem 1rem", color: "var(--muted)" }}>
              Loading workspaces...
            </div>
          )}
          {isError && (
            <div style={{ border: "1px solid var(--border)", borderRadius: "12px", padding: "0.9rem 1rem" }}>
              <p style={{ margin: 0, color: "var(--muted)" }}>Could not load workspaces.</p>
              <button
                type="button"
                onClick={() => refetch()}
                style={{
                  marginTop: "0.6rem",
                  borderRadius: "10px",
                  padding: "0.45rem 0.7rem",
                  border: "1px solid var(--border)",
                  background: "transparent",
                  cursor: "pointer",
                }}
              >
                Try again
              </button>
            </div>
          )}
          {!isLoading && !isError && workspaces.length === 0 && (
            <div style={{ border: "1px solid var(--border)", borderRadius: "12px", padding: "0.9rem 1rem", color: "var(--muted)" }}>
              No workspaces found for this account.
            </div>
          )}
          {workspaces.map((workspace) => (
            <div
              key={workspace.id}
              style={{
                border: "1px solid var(--border)",
                borderRadius: "12px",
                padding: "0.9rem 1rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "1rem",
              }}
            >
              <div>
                <p style={{ margin: 0, fontWeight: 700 }}>{workspace.name}</p>
                <p style={{ margin: "0.2rem 0 0", color: "var(--muted)", fontSize: "0.9rem" }}>
                  {workspace.slug}
                  {workspace.role ? ` • ${workspace.role}` : ""}
                </p>
              </div>
              <Link
                href={`/orders?business=${encodeURIComponent(workspace.slug)}`}
                onClick={() => setStoredWorkspaceSlug(workspace.slug)}
                style={{
                  textDecoration: "none",
                  borderRadius: "10px",
                  padding: "0.55rem 0.8rem",
                  fontWeight: 600,
                  background: "var(--accent)",
                  color: "white",
                }}
              >
                Open
              </Link>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
