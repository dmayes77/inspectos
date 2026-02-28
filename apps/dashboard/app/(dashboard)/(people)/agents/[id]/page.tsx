"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { IdPageLayout } from "@/components/shared/id-page-layout";
import { SaveButton } from "@/components/shared/action-buttons";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AgentForm, type AgentFormValues } from "@/components/partners/agent-form";
import { AgentInternetScrub } from "@/components/partners/agent-internet-scrub";
import { useAgentById, useUpdateAgent } from "@/hooks/use-agents";
import { useAgencies } from "@/hooks/use-agencies";
import { toast } from "sonner";
import type { Agent } from "@/hooks/use-agents";
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

type Params = { id: string };

const toFormValues = (agent?: Agent | null): AgentFormValues => {
  const parsedAddress = parseScrubbedAddress(agent?.agency_address ?? null);
  return {
    name: agent?.name ?? "",
    role: agent?.role ?? "",
    avatarUrl: agent?.avatar_url ?? null,
    brandLogoUrl: agent?.brand_logo_url ?? null,
    agencyId: agent?.agency_id ?? null,
    agencyName: agent?.agency?.name ?? "",
    agencyWebsite: agent?.agency?.website ?? "",
    agencyAddressLine1: parsedAddress?.addressLine1 ?? "",
    agencyAddressLine2: parsedAddress?.addressLine2 ?? "",
    agencyCity: parsedAddress?.city ?? "",
    agencyState: parsedAddress?.state ?? "",
    agencyZipCode: parsedAddress?.zipCode ?? "",
    status: agent?.status ?? "active",
    email: agent?.email ?? "",
    phone: agent?.phone ?? "",
    licenseNumber: agent?.license_number ?? "",
    preferredReportFormat: agent?.preferred_report_format ?? "pdf",
    notifyOnSchedule: agent?.notify_on_schedule ?? true,
    notifyOnComplete: agent?.notify_on_complete ?? true,
    notifyOnReport: agent?.notify_on_report ?? true,
    portalAccessEnabled: agent?.portal_access_enabled ?? true,
    notes: agent?.notes ?? "",
  };
};

const AGENT_TIPS = [
  "Keep portal notifications on so agents never miss a milestone.",
  "Tie each agent to the right agency to keep payouts accurate.",
  "Use notes for commission splits, coverage areas, or renewal reminders.",
];

export default function EditAgentPage() {
  const params = useParams();
  const { id: agentId } = params as Params;
  const router = useRouter();
  const { data: agent, isLoading } = useAgentById(agentId);
  const { data: agencies = [] } = useAgencies();
  const updateAgent = useUpdateAgent();
  const [form, setForm] = useState<AgentFormValues>(toFormValues());

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
      description: "Scrubbed profile data copied into this form.",
    });
  };

  useEffect(() => {
    if (agent) {
      setForm(toFormValues(agent));
    }
  }, [agent]);

  if (isLoading) {
    return (
      <div className="py-12 text-center text-muted-foreground">Loading agent...</div>
    );
  }

  if (!agent) {
    return (
      <IdPageLayout
        title="Agent Not Found"
        description="We couldn't locate that agent record."
        left={null}
      />
    );
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.name.trim()) {
      toast.error("Agent name is required");
      return;
    }

    const payload = {
      id: agent.id,
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
      await updateAgent.mutateAsync(payload);
      toast.success("Agent updated");
      router.push(`/agents/${toSlugIdSegment(agent.name, agent.public_id ?? agent.id)}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update agent";
      toast.error(message);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit}>
        <IdPageLayout
          title="Agent"
          description="Adjust relationship details and portal settings"
          breadcrumb={
            <>
              <Link href="/agents" className="text-muted-foreground transition hover:text-foreground">
                Agents
              </Link>
              <span className="text-muted-foreground">{">"}</span>
              <span className="max-w-[20rem] truncate font-medium">{agent.name}</span>
            </>
          }
          left={
            <div className="space-y-4">
              <AgentInternetScrub onApply={applyScrubResult} urlRequired={false} />
              <AgentForm form={form} setForm={setForm} agencies={agencies} agentId={agent.id} />
            </div>
          }
          right={
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <SaveButton type="submit" className="w-full" isSaving={updateAgent.isPending} />
                  <Button type="button" variant="outline" className="w-full" asChild>
                    <Link href={`/agents/${toSlugIdSegment(agent.name, agent.public_id ?? agent.id)}`}>Cancel</Link>
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
