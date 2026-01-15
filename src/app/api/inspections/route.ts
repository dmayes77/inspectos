import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { computeRequestHash } from "@/lib/api/idempotency";

const inspectionSchema = z.object({
  number: z.string().optional(),
  propertyId: z.string(),
  clientId: z.string().optional(),
  inspectorId: z.string().optional(),
  status: z.string().optional(),
  type: z.string().optional(),
  scheduledAt: z.string().optional(),
  notes: z.string().optional(),
  price: z.number().optional(),
  types: z.array(z.string()).optional(),
});

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const idempotencyKey = request.headers.get("idempotency-key");
  if (!idempotencyKey) {
    return NextResponse.json({ error: "Missing Idempotency-Key header" }, { status: 400 });
  }

  const json = await request.json();
  const parsed = inspectionSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const payload = parsed.data;
  const route = "/api/inspections";
  const requestHash = computeRequestHash(payload);

  const existing = await db.idempotencyKey.findUnique({
    where: { key: idempotencyKey },
  });

  if (existing) {
    return NextResponse.json(existing.responseBody ?? { data: null }, { status: existing.statusCode ?? 200 });
  }

  try {
    const inspection = await db.inspection.create({
      data: {
        number: payload.number ?? `INS-${Date.now()}`,
        propertyId: payload.propertyId,
        clientId: payload.clientId,
        inspectorId: payload.inspectorId,
        status: (payload.status as any) ?? "SCHEDULED",
        type: (payload.type as any) ?? "FULL_HOME",
        scheduledAt: payload.scheduledAt ? new Date(payload.scheduledAt) : undefined,
        notes: payload.notes,
        summaryStats: { price: payload.price ?? 0, types: payload.types ?? [] },
        companyId: session.user.companyId || session.user.companyId || "", // ensure tenant scoping if available
      },
    });

    const responseBody = { data: inspection };
    await db.idempotencyKey.create({
      data: {
        key: idempotencyKey,
        userId: session.user.id,
        route,
        requestHash,
        statusCode: 200,
        responseBody,
      },
    });

    return NextResponse.json(responseBody, { status: 200 });
  } catch (error) {
    await db.idempotencyKey.create({
      data: {
        key: idempotencyKey,
        userId: session.user.id,
        route,
        requestHash,
        statusCode: 500,
        responseBody: { error: "Failed to create inspection" },
      },
    });
    return NextResponse.json({ error: "Failed to create inspection" }, { status: 500 });
  }
}
