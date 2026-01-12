import { NextResponse } from "next/server";
import { getInspectionById, updateInspection, deleteInspection } from "@/lib/mock/inspections";

export async function GET(
  request: Request,
  context: { params: { id: string } }
) {
  const { params } = await Promise.resolve(context);
  const inspection = getInspectionById(params.id);
  if (!inspection) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ data: inspection });
}

export async function PATCH(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    const { params } = await Promise.resolve(context);
    const body = await request.json();
    const updated = updateInspection(params.id, body);
    if (!updated) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ data: updated });
  } catch (err) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

export async function DELETE(
  request: Request,
  context: { params: { id: string } }
) {
  const { params } = await Promise.resolve(context);
  const deleted = deleteInspection(params.id);
  if (!deleted) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
