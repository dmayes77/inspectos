"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAgentOrders } from "@/hooks/use-agent-orders";
import { getStoredWorkspaceSlug, setStoredWorkspaceSlug } from "@/lib/workspace/selection";

export default function AgentPortalOrdersPage() {
  const searchParams = useSearchParams();
  const queryBusiness = searchParams.get("business");
  const [activeBusiness, setActiveBusiness] = useState<string | null>(queryBusiness);

  useEffect(() => {
    const nextBusiness = queryBusiness || getStoredWorkspaceSlug();
    if (nextBusiness) {
      setActiveBusiness(nextBusiness);
      setStoredWorkspaceSlug(nextBusiness);
    }
  }, [queryBusiness]);

  const { data: orders = [], isLoading, isError, refetch } = useAgentOrders(activeBusiness);
  const sortedOrders = useMemo(
    () => [...orders].sort((a, b) => (b.scheduled_date || "").localeCompare(a.scheduled_date || "")),
    [orders]
  );

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
          {activeBusiness
            ? `Showing orders for workspace: ${activeBusiness}`
            : "Select a workspace first to load your tenant-scoped orders."}
        </p>

        {!activeBusiness && (
          <div style={{ marginTop: "1rem" }}>
            <Link
              href="/workspaces"
              style={{
                textDecoration: "none",
                borderRadius: "10px",
                padding: "0.55rem 0.8rem",
                fontWeight: 600,
                background: "var(--accent)",
                color: "white",
                display: "inline-block",
              }}
            >
              Choose Workspace
            </Link>
          </div>
        )}

        {activeBusiness && (
          <div style={{ marginTop: "1rem", display: "grid", gap: "0.75rem" }}>
            {isLoading && (
              <div style={{ border: "1px solid var(--border)", borderRadius: "12px", padding: "0.9rem 1rem", color: "var(--muted)" }}>
                Loading orders...
              </div>
            )}
            {isError && (
              <div style={{ border: "1px solid var(--border)", borderRadius: "12px", padding: "0.9rem 1rem" }}>
                <p style={{ margin: 0, color: "var(--muted)" }}>Could not load orders.</p>
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
            {!isLoading && !isError && sortedOrders.length === 0 && (
              <div style={{ border: "1px solid var(--border)", borderRadius: "12px", padding: "0.9rem 1rem", color: "var(--muted)" }}>
                No orders found for this workspace.
              </div>
            )}
            {sortedOrders.map((order) => (
              <div
                key={order.id}
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
                  <p style={{ margin: 0, fontWeight: 700 }}>{order.order_number}</p>
                  <p style={{ margin: "0.2rem 0 0", color: "var(--muted)", fontSize: "0.9rem" }}>
                    {order.client?.name ?? "Unknown client"} • {order.property?.address_line1 ?? "No address"}
                  </p>
                  <p style={{ margin: "0.2rem 0 0", color: "var(--muted)", fontSize: "0.85rem" }}>
                    {order.scheduled_date ?? "Unscheduled"} • {order.status} • ${order.total.toFixed(2)}
                  </p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <div
                    style={{
                      borderRadius: "999px",
                      padding: "0.3rem 0.65rem",
                      border: "1px solid var(--border)",
                      fontSize: "0.8rem",
                      textTransform: "capitalize",
                    }}
                  >
                    {order.payment_status}
                  </div>
                  <Link
                    href={`/orders/${order.id}?business=${encodeURIComponent(activeBusiness)}`}
                    style={{
                      textDecoration: "none",
                      borderRadius: "10px",
                      padding: "0.45rem 0.7rem",
                      fontWeight: 600,
                      border: "1px solid var(--border)",
                      color: "inherit",
                    }}
                  >
                    View
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
