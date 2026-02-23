"use client";

import { Dispatch, SetStateAction, useState, type ChangeEvent } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { CompanyLogo } from "@/components/shared/company-logo";
import type { AgentStatus, ReportFormat } from "@/hooks/use-agents";
import type { Agency } from "@/hooks/use-agencies";
import { toast } from "sonner";

export type AgentFormValues = {
  name: string;
  role: string;
  avatarUrl: string | null;
  brandLogoUrl: string | null;
  agencyId: string | null;
  agencyName: string;
  agencyWebsite: string;
  agencyAddressLine1: string;
  agencyAddressLine2: string;
  agencyCity: string;
  agencyState: string;
  agencyZipCode: string;
  status: AgentStatus;
  email: string;
  phone: string;
  licenseNumber: string;
  preferredReportFormat: ReportFormat;
  notifyOnSchedule: boolean;
  notifyOnComplete: boolean;
  notifyOnReport: boolean;
  notes: string;
};

const statusOptions: { label: string; value: AgentStatus }[] = [
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
];

const reportFormats: { label: string; value: ReportFormat }[] = [
  { label: "PDF", value: "pdf" },
  { label: "HTML", value: "html" },
  { label: "PDF + HTML", value: "both" },
];

type AgentFormProps = {
  form: AgentFormValues;
  setForm: Dispatch<SetStateAction<AgentFormValues>>;
  agencies: Pick<Agency, "id" | "name">[];
  agentId?: string;
};

const MAX_AVATAR_SIZE = 2 * 1024 * 1024;
const ALLOWED_AVATAR_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];

