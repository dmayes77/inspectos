"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/layout/page-header";
import { Button } from "@/components/ui/button";
import { ResourceFormLayout } from "@/components/shared/resource-form-layout";
import { ResourceFormSidebar } from "@/components/shared/resource-form-sidebar";
import { AgencyForm, type AgencyFormValues } from "@/components/partners/agency-form";
import { AgentInternetScrub } from "@/components/partners/agent-internet-scrub";
import { useCreateAgency } from "@/hooks/use-agencies";
import { logoDevUrl } from "@inspectos/shared/utils/logos";
import { toast } from "sonner";
import type { AgentScrubResult } from "@/types/agent-scrub";

const AGENCY_TIPS = [
  "Capture the main office contact so your team always knows how to reach them.",
  "Status helps SDRs know whether to keep nurturing the relationship.",
  "Add notes with onboarding details, preferred incentives, or SLAs.",
];

const emptyForm: AgencyFormValues = {
  name: "",
  logoUrl: "",
  status: "active",
  licenseNumber: "",
  phone: "",
  website: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  zipCode: "",
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

const resolveLogoForSubmit = (logoUrl?: string | null, website?: string | null) => {
  const normalizedLogo = normalize(logoUrl ?? "");
  if (normalizedLogo) return normalizedLogo;
  return logoDevUrl(website ?? null, { size: 96 });
};

const mergeField = (next?: string | null, current?: string) => {
  const trimmed = next?.trim();
  if (trimmed && trimmed.length > 0) {
    return trimmed;
  }
  return current ?? "";
};

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

export default function NewAgencyPage() {
  const router = useRouter();
  const createAgency = useCreateAgency();
  const [form, setForm] = useState<AgencyFormValues>(emptyForm);

  const applyScrubResult = (result: AgentScrubResult) => {
    const agencyName = result.agencyName ?? result.name;
    const website = normalizeWebsite(result.url ?? result.domain ?? null);
    const parsedAddress = parseScrubbedAddress(result.agencyAddress);
    const resolvedLogoUrl = result.logoUrl ?? logoDevUrl(result.domain ?? website ?? null, { size: 96 }) ?? null;

    setForm((prev) => ({
      ...prev,
      name: mergeField(agencyName, prev.name),
      logoUrl: mergeField(resolvedLogoUrl, prev.logoUrl),
      phone: mergeField(result.phone, prev.phone),
      website: mergeField(website ?? null, prev.website),
      addressLine1: mergeField(parsedAddress?.addressLine1, prev.addressLine1),
      addressLine2: mergeField(parsedAddress?.addressLine2, prev.addressLine2),
      city: mergeField(parsedAddress?.city, prev.city),
      state: mergeField(parsedAddress?.state, prev.state),
      zipCode: mergeField(parsedAddress?.zipCode, prev.zipCode),
    }));

    toast.success("Agency details applied", {
      description: "Scrubbed profile data copied into this form.",
    });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.name.trim()) {
      toast.error("Agency name is required");
      return;
    }

    createAgency.mutate(
      {
        name: form.name.trim(),
        status: form.status,
        logo_url: resolveLogoForSubmit(form.logoUrl, form.website),
        license_number: normalize(form.licenseNumber),
        phone: normalize(form.phone),
        website: normalize(form.website),
        address_line1: normalize(form.addressLine1),
        address_line2: normalize(form.addressLine2),
        city: normalize(form.city),
        state: normalize(form.state),
        zip_code: normalize(form.zipCode),
        notes: normalize(form.notes),
      },
      {
        onSuccess: (agency) => {
          toast.success("Agency created");
          router.push(`/agents/agencies/${agency.id}`);
        },
        onError: (error) => {
          const message = error instanceof Error ? error.message : "Failed to create agency";
          toast.error(message);
        },
      },
    );
  };

  return (
    <>
    <div className="space-y-6">
      <PageHeader
        title="Add Agency"
        description="Capture brokerages and referral partners"
      />

      <form onSubmit={handleSubmit}>
        <ResourceFormLayout
          left={
            <div className="space-y-6">
              <AgentInternetScrub variant="agency" onApply={applyScrubResult} />
              <AgencyForm form={form} setForm={setForm} />
            </div>
          }
          right={
            <ResourceFormSidebar
              actions={
                <>
                  <Button type="submit" className="w-full" disabled={createAgency.isPending}>
                    {createAgency.isPending ? "Saving..." : "Create Agency"}
                  </Button>
                  <Button type="button" variant="outline" className="w-full" asChild>
                    <Link href="/agents?tab=agencies">Cancel</Link>
                  </Button>
                </>
              }
              tips={AGENCY_TIPS}
            />
          }
        />
      </form>
    </div>
    </>
  );
}
