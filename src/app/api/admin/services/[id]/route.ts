import { NextRequest, NextResponse } from "next/server";
import {
  updateService,
  deleteService,
  getServices,
} from "@/lib/mock/services";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const body = await request.json();

    // Validation: If updating to a package, ensure services exist
    if (body.isPackage !== undefined && body.isPackage) {
      if (body.includedServiceIds && body.includedServiceIds.length === 0) {
        return NextResponse.json(
          { error: "Packages must include at least one service" },
          { status: 400 }
        );
      }

      if (body.includedServiceIds) {
        const allServices = getServices();
        const serviceIds = body.includedServiceIds;

        // Prevent circular reference (package including itself)
        if (serviceIds.includes(params.id)) {
          return NextResponse.json(
            { error: "Package cannot include itself" },
            { status: 400 }
          );
        }

        for (const serviceId of serviceIds) {
          const service = allServices.find((s) => s.serviceId === serviceId);
          if (!service) {
            return NextResponse.json(
              { error: `Service with ID ${serviceId} not found` },
              { status: 400 }
            );
          }
          if (service.isPackage) {
            return NextResponse.json(
              { error: "Packages cannot include other packages" },
              { status: 400 }
            );
          }
        }
      }
    }

    const updated = updateService(params.id, body);
    if (!updated) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ data: updated });
  } catch (_err) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  const ok = deleteService(params.id);
  if (!ok) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