export function AgentForm({ form, setForm, agencies, agentId }: AgentFormProps) {
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const handleChange = <Field extends keyof AgentFormValues>(field: Field, value: AgentFormValues[Field]) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAgencyNameChange = (value: string) => {
    setForm((prev) => {
      const normalized = value.trim().toLowerCase();
      const match = normalized ? agencies.find((agency) => agency.name.toLowerCase() === normalized) : null;
      return {
        ...prev,
        agencyName: value,
        agencyId: match?.id ?? null,
      };
    });
  };

  const matchedAgency = (() => {
    const normalized = form.agencyName.trim().toLowerCase();
    if (!normalized) return null;
    return agencies.find((agency) => agency.name.toLowerCase() === normalized) ?? null;
  })();

  const initials =
    form.name
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("")
      .slice(0, 2) || "AG";

  const uploadAvatar = async (file: File) => {
    if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
      toast.error("Use PNG, JPEG, WebP, or GIF images.");
      return;
    }

    if (file.size > MAX_AVATAR_SIZE) {
      toast.error("Profile photos must be under 2MB.");
      return;
    }

    const previousUrl = form.avatarUrl && form.avatarUrl.startsWith("http") ? form.avatarUrl : null;
    const formData = new FormData();
    formData.append("file", file);
    if (agentId) {
      formData.append("agentId", agentId);
    }
    if (previousUrl) {
      formData.append("previousUrl", previousUrl);
    }

    setIsUploadingAvatar(true);
    try {
      const response = await fetch("/api/admin/agents/avatar", {
        method: "POST",
        body: formData,
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data?.avatarUrl) {
        const message = data?.error ?? "Failed to upload profile photo.";
        throw new Error(message);
      }
      handleChange("avatarUrl", data.avatarUrl);
      toast.success("Profile photo updated");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to upload profile photo.";
      toast.error(message);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleAvatarChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    await uploadAvatar(file);
  };

  const handleRemoveAvatar = async () => {
    if (!form.avatarUrl) {
      handleChange("avatarUrl", null);
      return;
    }

    if (!form.avatarUrl.startsWith("http")) {
      handleChange("avatarUrl", null);
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const response = await fetch("/api/admin/agents/avatar", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: form.avatarUrl }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.error ?? "Failed to remove profile photo.");
      }
      handleChange("avatarUrl", null);
      toast.success("Profile photo removed");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to remove profile photo.";
      toast.error(message);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Agent Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <Avatar className="h-16 w-16">
              <AvatarImage src={form.avatarUrl ?? undefined} alt={form.name || "Agent avatar"} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <div className="grid gap-2">
                <Label htmlFor="agent-avatar">Profile photo</Label>
                <Input id="agent-avatar" type="file" accept="image/*" onChange={handleAvatarChange} disabled={isUploadingAvatar} />
                <p className="text-xs text-muted-foreground">{isUploadingAvatar ? "Uploading photo..." : "Use a square JPG, PNG, WebP, or GIF under 2MB."}</p>
              </div>
              {form.avatarUrl && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="px-0 text-muted-foreground"
                  onClick={handleRemoveAvatar}
                  disabled={isUploadingAvatar}
                >
                  {isUploadingAvatar ? "Removing..." : "Remove photo"}
                </Button>
              )}
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="agent-name">Agent name *</Label>
            <Input id="agent-name" value={form.name} onChange={(event) => handleChange("name", event.target.value)} placeholder="Emma Carter" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="agent-role">Role / title</Label>
            <Input id="agent-role" value={form.role} onChange={(event) => handleChange("role", event.target.value)} placeholder="Senior Broker" />
            <p className="text-xs text-muted-foreground">Appears on the agent profile so sales knows how to address them.</p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="agent-status">Status</Label>
            <Select value={form.status} onValueChange={(value: AgentStatus) => handleChange("status", value)}>
              <SelectTrigger id="agent-status">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="agent-email">Email</Label>
            <Input
              id="agent-email"
              type="email"
              value={form.email}
              onChange={(event) => handleChange("email", event.target.value)}
              placeholder="emma@sunsetrealty.com"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="agent-phone">Phone</Label>
            <Input id="agent-phone" value={form.phone} onChange={(event) => handleChange("phone", event.target.value)} placeholder="(555) 987-6543" />
          </div>
          <div className="grid gap-2 md:col-span-2">
            <Label htmlFor="agent-license">License number</Label>
            <Input
              id="agent-license"
              value={form.licenseNumber}
              onChange={(event) => handleChange("licenseNumber", event.target.value)}
              placeholder="LIC-8675309"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Agency Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <CompanyLogo name={form.agencyName || form.name || "Agency"} logoUrl={form.brandLogoUrl} size={64} className="h-16 w-16" />
              <div className="flex-1 space-y-2">
                <Label htmlFor="agent-agency">Agency name</Label>
                <Input
                  id="agent-agency"
                  value={form.agencyName}
                  onChange={(event) => handleAgencyNameChange(event.target.value)}
                  placeholder="Choice Homes"
                  className="flex-1"
                />
                <p className="text-xs text-muted-foreground">
                  {matchedAgency
                    ? `Linked to ${matchedAgency.name} in your directory.`
                    : "Enter the brokerage name. We'll link it automatically when it matches an existing agency."}
                </p>
              </div>
            </div>
            {!form.brandLogoUrl && <p className="text-sm text-muted-foreground">We&apos;ll fetch the brokerage logo as soon as the profile is scrubbed.</p>}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="agent-agency-address-line1">Agency address line 1</Label>
            <Input
              id="agent-agency-address-line1"
              value={form.agencyAddressLine1}
              onChange={(event) => handleChange("agencyAddressLine1", event.target.value)}
              placeholder="400 E Main St"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="agent-agency-address-line2">Agency address line 2</Label>
            <Input
              id="agent-agency-address-line2"
              value={form.agencyAddressLine2}
              onChange={(event) => handleChange("agencyAddressLine2", event.target.value)}
              placeholder="Suite 200"
            />
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="grid gap-2">
              <Label htmlFor="agent-agency-city">City</Label>
              <Input
                id="agent-agency-city"
                value={form.agencyCity}
                onChange={(event) => handleChange("agencyCity", event.target.value)}
                placeholder="Chattanooga"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="agent-agency-state">State</Label>
              <Input id="agent-agency-state" value={form.agencyState} onChange={(event) => handleChange("agencyState", event.target.value)} placeholder="TN" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="agent-agency-zip">ZIP</Label>
              <Input
                id="agent-agency-zip"
                value={form.agencyZipCode}
                onChange={(event) => handleChange("agencyZipCode", event.target.value)}
                placeholder="37408"
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">We save whatever was found online so the agency card always shows a mailing address.</p>
          <div className="grid gap-2">
            <Label htmlFor="agent-agency-website">Agency website</Label>
            <Input
              id="agent-agency-website"
              type="url"
              inputMode="url"
              value={form.agencyWebsite}
              onChange={(event) => handleChange("agencyWebsite", event.target.value)}
              placeholder="https://chattanoogapropertyshop.com"
            />
            <p className="text-xs text-muted-foreground">Used to hydrate brokerage cards when we auto-create an agency.</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Report Delivery</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="agent-report-format">Preferred format</Label>
            <Select value={form.preferredReportFormat} onValueChange={(value: ReportFormat) => handleChange("preferredReportFormat", value)}>
              <SelectTrigger id="agent-report-format">
                <SelectValue placeholder="Choose format" />
              </SelectTrigger>
              <SelectContent>
                {reportFormats.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-medium">Schedule updates</p>
              <p className="text-sm text-muted-foreground">Send when an inspection is scheduled.</p>
            </div>
            <Switch checked={form.notifyOnSchedule} onCheckedChange={(checked) => handleChange("notifyOnSchedule", checked)} />
          </div>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-medium">Completion updates</p>
              <p className="text-sm text-muted-foreground">Notify when the inspection wraps up.</p>
            </div>
            <Switch checked={form.notifyOnComplete} onCheckedChange={(checked) => handleChange("notifyOnComplete", checked)} />
          </div>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-medium">Report delivered</p>
              <p className="text-sm text-muted-foreground">Alert when the final report is published.</p>
            </div>
            <Switch checked={form.notifyOnReport} onCheckedChange={(checked) => handleChange("notifyOnReport", checked)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            id="agent-notes"
            value={form.notes}
            onChange={(event) => handleChange("notes", event.target.value)}
            placeholder="Record relationship nuances, preferred communication cadence, or incentives."
            rows={4}
          />
        </CardContent>
      </Card>
    </div>
  );
}
