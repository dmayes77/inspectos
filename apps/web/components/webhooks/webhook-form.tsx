"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, RefreshCw, Copy, Check } from "lucide-react";
import { useCreateWebhook, useUpdateWebhook, useWebhook } from "@/hooks/use-webhooks";
import { WEBHOOK_EVENTS, type WebhookEvent } from "@/lib/validations/webhook";
import type { Webhook } from "@/lib/types/webhook";
import { toast } from "sonner";

export type WebhookFormMode = "create" | "edit";

type ActionHelpers = {
  handleSubmit: () => Promise<void>;
  handleCancel: () => void;
  isSubmitting: boolean;
};

type WebhookFormProps = {
  mode: WebhookFormMode;
  webhookId?: string;
  onSuccess?: (createdWebhook?: Webhook) => void;
  onCancel?: () => void;
  renderActions?: (helpers: ActionHelpers) => ReactNode;
  className?: string;
};

export function WebhookForm({
  mode,
  webhookId,
  onSuccess,
  onCancel,
  renderActions,
  className = "",
}: WebhookFormProps) {
  const createWebhook = useCreateWebhook();
  const updateWebhook = useUpdateWebhook();
  const { data: existingWebhook } = useWebhook(webhookId || "");

  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<WebhookEvent[]>([]);
  const [secret, setSecret] = useState("");
  const [customHeaders, setCustomHeaders] = useState("");
  const [copiedSecret, setCopiedSecret] = useState(false);

  const isSubmitting = createWebhook.isPending || updateWebhook.isPending;

  const resetForm = () => {
    setName("");
    setUrl("");
    setDescription("");
    setSelectedEvents([]);
    setSecret("");
    setCustomHeaders("");
    setCopiedSecret(false);
  };

  useEffect(() => {
    if (mode === "edit" && existingWebhook) {
      setName(existingWebhook.name);
      setUrl(existingWebhook.url);
      setDescription(existingWebhook.description || "");
      setSelectedEvents(existingWebhook.events);
      setSecret(existingWebhook.secret || "");
      setCustomHeaders(
        existingWebhook.headers
          ? Object.entries(existingWebhook.headers)
              .map(([key, value]) => `${key}: ${value}`)
              .join("\n")
          : ""
      );
    } else if (mode === "create") {
      resetForm();
    }
  }, [mode, existingWebhook]);

  const generateSecret = () => {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    const generated = Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
    setSecret(generated);
  };

  const copySecret = () => {
    navigator.clipboard.writeText(secret);
    setCopiedSecret(true);
    setTimeout(() => setCopiedSecret(false), 2000);
    toast.success("Secret copied to clipboard");
  };

  const handleEventToggle = (event: WebhookEvent) => {
    setSelectedEvents((prev) =>
      prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event]
    );
  };

  const handleCancel = () => {
    onCancel?.();
    resetForm();
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error("Webhook name is required");
      return;
    }

    if (!url.trim()) {
      toast.error("Webhook URL is required");
      return;
    }

    if (!url.startsWith("https://")) {
      toast.error("Webhook URL must use HTTPS");
      return;
    }

    if (selectedEvents.length === 0) {
      toast.error("Select at least one event");
      return;
    }

    const headers: Record<string, string> = {};
    if (customHeaders.trim()) {
      const lines = customHeaders.split("\n");
      for (const line of lines) {
        const [key, ...valueParts] = line.split(":");
        if (key && valueParts.length > 0) {
          headers[key.trim()] = valueParts.join(":").trim();
        }
      }
    }

    const data = {
      name: name.trim(),
      url: url.trim(),
      description: description.trim() || null,
      events: selectedEvents,
      secret: secret.trim() || undefined,
      headers: Object.keys(headers).length > 0 ? headers : undefined,
    };

    try {
    if (mode === "create") {
      const created = await createWebhook.mutateAsync(data);
      toast.success("Webhook created successfully");
      setSecret(created.secret || "");
      onSuccess?.(created);
    } else if (webhookId) {
      const updated = await updateWebhook.mutateAsync({ id: webhookId, ...data });
      toast.success("Webhook updated successfully");
      onSuccess?.(updated);
    }
    } catch (error) {
      const typedError = error as { message?: string };
      toast.error(typedError.message || "Failed to save webhook");
    }
  };

  const eventGroups = [
    {
      label: "Order Events",
      events: WEBHOOK_EVENTS.filter((e) => e.startsWith("order.")),
    },
    {
      label: "Inspection Events",
      events: WEBHOOK_EVENTS.filter((e) => e.startsWith("inspection.")),
    },
    {
      label: "Client Events",
      events: WEBHOOK_EVENTS.filter((e) => e.startsWith("client.")),
    },
    {
      label: "Invoice Events",
      events: WEBHOOK_EVENTS.filter((e) => e.startsWith("invoice.")),
    },
    {
      label: "Schedule Events",
      events: WEBHOOK_EVENTS.filter((e) => e.startsWith("schedule.")),
    },
  ];

  const defaultActions = (
    <div className="flex justify-end gap-2 pt-4">
      <Button variant="outline" onClick={handleCancel} disabled={isSubmitting}>
        Cancel
      </Button>
      <Button onClick={handleSubmit} disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {mode === "create" ? "Create Webhook" : "Save Changes"}
      </Button>
    </div>
  );

  return (
    <div className={`space-y-4 py-4 ${className}`}>
      <div className="space-y-2">
        <Label htmlFor="name">Webhook Name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Zapier Integration"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="url">Webhook URL</Label>
        <Input
          id="url"
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://hooks.zapier.com/hooks/catch/..."
        />
        <p className="text-xs text-muted-foreground">
          Must use HTTPS. This is where webhook payloads will be sent.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description (Optional)</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Brief description of this webhook's purpose"
          rows={2}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Events to Subscribe</CardTitle>
          <CardDescription className="text-xs">
            Select which events should trigger this webhook
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {eventGroups.map((group) => (
            <div key={group.label} className="space-y-2">
              <div className="text-sm font-medium">{group.label}</div>
              <div className="space-y-2">
                {group.events.map((event) => (
                  <div key={event} className="flex items-center space-x-2">
                    <Checkbox
                      id={event}
                      checked={selectedEvents.includes(event)}
                      onCheckedChange={() => handleEventToggle(event)}
                    />
                    <Label htmlFor={event} className="text-sm font-normal cursor-pointer">
                      {event}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="space-y-2">
        <Label htmlFor="secret">Signing Secret (Optional)</Label>
        <div className="flex gap-2">
          <Input
            id="secret"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            placeholder="Leave empty to auto-generate"
            type="password"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={generateSecret}
            title="Generate random secret"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          {secret && (
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={copySecret}
              title="Copy secret"
            >
              {copiedSecret ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Used to sign webhook payloads with HMAC-SHA256. Verify the signature to ensure authenticity.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="headers">Custom Headers (Optional)</Label>
        <Textarea
          id="headers"
          value={customHeaders}
          onChange={(e) => setCustomHeaders(e.target.value)}
          placeholder="Authorization: Bearer token&#10;X-Custom-Header: value"
          rows={3}
        />
        <p className="text-xs text-muted-foreground">
          One header per line in format: Key: Value
        </p>
      </div>

      {renderActions ? renderActions({ handleSubmit, handleCancel, isSubmitting }) : defaultActions}
    </div>
  );
}
