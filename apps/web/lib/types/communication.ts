export type CommunicationEntityType = "agent" | "client" | "lead" | "vendor";
export type CommunicationChannel = "email" | "sms" | "phone";
export type CommunicationDirection = "inbound" | "outbound";

export interface CommunicationMessage {
  id: string;
  channel: CommunicationChannel;
  direction: CommunicationDirection;
  sender: string;
  body: string;
  timestamp: string;
}

export interface CommunicationThread {
  entityType: CommunicationEntityType;
  entityId: string;
  messages: CommunicationMessage[];
}
