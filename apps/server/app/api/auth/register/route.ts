import { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { generateBusinessApiKey, hashBusinessApiKey } from "@/lib/api/business-api-keys";

type RegisterBody = {
  email?: string;
  company_name: string;
  company_slug?: string;
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as RegisterBody;
    const { company_name, company_slug, email } = body;

    if (!company_name) {
      return Response.json({ error: "Missing required fields." }, { status: 400 });
    }

    const authHeader = request.headers.get("authorization") || request.headers.get("Authorization");
    const accessToken = authHeader?.startsWith("Bearer ")
      ? authHeader.replace("Bearer ", "").trim()
      : null;

    let userId: string | null = null;
    if (email) {
      const { data: profile, error: profileError } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .ilike("email", email)
        .maybeSingle();

      if (profileError) {
        return Response.json({ error: profileError.message || "Failed to find user profile." }, { status: 400 });
      }
      userId = profile?.id ?? null;
    }

    if (!userId && accessToken) {
      try {
        const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(accessToken);
        if (!userError && userData?.user?.id) {
          userId = userData.user.id;
        }
      } catch {
        // Ignore auth lookup errors and fall back to email-based resolution.
      }
    }

    if (!userId) {
      return Response.json({ error: "Unable to resolve user for business creation." }, { status: 401 });
    }

    const { data: existingMembership, error: existingMembershipError } = await supabaseAdmin
      .from("tenant_members")
      .select("tenant_id")
      .eq("user_id", userId)
      .maybeSingle();

    if (existingMembershipError) {
      return Response.json({ error: existingMembershipError.message || "Failed to verify membership state." }, { status: 400 });
    }

    if (existingMembership) {
      return Response.json({ error: "This account is already linked to a business." }, { status: 409 });
    }

    const slug = company_slug?.trim() ? slugify(company_slug) : slugify(company_name);
    if (!slug) {
      return Response.json({ error: "Invalid company name or slug." }, { status: 400 });
    }

    const { data: existingTenant, error: existingError } = await supabaseAdmin
      .from("tenants")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (existingError) {
      return Response.json({ error: existingError.message || "Failed to check business slug." }, { status: 400 });
    }

    if (existingTenant) {
      return Response.json({ error: "Company slug is already in use." }, { status: 409 });
    }

    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from("tenants")
      .insert({
        name: company_name,
        slug,
      })
      .select("id, name, slug, business_id")
      .single();

    if (tenantError || !tenant) {
      return Response.json({ error: "Failed to create business." }, { status: 500 });
    }

    const { error: memberError } = await supabaseAdmin.from("tenant_members").insert({
      tenant_id: tenant.id,
      user_id: userId,
      role: "owner",
    });

    if (memberError) {
      return Response.json({ error: "Failed to link user to business." }, { status: 500 });
    }

    const initialApiKey = generateBusinessApiKey();
    const { error: apiKeyError } = await supabaseAdmin
      .from("business_api_keys")
      .insert({
        tenant_id: tenant.id,
        name: "Primary Key",
        key_prefix: initialApiKey.slice(0, 12),
        key_hash: hashBusinessApiKey(initialApiKey),
        scopes: ["admin:api"],
      });

    if (apiKeyError) {
      return Response.json({ error: "Failed to provision API access." }, { status: 500 });
    }

    return Response.json({ data: { business: tenant } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error.";
    return Response.json({ error: message }, { status: 500 });
  }
}
