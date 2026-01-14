import { NextResponse } from "next/server";
import { updateTeamMember } from "@/lib/mock/team";

export async function POST(request: Request, context: { params: { id: string } }) {
  try {
    const body = await request.json();
    const avatarUrl = typeof body?.avatarUrl === "string" ? body.avatarUrl : "";
    const updated = updateTeamMember(context.params.id, { avatarUrl });
    if (!updated) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ data: { avatarUrl: updated.avatarUrl } });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
