import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getTenantId } from "@/lib/supabase/admin-helpers";
import { validateRequestBody } from "@/lib/api/validate";
import { serviceSchema } from "@/lib/validations/service";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const tenantId = getTenantId();
  const { id } = await params;

  const validation = await validateRequestBody(request, serviceSchema);
  if (validation.error) {
    return validation.error;
  }
  const payload = validation.data;

  if (payload.isPackage) {
    const { data: updatedPackage, error: packageError } = await supabaseAdmin
      .from("packages")
      .update({
        name: payload.name,
        description: payload.description ?? null,
        price: payload.price ?? null,
        duration_minutes: payload.durationMinutes ?? null,
      })
      .eq("tenant_id", tenantId)
      .eq("id", id)
      .select("*")
      .single();

    if (packageError || !updatedPackage) {
      return NextResponse.json({ error: packageError?.message ?? "Failed to update package." }, { status: 500 });
    }

    const includedServiceIds = Array.isArray(payload.includedServiceIds) ? payload.includedServiceIds : [];
    await supabaseAdmin.from("package_items").delete().eq("package_id", id);

    if (includedServiceIds.length > 0) {
      const { error: itemsError } = await supabaseAdmin.from("package_items").insert(
        includedServiceIds.map((serviceId: string) => ({
          package_id: id,
          service_id: serviceId,
        }))
      );
      if (itemsError) {
        return NextResponse.json({ error: itemsError.message }, { status: 500 });
      }
    }

    return NextResponse.json({
      serviceId: updatedPackage.id,
      name: updatedPackage.name,
      description: updatedPackage.description ?? undefined,
      price: updatedPackage.price ?? undefined,
      durationMinutes: updatedPackage.duration_minutes ?? undefined,
      templateId: null,
      category: "core",
      isPackage: true,
      includedServiceIds,
      status: updatedPackage.is_active ? "active" : "inactive",
    });
  }

  const { data: updatedService, error: serviceError } = await supabaseAdmin
    .from("services")
    .update({
      name: payload.name,
      description: payload.description ?? null,
      category: payload.category ?? "core",
      price: payload.price ?? null,
      duration_minutes: payload.durationMinutes ?? null,
      template_id: payload.templateId ?? null,
    })
    .eq("tenant_id", tenantId)
    .eq("id", id)
    .select("*")
    .single();

  if (serviceError || !updatedService) {
    return NextResponse.json({ error: serviceError?.message ?? "Failed to update service." }, { status: 500 });
  }

  return NextResponse.json({
    serviceId: updatedService.id,
    name: updatedService.name,
    description: updatedService.description ?? undefined,
    price: updatedService.price ?? undefined,
    durationMinutes: updatedService.duration_minutes ?? undefined,
    templateId: updatedService.template_id ?? null,
    category: updatedService.category,
    isPackage: false,
    includedServiceIds: [],
    status: updatedService.is_active ? "active" : "inactive",
  });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const tenantId = getTenantId();
  const { id } = await params;

  const { data: service, error: serviceError } = await supabaseAdmin
    .from("services")
    .update({ is_active: false })
    .eq("tenant_id", tenantId)
    .eq("id", id)
    .select("id")
    .single();

  if (!serviceError && service) {
    return NextResponse.json(true);
  }

  const { data: pkg, error: packageError } = await supabaseAdmin
    .from("packages")
    .update({ is_active: false })
    .eq("tenant_id", tenantId)
    .eq("id", id)
    .select("id")
    .single();

  if (packageError || !pkg) {
    return NextResponse.json({ error: packageError?.message ?? "Failed to archive service." }, { status: 500 });
  }

  return NextResponse.json(true);
}
