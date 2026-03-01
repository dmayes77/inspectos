import { NextRequest } from "next/server";
import { badRequest, createServiceClient, success, unauthorized } from "@/lib/supabase";
import { resolveAgentPortalSession } from "@/lib/agent-portal/session";
import { normalizePhoneForStorage } from "@/lib/phone/normalize";

type UpdateProfileBody = {
  name?: string;
  email?: string;
  phone?: string | null;
};

export async function GET(request: NextRequest) {
  const session = await resolveAgentPortalSession(request);
  if (!session) {
    return unauthorized("Not authenticated");
  }

  return success({
    id: session.id,
    name: session.name,
    email: session.email,
    phone: session.phone,
  });
}

export async function PUT(request: NextRequest) {
  const session = await resolveAgentPortalSession(request);
  if (!session) {
    return unauthorized("Not authenticated");
  }

  const body = (await request.json().catch(() => ({}))) as UpdateProfileBody;
  const name = body.name?.trim();
  const email = body.email?.trim().toLowerCase();
  const phone = normalizePhoneForStorage(body.phone);

  if (!name || !email) {
    return badRequest("name and email are required.");
  }

  const serviceClient = createServiceClient();
  const { data: duplicate, error: duplicateError } = await serviceClient
    .from("agents")
    .select("id")
    .eq("tenant_id", session.tenant_id)
    .eq("email", email)
    .neq("id", session.id)
    .maybeSingle();

  if (duplicateError) {
    return badRequest("Unable to validate email.");
  }

  if (duplicate) {
    return badRequest("That email is already used by another agent in this workspace.");
  }

  const { error: updateError } = await serviceClient
    .from("agents")
    .update({
      name,
      email,
      phone,
      updated_at: new Date().toISOString(),
    })
    .eq("id", session.id);

  if (updateError) {
    return badRequest(updateError.message || "Unable to update profile.");
  }

  return success({ id: session.id, name, email, phone });
}
