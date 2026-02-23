"use client";

import { useEffect, useState } from "react";
import { AdminPageHeader } from "@/layout/admin-page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useApiClient } from "@/lib/api/tenant-context";
import { Alert } from "@/components/ui/alert";

type SmtpSettings = {
  host: string;
  port: number;
  secure: boolean;
  username: string;
  fromEmail: string;
  fromName: string;
  replyTo: string;
  hasPassword: boolean;
  configured: boolean;
  lastTestAt: string | null;
  lastTestStatus: "ok" | "failed" | null;
  lastTestError: string | null;
};

const EMPTY_SMTP: SmtpSettings = {
  host: "",
  port: 465,
  secure: true,
  username: "",
  fromEmail: "",
  fromName: "",
  replyTo: "",
  hasPassword: false,
  configured: false,
  lastTestAt: null,
  lastTestStatus: null,
  lastTestError: null,
};

export default function SmtpSettingsPage() {
  const apiClient = useApiClient();
  const [smtp, setSmtp] = useState<SmtpSettings>(EMPTY_SMTP);
  const [platformConfigured, setPlatformConfigured] = useState(false);
  const [password, setPassword] = useState("");
  const [clearPassword, setClearPassword] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "ok" | "error"; message: string } | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const data = await apiClient.get<{ smtp: SmtpSettings; platformConfigured?: boolean }>(
          "/admin/settings/smtp"
        );
        if (!active) return;
        setSmtp(data.smtp);
        setPlatformConfigured(Boolean(data.platformConfigured));
      } catch (error) {
        if (!active) return;
        const message = error instanceof Error ? error.message : "Failed to load SMTP settings.";
        setFeedback({ type: "error", message });
      } finally {
        if (active) setIsLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [apiClient]);

  const saveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    setIsSaving(true);
    try {
      const data = await apiClient.put<{ smtp: SmtpSettings }>("/admin/settings/smtp", {
        host: smtp.host,
        port: smtp.port,
        secure: smtp.secure,
        username: smtp.username,
        password: password || undefined,
        clearPassword,
        fromEmail: smtp.fromEmail,
        fromName: smtp.fromName,
        replyTo: smtp.replyTo || undefined,
      });
      setSmtp(data.smtp);
      setPassword("");
      setClearPassword(false);
      setFeedback({ type: "ok", message: "SMTP settings saved." });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save SMTP settings.";
      setFeedback({ type: "error", message });
    } finally {
      setIsSaving(false);
    }
  };

  const sendTestEmail = async () => {
    setFeedback(null);
    setIsTesting(true);
    try {
      const payload = await apiClient.post<{ message: string; testedAt: string }>(
        "/admin/settings/smtp/test",
        { toEmail: testEmail || undefined }
      );
      setFeedback({ type: "ok", message: payload.message });
      const refresh = await apiClient.get<{ smtp: SmtpSettings; platformConfigured?: boolean }>(
        "/admin/settings/smtp"
      );
      setSmtp(refresh.smtp);
      setPlatformConfigured(Boolean(refresh.platformConfigured));
    } catch (error) {
      const message = error instanceof Error ? error.message : "SMTP test failed.";
      setFeedback({ type: "error", message });
    } finally {
      setIsTesting(false);
    }
  };

  if (isLoading) {
    return <div className="p-6 text-sm text-muted-foreground">Loading SMTP settings...</div>;
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="SMTP Configuration"
        description="Configure your business-owned SMTP provider for outbound business emails."
      />

      <Card>
        <CardHeader>
          <CardTitle>Connection</CardTitle>
          <CardDescription>
            Store host and credentials for your tenant email sender. Password is encrypted at rest.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {platformConfigured && !smtp.configured ? (
            <Alert
              variant="info"
              title="Using platform SMTP defaults"
              message="No tenant SMTP is configured. Test email will use APP_SMTP_* credentials from the server environment."
            />
          ) : null}
          <form onSubmit={saveSettings} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="smtp-host">Host</Label>
                <Input
                  id="smtp-host"
                  value={smtp.host}
                  onChange={(event) => setSmtp((prev) => ({ ...prev, host: event.target.value }))}
                  placeholder="smtp.yourprovider.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="smtp-port">Port</Label>
                <Input
                  id="smtp-port"
                  type="number"
                  value={smtp.port}
                  onChange={(event) => setSmtp((prev) => ({ ...prev, port: Number(event.target.value) || 0 }))}
                  min={1}
                  max={65535}
                  required
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="smtp-username">Username</Label>
                <Input
                  id="smtp-username"
                  value={smtp.username}
                  onChange={(event) => setSmtp((prev) => ({ ...prev, username: event.target.value }))}
                  placeholder="smtp-user"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="smtp-password">
                  Password {smtp.hasPassword ? "(leave blank to keep current)" : ""}
                </Label>
                <Input
                  id="smtp-password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder={smtp.hasPassword ? "••••••••" : "SMTP password"}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="from-email">From Email</Label>
                <Input
                  id="from-email"
                  type="email"
                  value={smtp.fromEmail}
                  onChange={(event) => setSmtp((prev) => ({ ...prev, fromEmail: event.target.value }))}
                  placeholder="no-reply@business.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="from-name">From Name</Label>
                <Input
                  id="from-name"
                  value={smtp.fromName}
                  onChange={(event) => setSmtp((prev) => ({ ...prev, fromName: event.target.value }))}
                  placeholder="Business Name"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="reply-to">Reply-To (optional)</Label>
                <Input
                  id="reply-to"
                  type="email"
                  value={smtp.replyTo}
                  onChange={(event) => setSmtp((prev) => ({ ...prev, replyTo: event.target.value }))}
                  placeholder="support@business.com"
                />
              </div>
              <div className="flex items-end">
                <label className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={smtp.secure}
                    onChange={(event) => setSmtp((prev) => ({ ...prev, secure: event.target.checked }))}
                  />
                  Use SSL/TLS (recommended)
                </label>
              </div>
            </div>

            {smtp.hasPassword ? (
              <label className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                <input
                  type="checkbox"
                  checked={clearPassword}
                  onChange={(event) => setClearPassword(event.target.checked)}
                />
                Clear stored SMTP password
              </label>
            ) : null}

            <div className="flex gap-3">
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Saving..." : "Save SMTP settings"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Test Email</CardTitle>
          <CardDescription>Send a verification email using the current SMTP settings.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="test-email">Recipient Email (optional)</Label>
            <Input
              id="test-email"
              type="email"
              value={testEmail}
              onChange={(event) => setTestEmail(event.target.value)}
              placeholder="Leave blank to send to your signed-in email"
            />
          </div>
          <Button type="button" variant="outline" onClick={sendTestEmail} disabled={isTesting}>
            {isTesting ? "Sending..." : "Send test email"}
          </Button>
          <p className="text-xs text-muted-foreground">
            Last test: {smtp.lastTestAt ? new Date(smtp.lastTestAt).toLocaleString() : "Never"}
            {smtp.lastTestStatus ? ` (${smtp.lastTestStatus})` : ""}
          </p>
          {smtp.lastTestError ? (
            <p className="text-xs text-red-600">{smtp.lastTestError}</p>
          ) : null}
        </CardContent>
      </Card>

      {feedback ? (
        <Alert
          variant={feedback.type === "ok" ? "success" : "error"}
          title={feedback.type === "ok" ? "Success" : "Error"}
          message={feedback.message}
        />
      ) : null}
    </div>
  );
}
