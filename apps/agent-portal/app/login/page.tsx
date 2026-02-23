import Link from "next/link";

export default function AgentPortalLoginPage() {
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
          Use the same email address your brokerage added as an agent. We only show data tied to that email and your selected business workspace.
        </p>

        <form style={{ display: "grid", gap: "0.75rem", marginTop: "1rem" }}>
          <label htmlFor="email" style={{ fontSize: "0.9rem", fontWeight: 600 }}>
            Work Email
          </label>
          <input
            id="email"
            type="email"
            placeholder="agent@brokerage.com"
            style={{
              border: "1px solid var(--border)",
              borderRadius: "10px",
              padding: "0.7rem 0.85rem",
              fontSize: "0.95rem",
              outline: "none",
            }}
          />
          <button
            type="button"
            style={{
              marginTop: "0.25rem",
              border: "none",
              borderRadius: "10px",
              padding: "0.75rem 0.9rem",
              fontWeight: 600,
              background: "var(--accent)",
              color: "white",
              cursor: "pointer",
            }}
          >
            Send Sign-In Link
          </button>
        </form>

        <p style={{ marginTop: "1rem", color: "var(--muted)", fontSize: "0.9rem" }}>
          New agent? <Link href="/register">Request access</Link>
        </p>
      </section>
    </main>
  );
}
