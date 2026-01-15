import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const bodySchema = z.object({
  token: z.string().min(10),
  enabled: z.boolean().optional(),
  platform: z.enum(["ios", "android", "web"]).default("ios"),
});

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await request.json();
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { token, enabled = true, platform } = parsed.data;

  const upserted = await db.deviceToken.upsert({
    where: { token },
    update: {
      userId: session.user.id,
      enabled,
      lastSeenAt: new Date(),
      platform,
    },
    create: {
      token,
      userId: session.user.id,
      enabled,
      platform,
    },
  });

  return NextResponse.json({ data: { id: upserted.id, token: upserted.token, platform: upserted.platform } });
}
