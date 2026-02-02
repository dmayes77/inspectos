import { NextRequest, NextResponse } from "next/server";
import { getCommunicationThread } from "@/lib/data/communication-threads";
import type { CommunicationEntityType } from "@/lib/types/communication";

const VALID_ENTITY_TYPES: CommunicationEntityType[] = ["agent", "client", "lead", "vendor"];

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ entityType: string; entityId: string }> }
) {
  const { entityType, entityId } = await params;

  if (!entityType || !entityId) {
    return NextResponse.json(
      { error: "entityType and entityId are required" },
      { status: 400 }
    );
  }

  const typedEntityType = entityType as CommunicationEntityType;
  if (!VALID_ENTITY_TYPES.includes(typedEntityType)) {
    return NextResponse.json(
      { error: "Invalid entity type" },
      { status: 400 }
    );
  }

  const messages = getCommunicationThread(typedEntityType, entityId);

  return NextResponse.json({ data: { entityType: typedEntityType, entityId, messages } });
}
