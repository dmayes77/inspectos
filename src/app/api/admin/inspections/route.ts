import { NextResponse } from "next/server";
import { getInspections, createInspection } from "@/lib/mock/inspections";

// Temporary API stub for admin inspections.
// - Works without DB/auth so frontend can be developed and tested.
// - Replace with actual DB + `auth()` + `withTenant()` later.

export async function GET(request: Request) {
  const url = new URL(request.url);
  const search = url.searchParams.get("search") ?? undefined;

  const data = getInspections({ search });
  return NextResponse.json({ data, total: data.length });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Basic validation — allow partial data for quick UI testing
    const created = createInspection(body);

    return NextResponse.json({ inspectionId: created.inspectionId }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
