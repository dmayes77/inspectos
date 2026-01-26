"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AdminShell } from "@/components/layout/admin-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { ResourceFormLayout } from "@/components/shared/resource-form-layout";
import { ResourceFormSidebar } from "@/components/shared/resource-form-sidebar";
import { AgencyForm, type AgencyFormValues } from "@/components/partners/agency-form";
import { AgencyBrandSearch } from "@/components/partners/agency-brand-search";
import { useAgencyById, useUpdateAgency } from "@/hooks/use-agencies";
import { mockAdminUser } from "@/lib/constants/mock-users";
import { logoDevUrl } from "@/lib/utils/logos";
import { toast } from "sonner";
import type { AgencyLookupResult } from "@/types/agency-lookup";

type Params = { id: string };

const normalize = (value: string) => {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const toFormValues = (agency: ReturnType<typeof useAgencyById>["data"]) => {
  if (!agency) {
    return {
      name: "",
      logoUrl: "",
      status: "active" as const,
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
    } satisfies AgencyFormValues;
  }

  return {
    name: agency.name ?? "",
    logoUrl: agency.logo_url ?? "",
    status: agency.status,
    licenseNumber: agency.license_number ?? "",
    email: agency.email ?? "",
    phone: agency.phone ?? "",
    website: agency.website ?? "",
    addressLine1: agency.address_line1 ?? "",
    addressLine2: agency.address_line2 ?? "",
    city: agency.city ?? "",
    state: agency.state ?? "",
    zipCode: agency.zip_code ?? "",
    notes: agency.notes ?? "",
  } satisfies AgencyFormValues;
};

const AGENCY_TIPS = [
  "Update the main contact when leadership changes to keep comms clean.",
  "Inactive agencies stay in reporting but are hidden from quick-pick menus.",
  "Capture renewal or referral agreement details in notes for quick recall.",
];

export default function EditAgencyPage() {
  const params = useParams();
  const { id: agencyId } = params as Params;
  const router = useRouter();
  const { data: agency, isLoading } = useAgencyById(agencyId);
  const updateAgency = useUpdateAgency();
  const [form, setForm] = useState<AgencyFormValues>(toFormValues(null));

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
      description: "Lookup data has been copied into this form.",
    });
  };

  useEffect(() => {
    if (agency) {
      setForm(toFormValues(agency));
    }
  }, [agency]);

  if (isLoading) {
    return (
      <AdminShell user={mockAdminUser}>
        <div className="py-12 text-center text-muted-foreground">Loading agency...</div>
      </AdminShell>
    );
  }

  if (!agency) {
    return (
      <AdminShell user={mockAdminUser}>
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
          title="Agency Not Found"
          description="We couldn't find that agency."
          backHref="/admin/partners?tab=agencies"
        />
      </AdminShell>
    );
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.name.trim()) {
      toast.error("Agency name is required");
      return;
    }

    updateAgency.mutate(
      {
        id: agency.id,
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
        onSuccess: () => {
          toast.success("Agency updated");
          router.push(`/admin/partners/agencies/${agency.id}`);
        },
        onError: (error) => {
          const message = error instanceof Error ? error.message : "Failed to update agency";
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
              <span className="text-muted-foreground">/</span>
              <Link href={`/admin/partners/agencies/${agency.id}`} className="hover:text-foreground">
                {agency.name}
              </Link>
            </>
          }
          title="Edit Agency"
          description="Update contact, address, or notes"
          backHref={`/admin/partners/agencies/${agency.id}`}
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
                      <Button type="submit" className="w-full" disabled={updateAgency.isPending}>
                        {updateAgency.isPending ? "Saving..." : "Save Changes"}
                      </Button>
                      <Button type="button" variant="outline" className="w-full" asChild>
                        <Link href={`/admin/partners/agencies/${agency.id}`}>Cancel</Link>
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
