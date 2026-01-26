"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AdminShell } from "@/components/layout/admin-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { ResourceFormLayout } from "@/components/shared/resource-form-layout";
import { ResourceFormSidebar } from "@/components/shared/resource-form-sidebar";
import { AgentForm, type AgentFormValues } from "@/components/partners/agent-form";
import { AgentInternetScrub } from "@/components/partners/agent-internet-scrub";
import { useAgencies } from "@/hooks/use-agencies";
import { useCreateAgent } from "@/hooks/use-agents";
import { mockAdminUser } from "@/lib/constants/mock-users";
import { toast } from "sonner";
import type { AgentScrubResult } from "@/types/agent-scrub";

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
  notes: "",
};

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
      notes: normalize(form.notes),
      avatar_url: form.avatarUrl ?? null,
      brand_logo_url: normalize(form.brandLogoUrl ?? ""),
      agency_address: normalize(buildAgencyAddress(form) ?? ""),
      agency_website: normalizeWebsite(form.agencyWebsite),
    };

    console.log("Creating agent", payload);

    try {
      const agent = await createAgent.mutateAsync(payload);
      toast.success("Agent created");
      router.push(`/admin/partners/agents/${agent.id}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create agent";
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
              <Link href="/admin/partners" className="hover:text-foreground">
                Partners
              </Link>
              <span className="text-muted-foreground">/</span>
              <Link href="/admin/partners?tab=agents" className="hover:text-foreground">
                Agents
              </Link>
            </>
          }
          title="Add Agent"
          description="Invite referring agents and control portal access"
          backHref="/admin/partners?tab=agents"
        />

        <form onSubmit={handleSubmit}>
          <ResourceFormLayout
            left={
              <div className="space-y-6">
                <AgentInternetScrub onApply={applyScrubResult} />
                <AgentForm form={form} setForm={setForm} agencies={agencies} />
              </div>
            }
            right={
              <ResourceFormSidebar
                actions={
                  <>
                    <Button type="submit" className="w-full" disabled={createAgent.isPending}>
                      {createAgent.isPending ? "Saving..." : "Create Agent"}
                    </Button>
                    <Button type="button" variant="outline" className="w-full" asChild>
                      <Link href="/admin/partners?tab=agents">Cancel</Link>
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
