import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getTenantId } from "@/lib/supabase/admin-helpers";
import { inspections as mockInspections } from "@/lib/mock/inspections";
import { clients as mockClients } from "@/lib/mock/clients";
import { services as mockServices } from "@/lib/mock/services";
import { teamMembers } from "@/lib/mock/team";

const parseAddress = (address: string) => {
  const [line1Raw, restRaw, altRaw] = address.split(",").map((part) => part.trim());
  const line1 = line1Raw || address;
  const rest = altRaw ? `${restRaw ?? ""} ${altRaw}`.trim() : restRaw ?? "";
  const parts = rest.split(" ").filter(Boolean);
  const zip = parts.pop() ?? "";
  const state = parts.pop() ?? "";
  const city = parts.join(" ") || "Unknown";
  return { line1, city, state, zip };
};

const mapJobStatus = (status: string) => {
  if (status === "in_progress") return "in_progress";
  if (status === "completed" || status === "pending_report") return "completed";
  return "scheduled";
};

const mapInspectionStatus = (status: string) => {
  if (status === "in_progress") return "in_progress";
  if (status === "completed") return "completed";
  if (status === "pending_report") return "submitted";
  return "draft";
};

const parseDate = (value?: string | null) => {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString().slice(0, 10);
};

const ensureInspectorProfile = async (
  tenantId: string,
  name: string,
  email: string
) => {
  const { data: existingProfile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("id, email")
    .eq("email", email)
    .maybeSingle();

  if (profileError) {
    throw new Error(profileError.message);
  }

  if (existingProfile?.id) {
    await supabaseAdmin.from("tenant_members").upsert(
      {
        tenant_id: tenantId,
        user_id: existingProfile.id,
        role: "inspector",
      },
      { onConflict: "tenant_id,user_id" }
    );
    return existingProfile.id;
  }

  const getFallbackInspector = async () => {
    const { data: member } = await supabaseAdmin
      .from("tenant_members")
      .select("user_id")
      .eq("tenant_id", tenantId)
      .limit(1)
      .maybeSingle();

    if (member?.user_id) {
      return member.user_id as string;
    }

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .limit(1)
      .maybeSingle();
    return profile?.id ?? null;
  };

  let authUser = null;
  try {
    const { data: userList } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 200,
    });
    const existingAuthUser = userList?.users?.find((user) => user.email?.toLowerCase() === email.toLowerCase());
    authUser = existingAuthUser ?? null;

    if (!authUser) {
      const createResult = await supabaseAdmin.auth.admin.createUser({
        email,
        email_confirm: true,
        password: "TempInspect0s!",
        user_metadata: { full_name: name },
      });
      if (createResult.error) {
        const inviteResult = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
          data: { full_name: name },
        });
        if (inviteResult.error) {
          const { data: seedId, error: seedError } = await supabaseAdmin.rpc("create_seed_auth_user", {
            p_email: email,
            p_full_name: name,
          });
          if (seedError) {
            throw new Error(seedError.message);
          }
          authUser = seedId ? { id: seedId } : null;
        } else {
          authUser = inviteResult.data.user ?? null;
        }
      } else {
        authUser = createResult.data.user ?? null;
      }
    }
  } catch (error) {
    const fallbackId = await getFallbackInspector();
    if (fallbackId) {
      return fallbackId;
    }
    throw error;
  }

  if (!authUser?.id) {
    const fallbackId = await getFallbackInspector();
    if (fallbackId) {
      return fallbackId;
    }
    throw new Error(`Failed to create auth user for ${email}.`);
  }

  await supabaseAdmin.from("profiles").upsert({
    id: authUser.id,
    email,
    full_name: name,
  });

  await supabaseAdmin.from("tenant_members").upsert(
    {
      tenant_id: tenantId,
      user_id: authUser.id,
      role: "inspector",
    },
    { onConflict: "tenant_id,user_id" }
  );

  return authUser.id;
};

