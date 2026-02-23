"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useAgentOrder } from "@/hooks/use-agent-orders";
import { getStoredWorkspaceSlug, setStoredWorkspaceSlug } from "@/lib/workspace/selection";

function AgentPortalOrderDetailContent() {
  const params = useParams<{ id: string }>();
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

  const orderId = params.id;
  const { data: order, isLoading, isError, refetch } = useAgentOrder(orderId, activeBusiness);

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
        <h1 style={{ marginTop: "0.5rem", marginBottom: "0.75rem", fontSize: "1.8rem", lineHeight: 1.2 }}>
          Order Details
        </h1>
        <p style={{ marginTop: 0, color: "var(--muted)", lineHeight: 1.6 }}>
          {activeBusiness ? `Workspace: ${activeBusiness}` : "Workspace context is missing."}
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
                Loading order...
              </div>
            )}
            {isError && (
              <div style={{ border: "1px solid var(--border)", borderRadius: "12px", padding: "0.9rem 1rem" }}>
                <p style={{ margin: 0, color: "var(--muted)" }}>Could not load order.</p>
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
            {!isLoading && !isError && !order && (
              <div style={{ border: "1px solid var(--border)", borderRadius: "12px", padding: "0.9rem 1rem", color: "var(--muted)" }}>
                Order not found.
              </div>
            )}
            {order && (
              <div style={{ border: "1px solid var(--border)", borderRadius: "12px", padding: "1rem", display: "grid", gap: "0.7rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: "1.1rem" }}>{order.order_number}</p>
                  <div style={{ border: "1px solid var(--border)", borderRadius: "999px", padding: "0.3rem 0.65rem", fontSize: "0.8rem", textTransform: "capitalize" }}>
                    {order.payment_status}
                  </div>
                </div>
                <p style={{ margin: 0, color: "var(--muted)" }}>
                  {order.client?.name ?? "Unknown client"} • {order.property?.address_line1 ?? "No address"}
                </p>
                <p style={{ margin: 0, color: "var(--muted)" }}>
                  {order.scheduled_date ?? "Unscheduled"} {order.scheduled_time ? `at ${order.scheduled_time}` : ""} • {order.status}
                </p>
                <p style={{ margin: 0, fontWeight: 600 }}>${order.total.toFixed(2)}</p>
              </div>
            )}
          </div>
        )}

        <div style={{ marginTop: "1rem" }}>
          <Link
            href={activeBusiness ? `/orders?business=${encodeURIComponent(activeBusiness)}` : "/orders"}
            style={{
              textDecoration: "none",
              borderRadius: "10px",
              padding: "0.45rem 0.7rem",
              border: "1px solid var(--border)",
              color: "inherit",
              display: "inline-block",
            }}
          >
            Back to Orders
          </Link>
        </div>
      </section>
    </main>
  );
}

export default function AgentPortalOrderDetailPage() {
  return (
    <Suspense fallback={null}>
      <AgentPortalOrderDetailContent />
    </Suspense>
  );
}
