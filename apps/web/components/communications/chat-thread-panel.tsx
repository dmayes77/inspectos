"use client";

import { formatTimestampFull } from "@/lib/utils/dates";
import type { CommunicationChannel, CommunicationEntityType } from "@/lib/types/communication";
import { Mail, MessageSquare, PhoneCall, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useCommunicationThread } from "@/hooks/use-communication-thread";
import clsx from "clsx";

const CHANNEL_ICONS: Record<CommunicationChannel, typeof Mail> = {
  email: Mail,
  sms: MessageSquare,
  phone: PhoneCall,
};

const CHANNEL_LABELS: Record<CommunicationChannel, string> = {
  email: "Email",
  sms: "SMS",
  phone: "Phone",
};

type ChatThreadPanelProps = {
  entityType: CommunicationEntityType;
  entityId: string;
};

export function ChatThreadPanel({ entityType, entityId }: ChatThreadPanelProps) {
  const { data, isLoading, error } = useCommunicationThread(entityType, entityId);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-1">
          <CardTitle>Communication Thread</CardTitle>
          <CardDescription>Messages tied to this {entityType} record.</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="text-sm text-destructive">Failed to load thread.</div>
        ) : !data || data.messages.length === 0 ? (
          <div className="text-sm text-muted-foreground">No messages yet.</div>
        ) : (
          <div className="space-y-3">
            {data.messages.map((message) => {
              const Icon = CHANNEL_ICONS[message.channel];
              const badgeVariant = message.direction === "outbound" ? "outline" : "secondary";
              return (
                <div
                  key={message.id}
                  className={clsx(
                    "flex flex-col gap-2 rounded-2xl border p-4",
                    message.direction === "outbound"
                      ? "border-primary/60 bg-primary/5"
                      : "border-border bg-background",
                  )}
                >
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <Icon className="h-3 w-3" />
                    <span>{CHANNEL_LABELS[message.channel]}</span>
                    <span>·</span>
                    <Badge className="rounded-full px-2 text-[10px]" variant={badgeVariant}>
                      {message.direction === "outbound" ? "Sent" : "Received"}
                    </Badge>
                    <span className="ml-auto text-[11px] text-muted-foreground">
                      {formatTimestampFull(message.timestamp)}
                    </span>
                  </div>
                  <p className="text-sm leading-snug text-foreground">{message.body}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>From</span>
                    <span className="font-medium text-foreground">{message.sender}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
