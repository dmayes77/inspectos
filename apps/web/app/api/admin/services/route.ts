import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getTenantId } from "@/lib/supabase/admin-helpers";
import { validateRequestBody } from "@/lib/api/validate";
import { serviceSchema } from "@/lib/validations/service";

type ServiceRow = {
  id: string;
  name: string;
  description: string | null;
  category: "core" | "addon";
  price: number | null;
  duration_minutes: number | null;
  template_id: string | null;
  is_active: boolean;
};

type PackageRow = {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  duration_minutes: number | null;
  is_active: boolean;
};

type PackageItemRow = {
  package_id: string;
  service_id: string;
};

const mapService = (row: ServiceRow) => ({
  serviceId: row.id,
  name: row.name,
  description: row.description ?? undefined,
  price: row.price ?? undefined,
  durationMinutes: row.duration_minutes ?? undefined,
  templateId: row.template_id ?? null,
  category: row.category,
  isPackage: false,
  includedServiceIds: [],
  status: row.is_active ? "active" : "inactive",
});

const mapPackage = (row: PackageRow, items: PackageItemRow[]) => ({
  serviceId: row.id,
  name: row.name,
  description: row.description ?? undefined,
  price: row.price ?? undefined,
  durationMinutes: row.duration_minutes ?? undefined,
  templateId: null,
  category: "core" as const,
  isPackage: true,
  includedServiceIds: items.map((item) => item.service_id),
  status: row.is_active ? "active" : "inactive",
});

export async function GET(request: NextRequest) {
  const tenantId = getTenantId();
  const debug = request.nextUrl.searchParams.get("debug") === "1";

  if (debug) {
    const [servicesCount, packagesCount] = await Promise.all([
      supabaseAdmin.from("services").select("id", { count: "exact", head: true }).eq("tenant_id", tenantId),
      supabaseAdmin.from("packages").select("id", { count: "exact", head: true }).eq("tenant_id", tenantId),
    ]);
    return NextResponse.json({
      tenantId,
      counts: {
        services: servicesCount.count ?? 0,
        packages: packagesCount.count ?? 0,
      },
      errors: {
        services: servicesCount.error?.message ?? null,
        packages: packagesCount.error?.message ?? null,
      },
    });
  }

  const { data: services, error: servicesError } = await supabaseAdmin
    .from("services")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("name");

  if (servicesError) {
    return NextResponse.json({ error: servicesError.message }, { status: 500 });
  }

  const { data: packages, error: packagesError } = await supabaseAdmin
    .from("packages")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("name");

  if (packagesError) {
    return NextResponse.json({ error: packagesError.message }, { status: 500 });
  }

  const packageIds = (packages ?? []).map((pkg) => pkg.id);
  const { data: packageItems, error: packageItemsError } = await supabaseAdmin
    .from("package_items")
    .select("package_id, service_id")
    .in("package_id", packageIds.length > 0 ? packageIds : ["00000000-0000-0000-0000-000000000000"]);

  if (packageItemsError) {
    return NextResponse.json({ error: packageItemsError.message }, { status: 500 });
  }

  const packageItemGroups = new Map<string, PackageItemRow[]>();
  (packageItems ?? []).forEach((item) => {
    const group = packageItemGroups.get(item.package_id) ?? [];
    group.push(item);
    packageItemGroups.set(item.package_id, group);
  });

  const mappedServices = (services ?? []).map((service) => mapService(service as ServiceRow));
  const mappedPackages = (packages ?? []).map((pkg) =>
    mapPackage(pkg as PackageRow, packageItemGroups.get(pkg.id) ?? [])
  );

  return NextResponse.json([...mappedServices, ...mappedPackages]);
}

export async function POST(request: Request) {
  const tenantId = getTenantId();

  const validation = await validateRequestBody(request, serviceSchema);
  if (validation.error) {
    return validation.error;
  }
  const payload = validation.data;

  if (payload.isPackage) {
    const { data: createdPackage, error: createPackageError } = await supabaseAdmin
      .from("packages")
      .insert({
        tenant_id: tenantId,
        name: payload.name,
        description: payload.description ?? null,
        price: payload.price ?? null,
        duration_minutes: payload.durationMinutes ?? null,
        is_active: true,
      })
      .select("*")
      .single();

    if (createPackageError || !createdPackage) {
      return NextResponse.json({ error: createPackageError?.message ?? "Failed to create package." }, { status: 500 });
    }

    const includedServiceIds = Array.isArray(payload.includedServiceIds) ? payload.includedServiceIds : [];
    if (includedServiceIds.length > 0) {
      const { error: itemsError } = await supabaseAdmin.from("package_items").insert(
        includedServiceIds.map((serviceId: string) => ({
          package_id: createdPackage.id,
          service_id: serviceId,
        }))
      );
      if (itemsError) {
        return NextResponse.json({ error: itemsError.message }, { status: 500 });
      }
    }

    return NextResponse.json(mapPackage(createdPackage as PackageRow, includedServiceIds.map((id: string) => ({ package_id: createdPackage.id, service_id: id }))));
  }

  const { data: createdService, error: createServiceError } = await supabaseAdmin
    .from("services")
    .insert({
      tenant_id: tenantId,
      name: payload.name,
      description: payload.description ?? null,
      category: payload.category ?? "core",
      price: payload.price ?? null,
      duration_minutes: payload.durationMinutes ?? null,
      template_id: payload.templateId ?? null,
      is_active: true,
    })
    .select("*")
    .single();

  if (createServiceError || !createdService) {
    return NextResponse.json({ error: createServiceError?.message ?? "Failed to create service." }, { status: 500 });
  }

  return NextResponse.json(mapService(createdService as ServiceRow));
}
