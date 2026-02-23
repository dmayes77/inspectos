import { badRequest, serverError, success } from "@/lib/supabase";
import { requirePermission, withAuth } from "@/lib/api/with-auth";

type TenantBillingSettings = {
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
};

function getWebBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_WEB_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000"
  ).replace(/\/+$/, "");
}

async function resolveStripeCustomerId(
  stripeSecretKey: string,
  subscriptionId: string
): Promise<string | null> {
  const response = await fetch(`https://api.stripe.com/v1/subscriptions/${subscriptionId}`, {
    headers: {
      Authorization: `Bearer ${stripeSecretKey}`,
    },
  });

  if (!response.ok) return null;

  const payload = (await response.json().catch(() => ({}))) as { customer?: string };
  return typeof payload.customer === "string" && payload.customer ? payload.customer : null;
}

export const POST = withAuth(async ({ serviceClient, tenant, memberRole, memberPermissions }) => {
  const permissionCheck = requirePermission(
    memberRole,
    "view_billing",
    "You do not have permission to manage billing",
    memberPermissions
  );
  if (permissionCheck) return permissionCheck;

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) {
    return serverError("Stripe is not configured", new Error("Missing STRIPE_SECRET_KEY"));
  }

  const { data, error } = await serviceClient
    .from("tenants")
    .select("settings")
    .eq("id", tenant.id)
    .maybeSingle();

  if (error) {
    return serverError("Failed to load tenant billing settings", error);
  }

  const billing = (((data?.settings as { billing?: TenantBillingSettings } | null)?.billing) ?? {}) as TenantBillingSettings;
  let stripeCustomerId =
    typeof billing.stripeCustomerId === "string" && billing.stripeCustomerId.trim()
      ? billing.stripeCustomerId.trim()
      : null;

  if (!stripeCustomerId) {
    const subscriptionId =
      typeof billing.stripeSubscriptionId === "string" && billing.stripeSubscriptionId.trim()
        ? billing.stripeSubscriptionId.trim()
        : null;
    if (!subscriptionId) {
      return badRequest("No Stripe customer is linked to this business yet. Complete Stripe checkout first.");
    }

    stripeCustomerId = await resolveStripeCustomerId(stripeSecretKey, subscriptionId);
    if (!stripeCustomerId) {
      return badRequest("Unable to resolve Stripe customer for this business. Verify the active Stripe subscription.");
    }
  }

  const returnUrl = `${getWebBaseUrl()}/app/settings/billing`;
  const params = new URLSearchParams({
    customer: stripeCustomerId,
    return_url: returnUrl,
  });

  const response = await fetch("https://api.stripe.com/v1/billing_portal/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${stripeSecretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  const payload = (await response.json().catch(() => ({}))) as {
    url?: string;
    error?: { message?: string };
  };

  if (!response.ok || !payload.url) {
    return serverError(
      payload.error?.message || "Failed to create Stripe billing portal session",
      new Error(payload.error?.message || "Billing portal error")
    );
  }

  return success({ url: payload.url });
});
