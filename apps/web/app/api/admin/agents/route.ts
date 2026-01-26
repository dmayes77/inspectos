import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getTenantId } from "@/lib/supabase/admin-helpers";
import { validateRequestBody } from "@/lib/api/validate";
import { createAgentSchema } from "@/lib/validations/agent";
import { resolveAgencyAssociation } from "./agency-helpers";

export async function GET(request: NextRequest) {
  const tenantId = getTenantId();
  const searchParams = request.nextUrl.searchParams;

  let query = supabaseAdmin
    .from("agents")
    .select(
      `
      *,
      agency:agencies(id, name, email, phone, website, address_line1, address_line2, city, state, zip_code)
    `,
    )
    .eq("tenant_id", tenantId)
    .order("name", { ascending: true });

  const status = searchParams.get("status");
  if (status) {
    query = query.eq("status", status);
  }

  const agencyId = searchParams.get("agency_id");
  if (agencyId) {
    query = query.eq("agency_id", agencyId);
  }

  const search = searchParams.get("search");
  if (search) {
    query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: { message: error.message } }, { status: 500 });
  }

  return NextResponse.json({ data: data ?? [] });
}

export async function POST(request: Request) {
  const tenantId = getTenantId();

  const validation = await validateRequestBody(request, createAgentSchema);
  if (validation.error) {
    return validation.error;
  }
  const payload = validation.data;

  let agencyId: string | null;
  try {
    agencyId = await resolveAgencyAssociation({
      tenantId,
      agencyId: payload.agency_id ?? null,
      agencyName: payload.agency_name ?? null,
      brandLogoUrl: payload.brand_logo_url ?? null,
      agencyAddress: payload.agency_address ?? null,
      agencyWebsite: payload.agency_website ?? null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to prepare agency.";
    return NextResponse.json({ error: { message } }, { status: 500 });
  }

  const { data, error } = await supabaseAdmin
    .from("agents")
    .insert({
      tenant_id: tenantId,
      agency_id: agencyId,
      name: payload.name,
      email: payload.email ?? null,
      phone: payload.phone ?? null,
      role: payload.role ?? null,
      license_number: payload.license_number ?? null,
      status: payload.status ?? "active",
      notes: payload.notes ?? null,
      preferred_report_format: payload.preferred_report_format ?? "pdf",
      notify_on_schedule: payload.notify_on_schedule ?? true,
      notify_on_complete: payload.notify_on_complete ?? true,
      notify_on_report: payload.notify_on_report ?? true,
      avatar_url: payload.avatar_url ?? null,
      brand_logo_url: payload.brand_logo_url ?? null,
      agency_address: payload.agency_address ?? null,
    })
    .select(
      `
      *,
      agency:agencies(id, name, email, phone, website, address_line1, address_line2, city, state, zip_code)
    `,
    )
    .single();

  if (error || !data) {
    return NextResponse.json({ error: { message: error?.message ?? "Failed to create agent." } }, { status: 500 });
  }

  return NextResponse.json({ data });
}
