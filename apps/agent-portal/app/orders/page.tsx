export default function AgentPortalOrdersPage() {
  return (
    <main style={{ minHeight: "100vh", padding: "2rem" }}>
      <section
        style={{
          width: "min(980px, 100%)",
          margin: "0 auto",
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
        <h1 style={{ marginTop: "0.5rem", marginBottom: "0.75rem", fontSize: "1.8rem", lineHeight: 1.2 }}>My Orders</h1>
        <p style={{ marginTop: 0, color: "var(--muted)", lineHeight: 1.6 }}>
          Placeholder page. Final implementation will load orders for the active tenant-scoped agent session only.
        </p>

        <div style={{ marginTop: "1rem", border: "1px dashed var(--border)", borderRadius: "12px", padding: "1rem" }}>
          <p style={{ margin: 0, color: "var(--muted)" }}>
            Session contract: `session_type=agent`, `agent_id`, and `tenant_id` are required for every request.
          </p>
        </div>
      </section>
    </main>
  );
}
