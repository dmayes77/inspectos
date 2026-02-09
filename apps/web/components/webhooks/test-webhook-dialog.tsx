"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, CheckCircle2, XCircle, Clock } from "lucide-react";
import { useWebhook, useTestWebhook } from "@/hooks/use-webhooks";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

type TestWebhookDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  webhookId: string;
};

export function TestWebhookDialog({ open, onOpenChange, webhookId }: TestWebhookDialogProps) {
  const { data: webhook } = useWebhook(webhookId);
  const testWebhook = useTestWebhook();

  const [selectedEvent, setSelectedEvent] = useState<string>("");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [testResult, setTestResult] = useState<any>(null);

  const handleTest = async () => {
    if (!selectedEvent) {
      toast.error("Please select an event to test");
      return;
    }

    try {
      const result = await testWebhook.mutateAsync({
        id: webhookId,
        event: selectedEvent,
      });
      setTestResult({ ...result, success: true });
      toast.success("Webhook test successful!");
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const typedError = error as any;
      toast.error(typedError.message || "Failed to test webhook");
      setTestResult({
        success: false,
        error: typedError.message,
      });
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      setSelectedEvent("");
      setTestResult(null);
    }, 200);
  };

  if (!webhook) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Test Webhook</DialogTitle>
          <DialogDescription>
            Send a test payload to {webhook.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Webhook URL</Label>
            <div className="rounded-md border p-2 bg-muted">
              <code className="text-xs break-all">{webhook.url}</code>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="event">Select Event to Test</Label>
            <Select value={selectedEvent} onValueChange={setSelectedEvent}>
              <SelectTrigger id="event">
                <SelectValue placeholder="Choose an event type" />
              </SelectTrigger>
              <SelectContent>
                {webhook.events.map((event) => (
                  <SelectItem key={event} value={event}>
                    {event}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              A sample payload will be generated for this event type
            </p>
          </div>

          {testResult && (
            <Card className={testResult.success ? "border-green-500" : "border-red-500"}>
              <CardContent className="pt-6 space-y-3">
                <div className="flex items-center gap-2">
                  {testResult.success ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                  <span className="font-medium">
                    {testResult.success ? "Test Successful" : "Test Failed"}
                  </span>
                </div>

                {testResult.status && (
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">HTTP Status</div>
                    <Badge
                      variant={testResult.status >= 200 && testResult.status < 300 ? "default" : "destructive"}
                    >
                      {testResult.status}
                    </Badge>
                  </div>
                )}

                {testResult.response_time_ms !== undefined && (
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">Response Time</div>
                    <div className="flex items-center gap-1 text-sm">
                      <Clock className="h-3 w-3" />
                      {testResult.response_time_ms}ms
                    </div>
                  </div>
                )}

                {testResult.delivery_id && (
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">Delivery ID</div>
                    <code className="text-xs bg-muted px-2 py-1 rounded">
                      {testResult.delivery_id}
                    </code>
                  </div>
                )}

                {testResult.error && (
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">Error</div>
                    <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                      {testResult.error}
                    </div>
                  </div>
                )}

                {testResult.response_body && (
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">Response Body</div>
                    <div className="max-h-40 overflow-auto">
                      <pre className="text-xs bg-muted p-2 rounded whitespace-pre-wrap break-words">
                        {testResult.response_body}
                      </pre>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Close
          </Button>
          <Button
            onClick={handleTest}
            disabled={!selectedEvent || testWebhook.isPending}
          >
            {testWebhook.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Send Test
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
