import type { CommunicationChannel, CommunicationDirection, CommunicationEntityType, CommunicationMessage } from "@/lib/types/communication";

const ENTITY_LABELS: Record<CommunicationEntityType, string> = {
  agent: "Agent",
  client: "Client",
  lead: "Lead",
  vendor: "Vendor",
};

const CHANNEL_DEFAULTS: Record<CommunicationChannel, string> = {
  email: "Email",
  sms: "SMS",
  phone: "Phone",
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

export function getCommunicationThread(entityType: CommunicationEntityType, entityId: string): CommunicationMessage[] {
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
