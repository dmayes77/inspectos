"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AdminShell } from "@/components/layout/admin-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { ResourceFormLayout } from "@/components/shared/resource-form-layout";
import { ResourceFormSidebar } from "@/components/shared/resource-form-sidebar";
import { AgencyForm, type AgencyFormValues } from "@/components/partners/agency-form";
import { AgencyBrandSearch } from "@/components/partners/agency-brand-search";
import { useCreateAgency } from "@/hooks/use-agencies";
import { mockAdminUser } from "@/lib/constants/mock-users";
import { logoDevUrl } from "@/lib/utils/logos";
import { toast } from "sonner";
import type { AgencyLookupResult } from "@/types/agency-lookup";

const DEFAULT_TENANT_SLUG = "demo";
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
  email: "",
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

export default function NewAgencyPage() {
  const router = useRouter();
  const createAgency = useCreateAgency();
  const [form, setForm] = useState<AgencyFormValues>(emptyForm);

  const applyLookupResult = (result: AgencyLookupResult) => {
    const website = result.website ?? (result.domain ? `https://${result.domain}` : null);
    const resolvedLogoUrl = result.logoUrl ?? logoDevUrl(result.domain ?? website ?? null, { size: 96 }) ?? null;
    const pick = (next?: string | null, current?: string) => next ?? current ?? "";

    setForm((prev) => ({
      ...prev,
      name: pick(result.name, prev.name),
      logoUrl: pick(resolvedLogoUrl, prev.logoUrl),
      email: pick(result.email, prev.email),
      phone: pick(result.phone, prev.phone),
      website: pick(website, prev.website),
      addressLine1: pick(result.addressLine1, prev.addressLine1),
      addressLine2: pick(result.addressLine2, prev.addressLine2),
      city: pick(result.city, prev.city),
      state: pick(result.state, prev.state),
      zipCode: pick(result.postalCode, prev.zipCode),
    }));

    toast.success("Agency details applied", {
      description: "We copied the lookup info into your form. Review before saving.",
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
        tenant_slug: DEFAULT_TENANT_SLUG,
        name: form.name.trim(),
        status: form.status,
        logo_url: normalize(form.logoUrl),
        license_number: normalize(form.licenseNumber),
        email: normalize(form.email),
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
          router.push(`/admin/partners/agencies/${agency.id}`);
        },
        onError: (error) => {
          const message = error instanceof Error ? error.message : "Failed to create agency";
          toast.error(message);
        },
      },
    );
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
              <Link href="/admin/partners?tab=agencies" className="hover:text-foreground">
                Agencies
              </Link>
            </>
          }
          title="Add Agency"
          description="Capture brokerages and referral partners"
          backHref="/admin/partners?tab=agencies"
        />

        <div className="space-y-6">
          <AgencyBrandSearch onApply={applyLookupResult} />

          <form onSubmit={handleSubmit}>
            <ResourceFormLayout
              left={<AgencyForm form={form} setForm={setForm} />}
              right={
                <ResourceFormSidebar
                  actions={
                    <>
                      <Button type="submit" className="w-full" disabled={createAgency.isPending}>
                        {createAgency.isPending ? "Saving..." : "Create Agency"}
                      </Button>
                      <Button type="button" variant="outline" className="w-full" asChild>
                        <Link href="/admin/partners?tab=agencies">Cancel</Link>
                      </Button>
                    </>
                  }
                  tips={AGENCY_TIPS}
                />
              }
            />
          </form>
        </div>
      </div>
    </AdminShell>
  );
}
