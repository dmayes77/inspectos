import { NextResponse } from "next/server";
import { getClientById, updateClient, deleteClient } from "@/lib/mock/clients";

export async function GET(
  request: Request,
  context: { params: { id: string } }
) {
  const { params } = await Promise.resolve(context);
  const client = getClientById(params.id);
  if (!client) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ data: client });
}

export async function PATCH(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    const { params } = await Promise.resolve(context);
    const body = await request.json();
    const updated = updateClient(params.id, body);
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
  const deleted = deleteClient(params.id);
  if (!deleted) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
