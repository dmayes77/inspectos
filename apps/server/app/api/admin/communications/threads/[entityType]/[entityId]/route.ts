import { badRequest, success } from '@/lib/supabase';
import { withAuth } from '@/lib/api/with-auth';
import type { CommunicationChannel, CommunicationDirection, CommunicationEntityType, CommunicationMessage } from '@inspectos/shared/types/communication';

const VALID_ENTITY_TYPES: CommunicationEntityType[] = ["agent", "client", "lead", "vendor"];

const ENTITY_LABELS: Record<CommunicationEntityType, string> = {
  agent: "Agent",
  client: "Client",
  lead: "Lead",
  vendor: "Vendor",
};

type Template = {
  channel: CommunicationChannel;
  direction: CommunicationDirection;
  sender: string;
  body: string;
};

const THREAD_TEMPLATES: Template[] = [
  {
    channel: "email",
    direction: "outbound",
    sender: "Inspection Ops",
    body: "Queued a welcome note after onboarding {entityLabel} {entityId}.",
  },
  {
    channel: "email",
    direction: "inbound",
    sender: "{entityLabel} {entityId}",
    body: "Confirmed details, asked to include special vendor instructions.",
  },
  {
    channel: "sms",
    direction: "outbound",
    sender: "Scheduling Bot",
    body: "Sent a reminder text about the upcoming inspection slot.",
  },
  {
    channel: "phone",
    direction: "inbound",
    sender: "{entityLabel} {entityId}",
    body: "Called to clarify availability for next week.",
  },
];

function buildTimestamp(minutesAgo: number): string {
  return new Date(Date.now() - minutesAgo * 60 * 1000).toISOString();
}

function generateMockThread(entityType: CommunicationEntityType, entityId: string): CommunicationMessage[] {
  return THREAD_TEMPLATES.map((template, index) => {
    const entityLabel = ENTITY_LABELS[entityType];
    const baseBody = template.body
      .replace("{entityLabel}", entityLabel)
      .replace("{entityId}", entityId);
    const sender = template.sender
      .replace("{entityLabel}", entityLabel)
      .replace("{entityId}", entityId);

    return {
      id: `${entityType}-${entityId}-${index + 1}`,
      channel: template.channel,
      direction: template.direction,
      sender,
      body: baseBody,
      timestamp: buildTimestamp((index + 1) * 4),
    };
  });
}

/**
 * GET /api/admin/communications/threads/[entityType]/[entityId]
 * Get communication thread for a specific entity
 */
export const GET = withAuth<{ entityType: string; entityId: string }>(async ({ params }) => {
  const { entityType, entityId } = params;

  if (!entityType || !entityId) {
    return badRequest('entityType and entityId are required');
  }

  const typedEntityType = entityType as CommunicationEntityType;
  if (!VALID_ENTITY_TYPES.includes(typedEntityType)) {
    return badRequest('Invalid entity type');
  }

  // TODO: Replace with real database query when communication_messages table is ready
  // For now, return mock data
  const messages = generateMockThread(typedEntityType, entityId);

  return success({ entityType: typedEntityType, entityId, messages });
});
