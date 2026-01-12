import { NextResponse } from "next/server";
import { getClients, addClient } from "@/lib/mock/clients";

export async function GET() {
  const data = getClients();
  return NextResponse.json({ data, total: data.length });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const created = addClient(body);
    return NextResponse.json({ data: created }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
