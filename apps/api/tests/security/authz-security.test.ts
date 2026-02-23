import { describe, expect, it } from "vitest";
import { requirePermission } from "@/lib/api/with-auth";
import { resolveTenant } from "@/lib/tenants";
import { verifyBusinessBillingAccessByTenantId } from "@/lib/billing/access";

function createResolveTenantSupabaseMock(options: {
  defaultMembership?: unknown;
  defaultMembershipError?: Error | null;
  tenantByIdentifier?: unknown;
  tenantLookupError?: Error | null;
  scopedMembership?: unknown;
  scopedMembershipError?: Error | null;
}) {
  const eqCalls: Array<[string, string]> = [];
  const state: { table?: string; query?: string } = {};

  const chain = {
    select(query: string) {
      state.query = query;
      return this;
    },
    or(_value: string) {
      return this;
    },
    eq(column: string, value: string) {
      eqCalls.push([column, value]);
      return this;
    },
    limit(_count: number) {
      return this;
    },
    maybeSingle: async () => {
      if (state.table === "tenants") {
        return { data: options.tenantByIdentifier ?? null, error: options.tenantLookupError ?? null };
      }
      if (state.table === "tenant_members" && state.query === "role") {
        return { data: options.scopedMembership ?? null, error: options.scopedMembershipError ?? null };
      }
      return { data: options.defaultMembership ?? null, error: options.defaultMembershipError ?? null };
    },
  };

  const client = {
    from(table: string) {
      state.table = table;
      state.query = undefined;
      return chain;
    },
  };

  return { client, eqCalls };
}

function createBillingSupabaseMock(response: { data: unknown; error: Error | null }) {
  return {
    from: (_table: string) => ({
      select: (_query: string) => ({
        eq: (_column: string, _value: string) => ({
          maybeSingle: async () => response,
        }),
      }),
    }),
  };
}

describe("authorization boundaries", () => {
  it("enforces user-scoped tenant membership lookup by default", async () => {
    const userId = "user-a";
    const { client, eqCalls } = createResolveTenantSupabaseMock({
      defaultMembership: {
        role: "owner",
        tenant: { id: "tenant-a", name: "Tenant A", slug: "tenant-a", business_id: "TENANTA" },
      },
    });

    const result = await resolveTenant(client as never, userId);

    expect(result.tenant?.id).toBe("tenant-a");
    expect(result.role).toBe("owner");
    expect(eqCalls).toContainEqual(["user_id", userId]);
  });

  it("enforces business-scoped membership lookup when business identifier is provided", async () => {
    const { client, eqCalls } = createResolveTenantSupabaseMock({
      tenantByIdentifier: { id: "tenant-b", name: "Tenant B", slug: "tenant-b", business_id: "TENANTB" },
      scopedMembership: { role: "admin" },
    });

    const result = await resolveTenant(client as never, "user-b", "tenant-b");

    expect(result.tenant?.id).toBe("tenant-b");
    expect(result.role).toBe("admin");
    expect(eqCalls).toContainEqual(["tenant_id", "tenant-b"]);
    expect(eqCalls).toContainEqual(["user_id", "user-b"]);
  });

  it("denies access immediately when membership no longer exists", async () => {
    const { client } = createResolveTenantSupabaseMock({
      defaultMembership: null,
    });

    const result = await resolveTenant(client as never, "removed-user");

    expect(result.tenant).toBeNull();
    expect(result.error?.message).toContain("Tenant membership not found");
  });

  it("blocks non-admin style permission checks", async () => {
    const forbiddenResponse = requirePermission(
      "viewer",
      "create_invoices",
      "Insufficient permissions"
    );

    expect(forbiddenResponse).not.toBeNull();
    expect(forbiddenResponse?.status).toBe(403);
  });
});

describe("billing lockout", () => {
  it("blocks tenant access when billing status is past_due", async () => {
    const supabase = createBillingSupabaseMock({
      data: { settings: { billing: { subscriptionStatus: "past_due" } } },
      error: null,
    });

    const result = await verifyBusinessBillingAccessByTenantId(supabase as never, "tenant-a");
    expect(result.error).toBeUndefined();
    expect(result.allowed).toBe(false);
  });

  it("allows tenant access during configured grace period", async () => {
    const graceEndsAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    const supabase = createBillingSupabaseMock({
      data: {
        settings: {
          billing: {
            subscriptionStatus: "past_due",
            graceEndsAt,
          },
        },
      },
      error: null,
    });

    const result = await verifyBusinessBillingAccessByTenantId(supabase as never, "tenant-a");
    expect(result.allowed).toBe(true);
  });
});
