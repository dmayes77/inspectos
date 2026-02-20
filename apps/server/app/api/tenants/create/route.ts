import { createClient } from "@supabase/supabase-js";
import { generateBusinessApiKey, hashBusinessApiKey } from "@/lib/api/business-api-keys";

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return Response.json({ error: "Missing bearer token" }, { status: 401 });

  const supabaseUser = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!, {
    global: { headers: { Authorization: `Bearer ${token}` } }
  });

  const { data: userData, error: userErr } = await supabaseUser.auth.getUser();
  if (userErr || !userData.user) return Response.json({ error: "Invalid token" }, { status: 401 });

  const body = await req.json().catch(() => ({} as Record<string, unknown>));
  const name = String(body?.name ?? "").trim();
  const slug = String(body?.slug ?? "").trim().toLowerCase();

  if (!name || !slug) return Response.json({ error: "name and slug are required" }, { status: 400 });
  if (!/^[a-z0-9-]{3,40}$/.test(slug)) {
    return Response.json({ error: "slug must be 3-40 chars: lowercase letters, numbers, hyphen" }, { status: 400 });
  }

  const { data: existingMembership, error: existingMembershipError } = await supabaseAdmin
    .from("tenant_members")
    .select("tenant_id")
    .eq("user_id", userData.user.id)
    .maybeSingle();

  if (existingMembershipError) {
    return Response.json({ error: existingMembershipError.message }, { status: 400 });
  }

  if (existingMembership) {
    return Response.json({ error: "This account is already linked to a business" }, { status: 409 });
  }

  const { data: tenant, error: tErr } = await supabaseAdmin
    .from("tenants")
    .insert({ name, slug })
    .select("id, name, slug, business_id")
    .single();

  if (tErr) return Response.json({ error: tErr.message }, { status: 400 });

  const { error: mErr } = await supabaseAdmin
    .from("tenant_members")
    .insert({ tenant_id: tenant.id, user_id: userData.user.id, role: "owner" });

  if (mErr) return Response.json({ error: mErr.message }, { status: 400 });

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

  if (apiKeyError) return Response.json({ error: apiKeyError.message }, { status: 400 });

  return Response.json({ business: tenant });
}
