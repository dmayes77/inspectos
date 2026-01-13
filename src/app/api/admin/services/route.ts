import { NextResponse } from "next/server";
import {
  getServices,
  createService,
} from "@/lib/mock/services";

export async function GET() {
  return NextResponse.json({ data: getServices() });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validation: If creating a package, ensure services exist
    if (body.isPackage) {
      if (!body.includedServiceIds || body.includedServiceIds.length === 0) {
        return NextResponse.json(
          { error: "Packages must include at least one service" },
          { status: 400 }
        );
      }

      // Check for circular references (package including itself)
      const allServices = getServices();
      const serviceIds = body.includedServiceIds;

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

    const created = createService(body);
    return NextResponse.json({ serviceId: created.serviceId }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
