"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AdminShell } from "@/components/layout/admin-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { ResourceFormLayout } from "@/components/shared/resource-form-layout";
import { ResourceFormSidebar } from "@/components/shared/resource-form-sidebar";
import { AgentForm, type AgentFormValues } from "@/components/partners/agent-form";
import { AgentInternetScrub } from "@/components/partners/agent-internet-scrub";
import { useAgentById, useUpdateAgent } from "@/hooks/use-agents";
import { useAgencies } from "@/hooks/use-agencies";
import { mockAdminUser } from "@/lib/constants/mock-users";
import { toast } from "sonner";
import type { Agent } from "@/lib/data/agents";
import type { AgentScrubResult } from "@/types/agent-scrub";

type Params = { id: string };

const normalize = (value: string) => {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const normalizeWebsite = (value?: string | null) => {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  const sanitized = trimmed.replace(/^https?:\/\//i, "").replace(/\/+$/, "");
  if (!sanitized) return null;
  return `https://${sanitized}`;
};

const websiteFromDomain = (domain?: string | null) => normalizeWebsite(domain) ?? "";

type ParsedAddress = {
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  zipCode?: string;
};

const parseScrubbedAddress = (value?: string | null): ParsedAddress | null => {
  const trimmed = value?.trim();
  if (!trimmed) return null;

  const tokens = trimmed
    .split(/\r?\n+/)
    .flatMap((line) => line.split(","))
    .map((token) => token.trim())
    .filter(Boolean);

  if (tokens.length === 0) {
    return null;
  }

  const remaining = [...tokens];
  let addressLine1 = remaining.shift() ?? "";
  let zipCode: string | undefined;
  let state: string | undefined;
  let city: string | undefined;

  const isCountryToken = (token: string) => {
    const cleaned = token.replace(/\.+/g, "").trim();
    if (!cleaned) return false;
    const normalized = cleaned.replace(/[^a-z]/gi, "").toLowerCase();
    const countries = new Set(["us", "usa", "unitedstates", "unitedstatesofamerica"]);
    if (countries.has(normalized)) return true;
    if (/\d/.test(cleaned)) return false;
    if (/^[A-Za-z]{2}$/.test(cleaned)) return true;
    return false;
  };

  const extractCityStateZip = (source: string) => {
    const match = source.match(/^(.*?)(?:,\s*)?([A-Za-z .'-]+)\s*,?\s*([A-Za-z]{2})\s+(\d{5}(?:-\d{4})?)$/);
    if (!match) return null;
    const [, street, cityPart, statePart, zipPart] = match;
    return {
      street: street.trim(),
      city: cityPart.trim(),
      state: statePart.toUpperCase(),
      zip: zipPart,
    };
  };

  while (remaining.length > 0 && isCountryToken(remaining[remaining.length - 1])) {
    remaining.pop();
  }

  if (remaining.length > 0) {
    const last = remaining[remaining.length - 1];
    let working = last;
    const zipMatch = working.match(/\b\d{5}(?:-\d{4})?\b/);
    if (zipMatch) {
      zipCode = zipMatch[0];
      working = working.replace(zipMatch[0], "").trim();
    }
    const stateMatch = working.match(/\b[A-Za-z]{2}\b/);
    if (stateMatch) {
      state = stateMatch[0].toUpperCase();
      working = working.replace(stateMatch[0], "").replace(/,\s*$/, "").trim();
    }
    if (working) {
      remaining[remaining.length - 1] = working;
    } else {
      remaining.pop();
    }
  }

  if (!state && remaining.length > 0) {
    const last = remaining[remaining.length - 1];
    if (/^[A-Za-z]{2}$/.test(last)) {
      state = last.toUpperCase();
      remaining.pop();
    }
  }

  if (!zipCode && remaining.length > 0) {
    const last = remaining[remaining.length - 1];
    if (/^\d{5}(?:-\d{4})?$/.test(last)) {
      zipCode = last;
      remaining.pop();
    }
  }

  if (remaining.length > 0) {
    city = remaining.pop() ?? undefined;
  }

  const addressLine2 = remaining.length > 0 ? remaining.join(", ") : undefined;

  const applyFallback = () => {
    if (!addressLine1) return;
    const fallback = extractCityStateZip(addressLine1) ?? extractCityStateZip(trimmed);
    if (!fallback) return;
    if (fallback.street) {
      addressLine1 = fallback.street;
    }
    if (!city && fallback.city) {
      city = fallback.city;
    }
    if (!state && fallback.state) {
      state = fallback.state;
    }
    if (!zipCode && fallback.zip) {
      zipCode = fallback.zip;
    }
  };

  if (!city || !state || !zipCode) {
    applyFallback();
  }

  return {
    addressLine1,
    addressLine2,
    city,
    state,
    zipCode,
  };
};

const buildAgencyAddress = (values: Pick<AgentFormValues, "agencyAddressLine1" | "agencyAddressLine2" | "agencyCity" | "agencyState" | "agencyZipCode">) => {
  const segments: string[] = [];
  if (values.agencyAddressLine1?.trim()) {
    segments.push(values.agencyAddressLine1.trim());
  }
  if (values.agencyAddressLine2?.trim()) {
    segments.push(values.agencyAddressLine2.trim());
  }
  const cityState = [values.agencyCity?.trim(), values.agencyState?.trim()].filter(Boolean).join(", ");
  const locality = [cityState, values.agencyZipCode?.trim()].filter(Boolean).join(" ").trim();
  if (locality) {
    segments.push(locality);
  }
  return segments.length > 0 ? segments.join(", ") : null;
};

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
    const parsedAddress = parseScrubbedAddress(result.agencyAddress);
    setForm((prev) => ({
      ...prev,
      name: sanitizedAgentName,
      email: result.email?.trim() ?? "",
      phone: result.phone?.trim() ?? "",
      licenseNumber: licenseText,
      role: result.role?.trim() ?? "",
      avatarUrl: result.photoUrl ?? null,
      brandLogoUrl: result.logoUrl ?? null,
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
      <AdminShell user={mockAdminUser}>
        <div className="py-12 text-center text-muted-foreground">Loading agent...</div>
      </AdminShell>
    );
  }

  if (!agent) {
    return (
      <AdminShell user={mockAdminUser}>
        <PageHeader
          breadcrumb={
            <>
              <Link href="/admin/overview" className="hover:text-foreground">
                Overview
              </Link>
              <span className="text-muted-foreground">/</span>
              <Link href="/admin/agents" className="hover:text-foreground">
                Agents
              </Link>
              <span className="text-muted-foreground">/</span>
              <Link href="/admin/agents?tab=agents" className="hover:text-foreground">
                Agents
              </Link>
            </>
          }
          title="Agent Not Found"
          description="We couldn't locate that agent record."
          backHref="/admin/agents?tab=agents"
        />
      </AdminShell>
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
      notes: normalize(form.notes),
      avatar_url: form.avatarUrl ?? null,
      brand_logo_url: normalize(form.brandLogoUrl ?? ""),
      agency_address: normalize(buildAgencyAddress(form) ?? ""),
      agency_website: normalizeWebsite(form.agencyWebsite),
    };

    console.log("Updating agent", payload);

    try {
      await updateAgent.mutateAsync(payload);
      toast.success("Agent updated");
      router.push(`/admin/agents/${agent.id}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update agent";
      toast.error(message);
    }
  };

  return (
    <AdminShell user={mockAdminUser}>
      <div className="space-y-6">
        <PageHeader
          breadcrumb={
            <>
              <Link href="/admin/overview" className="hover:text-foreground">
                Overview
              </Link>
              <span className="text-muted-foreground">/</span>
              <Link href="/admin/agents" className="hover:text-foreground">
                Agents
              </Link>
              <span className="text-muted-foreground">/</span>
              <Link href="/admin/agents?tab=agents" className="hover:text-foreground">
                Agents
              </Link>
              <span className="text-muted-foreground">/</span>
              <Link href={`/admin/agents/${agent.id}`} className="hover:text-foreground">
                {agent.name}
              </Link>
            </>
          }
          title="Edit Agent"
          description="Adjust relationship details and portal settings"
          backHref={`/admin/agents/${agent.id}`}
        />

        <form onSubmit={handleSubmit}>
          <ResourceFormLayout
            left={
              <div className="space-y-6">
                <AgentInternetScrub onApply={applyScrubResult} urlRequired={false} />
                <AgentForm form={form} setForm={setForm} agencies={agencies} agentId={agent.id} />
              </div>
            }
            right={
              <ResourceFormSidebar
                actions={
                  <>
                    <Button type="submit" className="w-full" disabled={updateAgent.isPending}>
                      {updateAgent.isPending ? "Saving..." : "Save Changes"}
                    </Button>
                    <Button type="button" variant="outline" className="w-full" asChild>
                      <Link href={`/admin/agents/${agent.id}`}>Cancel</Link>
                    </Button>
                  </>
                }
                tips={AGENT_TIPS}
              />
            }
          />
        </form>
      </div>
    </AdminShell>
  );
}
