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
import { toast } from "sonner";
import { toSlugIdSegment } from "@/lib/routing/slug-id";
import type { AgentScrubResult } from "@/types/agent-scrub";
import {
  mergeField,
  normalize,
  normalizeWebsite,
  parseScrubbedAddress,
  resolveLogoForSubmit,
} from "../../_shared/form-utils";

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


export default function NewAgencyPage() {
  const router = useRouter();
  const createAgency = useCreateAgency();
  const [form, setForm] = useState<AgencyFormValues>(emptyForm);

  const applyScrubResult = (result: AgentScrubResult) => {
    const agencyName = result.agencyName ?? result.name;
    const website = normalizeWebsite(result.url ?? result.domain ?? null);
    const parsedAddress = parseScrubbedAddress(result.agencyAddress);
    const resolvedLogoUrl = resolveLogoForSubmit(result.logoUrl, result.domain ?? website ?? null) ?? null;

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
          router.push(`/agencies/${toSlugIdSegment(agency.name, agency.id)}`);
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
                    <Link href="/agencies">Cancel</Link>
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