export async function POST() {
  const tenantId = getTenantId();

  const inspectorNames = Array.from(
    new Set(mockInspections.map((inspection) => inspection.inspector).filter(Boolean))
  );

  const inspectorMap = new Map<string, string>();
  for (const name of inspectorNames) {
    const match = teamMembers.find((member) => member.name === name);
    const email = match?.email ?? `${name.toLowerCase().replace(/[^a-z]+/g, ".")}@inspectos.demo`;
    const profileId = await ensureInspectorProfile(tenantId, name, email);
    inspectorMap.set(name, profileId);
  }

  const { data: existingClients } = await supabaseAdmin
    .from("clients")
    .select("id, email, name")
    .eq("tenant_id", tenantId);

  const clientMap = new Map<string, string>();
  (existingClients ?? []).forEach((client) => {
    if (client.email) {
      clientMap.set(client.email.toLowerCase(), client.id);
    }
    clientMap.set(client.name.toLowerCase(), client.id);
  });

  for (const client of mockClients) {
    const key = client.email?.toLowerCase() || client.name.toLowerCase();
    if (clientMap.has(key)) continue;
    const { data: createdClient, error: clientError } = await supabaseAdmin
      .from("clients")
      .insert({
        tenant_id: tenantId,
        name: client.name,
        email: client.email ?? null,
        phone: client.phone ?? null,
        type: client.type ?? null,
        inspections_count: client.inspections ?? 0,
        last_inspection_date: parseDate(client.lastInspection) ?? null,
        total_spent: client.totalSpent ?? 0,
        notes: client.type ? `Type: ${client.type}` : null,
      })
      .select("id")
      .single();

    if (clientError || !createdClient) {
      return NextResponse.json({ error: clientError?.message ?? "Failed to seed clients." }, { status: 500 });
    }
    clientMap.set(key, createdClient.id);
  }

  const { data: existingProperties } = await supabaseAdmin
    .from("properties")
    .select("id, address_line1, city, state, zip_code")
    .eq("tenant_id", tenantId);

  const propertyMap = new Map<string, string>();
  (existingProperties ?? []).forEach((property) => {
    const key = `${property.address_line1}|${property.city}|${property.state}|${property.zip_code}`.toLowerCase();
    propertyMap.set(key, property.id);
  });

  const { data: dbServices } = await supabaseAdmin
    .from("services")
    .select("id, name, template_id, duration_minutes")
    .eq("tenant_id", tenantId)
    .eq("is_active", true);

  const serviceByName = new Map(
    (dbServices ?? []).map((service) => [service.name.toLowerCase(), service])
  );

  const mockServiceById = new Map(mockServices.map((service) => [service.serviceId, service.name]));

  const { data: templates } = await supabaseAdmin
    .from("templates")
    .select("id, name")
    .eq("tenant_id", tenantId)
    .eq("is_active", true);

  const fallbackTemplateId = templates?.[0]?.id ?? null;

  const { data: existingJobs } = await supabaseAdmin
    .from("jobs")
    .select("id, property_id, scheduled_date, scheduled_time")
    .eq("tenant_id", tenantId);

  const jobKeys = new Set(
    (existingJobs ?? []).map((job) => `${job.property_id}|${job.scheduled_date}|${job.scheduled_time ?? ""}`)
  );

  let createdJobs = 0;
  let createdInspections = 0;

  for (const inspection of mockInspections) {
    const clientKey = inspection.client?.toLowerCase() ?? "";
    const clientId = clientMap.get(clientKey);
    if (!clientId) continue;

    const { line1, city, state, zip } = parseAddress(inspection.address);
    const propertyKey = `${line1}|${city}|${state}|${zip}`.toLowerCase();
    let propertyId = propertyMap.get(propertyKey);

    if (!propertyId) {
      const { data: createdProperty, error: propertyError } = await supabaseAdmin
        .from("properties")
        .insert({
          tenant_id: tenantId,
          client_id: clientId,
          address_line1: line1,
          city,
          state,
          zip_code: zip || "00000",
          property_type: "residential",
          year_built: inspection.yearBuilt ?? null,
          square_feet: inspection.sqft ?? null,
        })
        .select("id")
        .single();

      if (propertyError || !createdProperty) {
        return NextResponse.json({ error: propertyError?.message ?? "Failed to seed properties." }, { status: 500 });
      }
      propertyId = createdProperty.id;
      propertyMap.set(propertyKey, propertyId);
    }

    const serviceNames =
      inspection.types?.map((type) => mockServiceById.get(type) ?? type) ?? [];
    const primaryServiceName = serviceNames[0]?.toLowerCase() ?? "";
    const primaryService = primaryServiceName ? serviceByName.get(primaryServiceName) : null;
    const templateId = primaryService?.template_id ?? fallbackTemplateId;

    if (!templateId) continue;

    const inspectorId = inspectorMap.get(inspection.inspector) ?? Array.from(inspectorMap.values())[0];
    if (!inspectorId) continue;

    const jobKey = `${propertyId}|${inspection.date}|${inspection.time ?? ""}`;
    if (jobKeys.has(jobKey)) continue;

    const { data: createdJob, error: jobError } = await supabaseAdmin
      .from("jobs")
      .insert({
        tenant_id: tenantId,
        property_id: propertyId,
        client_id: clientId,
        template_id: templateId,
        inspector_id: inspectorId,
        status: mapJobStatus(inspection.status),
        scheduled_date: inspection.date,
        scheduled_time: inspection.time ?? null,
        duration_minutes: primaryService?.duration_minutes ?? 120,
        notes: inspection.notes ?? null,
      })
      .select("id")
      .single();

    if (jobError || !createdJob) {
      return NextResponse.json({ error: jobError?.message ?? "Failed to seed jobs." }, { status: 500 });
    }
    createdJobs += 1;
    jobKeys.add(jobKey);

    const { error: inspectionError } = await supabaseAdmin.from("inspections").insert({
      tenant_id: tenantId,
      job_id: createdJob.id,
      template_id: templateId,
      template_version: 1,
      inspector_id: inspectorId,
      status: mapInspectionStatus(inspection.status),
      notes: inspection.notes ?? null,
    });

    if (inspectionError) {
      return NextResponse.json({ error: inspectionError.message }, { status: 500 });
    }
    createdInspections += 1;
  }

  return NextResponse.json({
    message: "Seeded clients, properties, jobs, and inspections.",
    jobsCreated: createdJobs,
    inspectionsCreated: createdInspections,
  });
}
