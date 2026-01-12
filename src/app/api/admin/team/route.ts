import { NextRequest, NextResponse } from "next/server";
import { getTeamMembers, createTeamMember } from "@/lib/mock/team";

export async function GET() {
  const data = getTeamMembers();
  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const created = createTeamMember(body);
  return NextResponse.json({ data: created });
}
