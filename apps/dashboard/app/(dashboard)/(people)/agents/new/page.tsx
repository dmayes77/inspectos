"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { IdPageLayout } from "@/components/shared/id-page-layout";
import { SaveButton } from "@/components/shared/action-buttons";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AgentForm, type AgentFormValues } from "@/components/partners/agent-form";
import { AgentInternetScrub } from "@/components/partners/agent-internet-scrub";
import { useAgencies } from "@/hooks/use-agencies";
import { useCreateAgent } from "@/hooks/use-agents";
import { toast } from "sonner";
import type { AgentScrubResult } from "@/types/agent-scrub";
import { toSlugIdSegment } from "@/lib/routing/slug-id";
import {
  buildAgencyAddress,
  normalize,
  normalizeWebsite,
  parseScrubbedAddress,
  resolveLogoForSubmit,
  websiteFromDomain,
} from "../../_shared/form-utils";

const DEFAULT_TENANT_SLUG = "demo";
const AGENT_TIPS = [
  "Assign the agent to an agency so referral payments reconcile quickly.",
  "Preferred formats keep delivery expectations aligned with their workflow.",
  "Notification toggles control how much noise they receive during inspections.",
];

const emptyForm: AgentFormValues = {
  name: "",
  role: "",
  avatarUrl: null,
  brandLogoUrl: null,
  agencyId: null,
  agencyName: "",
  agencyWebsite: "",
  agencyAddressLine1: "",
  agencyAddressLine2: "",
  agencyCity: "",
  agencyState: "",
  agencyZipCode: "",
  status: "active",
  email: "",
  phone: "",
  licenseNumber: "",
  preferredReportFormat: "pdf",
  notifyOnSchedule: true,
  notifyOnComplete: true,
  notifyOnReport: true,
  portalAccessEnabled: true,
  notes: "",
};


export default function NewAgentPage() {
  const router = useRouter();
  const { data: agencies = [] } = useAgencies();
  const createAgent = useCreateAgent();
  const [form, setForm] = useState<AgentFormValues>(emptyForm);

  const splitNameAndAgency = (value?: string | null) => {
    if (!value) return { agent: null, agency: null };
    const cleaned = value.replace(/\s+/g, " ").trim();
    if (!cleaned) return { agent: null, agency: null };
    const parts = cleaned.split(/\s*(?:—|–|-|\||•)\s*/).filter(Boolean);
    if (parts.length >= 2) {
      return { agent: parts[0], agency: parts.slice(1).join(" ") };
    }
    return { agent: cleaned, agency: null };
  };

  const findAgencyId = (name: string) => {
    const normalized = name.trim().toLowerCase();
    if (!normalized) return null;
    const match = agencies.find((agency) => agency.name.toLowerCase() === normalized);
    return match?.id ?? null;
  };

  const applyScrubResult = (result: AgentScrubResult) => {
    const licenseText = result.licenseNumbers.join(", ");
    const split = splitNameAndAgency(result.name);
    const agencyNameCandidate = (result.agencyName ?? split.agency ?? "").trim();
    const matchedAgencyId = agencyNameCandidate ? findAgencyId(agencyNameCandidate) : null;
    const sanitizedAgencyName = agencyNameCandidate || "";
    const sanitizedAgentName = (split.agent ?? result.name ?? "").trim();
    const website = websiteFromDomain(result.domain);
    const resolvedLogoUrl = resolveLogoForSubmit(result.logoUrl, result.domain ?? website ?? null) ?? null;
    const parsedAddress = parseScrubbedAddress(result.agencyAddress);
    setForm((prev) => ({
      ...prev,
      name: sanitizedAgentName,
      email: result.email?.trim() ?? "",
      phone: result.phone?.trim() ?? "",
      licenseNumber: licenseText,
      role: result.role?.trim() ?? "",
      avatarUrl: result.photoUrl ?? null,
      brandLogoUrl: resolvedLogoUrl,
      agencyName: sanitizedAgencyName,
      agencyId: sanitizedAgencyName ? matchedAgencyId : null,
      agencyAddressLine1: parsedAddress?.addressLine1 ?? "",
      agencyAddressLine2: parsedAddress?.addressLine2 ?? "",
      agencyCity: parsedAddress?.city ?? "",
      agencyState: parsedAddress?.state ?? "",
      agencyZipCode: parsedAddress?.zipCode ?? "",
      agencyWebsite: website,
    }));

    toast.success("Agent details applied", {
      description: "We copied the scrubbed profile data into this form.",
    });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.name.trim()) {
      toast.error("Agent name is required");
      return;
    }

    const payload = {
      tenant_slug: DEFAULT_TENANT_SLUG,
      agency_id: form.agencyId,
      agency_name: normalize(form.agencyName ?? "") ?? null,
      name: form.name.trim(),
      status: form.status,
      email: normalize(form.email),
      phone: normalize(form.phone),
      license_number: normalize(form.licenseNumber),
      role: normalize(form.role),
      preferred_report_format: form.preferredReportFormat,
      notify_on_schedule: form.notifyOnSchedule,
      notify_on_complete: form.notifyOnComplete,
      notify_on_report: form.notifyOnReport,
      portal_access_enabled: form.portalAccessEnabled,
      notes: normalize(form.notes),
      avatar_url: form.avatarUrl ?? null,
      brand_logo_url: normalize(form.brandLogoUrl ?? ""),
      agency_address: normalize(buildAgencyAddress(form) ?? ""),
      agency_website: normalizeWebsite(form.agencyWebsite),
    };

    try {
      const agent = await createAgent.mutateAsync(payload);
      toast.success("Agent created");
      router.push(`/agents/${toSlugIdSegment(agent.name, agent.public_id ?? agent.id)}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create agent";
      toast.error(message);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit}>
        <IdPageLayout
          title="Add Agent"
          description="Invite referring agents and control portal access"
          breadcrumb={
            <>
              <Link href="/agents" className="text-muted-foreground transition hover:text-foreground">
                Agents
              </Link>
              <span className="text-muted-foreground">{">"}</span>
              <span className="max-w-[20rem] truncate font-medium">New Agent</span>
            </>
          }
          left={
            <div className="space-y-4">
              <AgentInternetScrub onApply={applyScrubResult} urlRequired={false} />
              <AgentForm form={form} setForm={setForm} agencies={agencies} />
            </div>
          }
          right={
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <SaveButton
                    type="submit"
                    className="w-full"
                    isSaving={createAgent.isPending}
                    label="Create Agent"
                    savingLabel="Creating..."
                  />
                  <Button type="button" variant="outline" className="w-full" asChild>
                    <Link href="/agents?tab=agents">Cancel</Link>
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Tips</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  {AGENT_TIPS.map((tip) => (
                    <p key={tip}>{tip}</p>
                  ))}
                </CardContent>
              </Card>
            </>
          }
        />
      </form>
    </>
  );
}
