"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { PageHeader } from "@/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ResourceFormLayout } from "@/components/shared/resource-form-layout";
import { ResourceFormSidebar } from "@/components/shared/resource-form-sidebar";
import { AgencyForm, type AgencyFormValues } from "@/components/partners/agency-form";
import { AgentInternetScrub } from "@/components/partners/agent-internet-scrub";
import { useAgencyById, useUpdateAgency } from "@/hooks/use-agencies";
import { useAgents, useUpdateAgent } from "@/hooks/use-agents";
import { useQueryClient } from "@tanstack/react-query";
import { isAgenciesQueryKey, isAgentsQueryKey } from "@inspectos/shared/query";
import { toast } from "sonner";
import type { AgentScrubResult } from "@/types/agent-scrub";
import { parseSlugIdSegment, toSlugIdSegment } from "@/lib/routing/slug-id";
import {
  mergeField,
  normalize,
  normalizeWebsite,
  parseScrubbedAddress,
  resolveLogoForSubmit,
} from "../../_shared/form-utils";

type Params = { id: string };

const toFormValues = (agency: ReturnType<typeof useAgencyById>["data"]) => {
  if (!agency) {
    return {
      name: "",
      logoUrl: "",
      status: "active" as const,
      licenseNumber: "",
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
  const { id: agencyRouteId } = params as Params;
  const agencyId = parseSlugIdSegment(agencyRouteId);
  const router = useRouter();
  const { data: agency, isLoading } = useAgencyById(agencyId);
  const updateAgency = useUpdateAgency();
  const updateAgent = useUpdateAgent();
  const queryClient = useQueryClient();
  const agentsQuery = useAgents();
  const agents = useMemo(() => agentsQuery.data ?? [], [agentsQuery.data]);
  const isLoadingAgents = agentsQuery.isLoading;
  const [form, setForm] = useState<AgencyFormValues>(toFormValues(null));
  const [hasInitialized, setHasInitialized] = useState(false);
  const [linkedAgentIds, setLinkedAgentIds] = useState<string[]>([]);
  const [hasInitializedAgents, setHasInitializedAgents] = useState(false);
  const isSaving = updateAgency.isPending || updateAgent.isPending;
  const selectableAgents = agents.filter((agent) => !agent.agency_id || agent.agency_id === agency?.id);

  const applyScrubResult = (result: AgentScrubResult) => {
    const agencyName = result.agencyName ?? result.name;
    const website = normalizeWebsite(result.url ?? result.domain ?? null);
    const parsedAddress = parseScrubbedAddress(result.agencyAddress);
    const resolvedLogoUrl = resolveLogoForSubmit(result.logoUrl, result.domain ?? website ?? null) ?? null;

    setForm((prev) => {
      const base = prev;
      return {
        ...base,
        name: mergeField(agencyName, base.name),
        logoUrl: mergeField(resolvedLogoUrl, base.logoUrl),
        phone: mergeField(result.phone, base.phone),
        website: mergeField(website ?? null, base.website),
        addressLine1: mergeField(parsedAddress?.addressLine1, base.addressLine1),
        addressLine2: mergeField(parsedAddress?.addressLine2, base.addressLine2),
        city: mergeField(parsedAddress?.city, base.city),
        state: mergeField(parsedAddress?.state, base.state),
        zipCode: mergeField(parsedAddress?.zipCode, base.zipCode),
      };
    });

    toast.success("Agency details applied", {
      description: "Scrubbed profile data copied into this form.",
    });
  };

  useEffect(() => {
    if (agency && !hasInitialized) {
      setForm(toFormValues(agency));
      setHasInitialized(true);
    }
  }, [agency, hasInitialized]);

  useEffect(() => {
    if (!agency || hasInitializedAgents || isLoadingAgents) return;
    const linked = agents.filter((agent) => agent.agency_id === agency.id).map((agent) => agent.id);
    setLinkedAgentIds(linked);
    setHasInitializedAgents(true);
  }, [agency, agents, hasInitializedAgents, isLoadingAgents]);

  const toggleAgentLink = (agentId: string, checked: boolean) => {
    setLinkedAgentIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(agentId);
      } else {
        next.delete(agentId);
      }
      return Array.from(next);
    });
  };

  if (isLoading) {
    return (
      <div className="py-12 text-center text-muted-foreground">Loading agency...</div>
    );
  }

  if (!agency) {
    return (
      <PageHeader
        title="Agency Not Found"
        description="We couldn't find that agency."
      />
    );
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.name.trim()) {
      toast.error("Agency name is required");
      return;
    }

    try {
      await updateAgency.mutateAsync({
        id: agency.id,
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
      });

      const selected = new Set(linkedAgentIds);
      const currentlyLinked = agents.filter((agent) => agent.agency_id === agency.id).map((agent) => agent.id);
      const toLink = linkedAgentIds.filter((id) => !currentlyLinked.includes(id));
      const toUnlink = currentlyLinked.filter((id) => !selected.has(id));

      if (toLink.length > 0 || toUnlink.length > 0) {
        await Promise.all([
          ...toLink.map((id) => updateAgent.mutateAsync({ id, agency_id: agency.id, agency_name: agency.name })),
          ...toUnlink.map((id) => updateAgent.mutateAsync({ id, agency_id: null, agency_name: null })),
        ]);
      }

      queryClient.invalidateQueries({
        predicate: (query) => {
          return isAgenciesQueryKey(query.queryKey) || isAgentsQueryKey(query.queryKey);
        },
      });

      toast.success("Agency updated");
      router.push(`/agencies/${toSlugIdSegment(agency.name, agency.id)}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update agency";
      toast.error(message);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Agency"
        description="Update contact, address, or notes"
      />

      <form onSubmit={handleSubmit}>
        <ResourceFormLayout
          left={
            <div className="space-y-6">
              <AgentInternetScrub variant="agency" onApply={applyScrubResult} urlRequired={false} />
              <AgencyForm form={form} setForm={setForm} />
              <Card>
                <CardHeader>
                  <CardTitle>Linked Agents</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Select which agents should be linked to this agency. Linked agents will be reassigned to {agency.name}.
                  </p>
                  {selectableAgents.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No agents found.</p>
                  ) : (
                    <div className="space-y-2">
                      {selectableAgents.map((agent) => {
                        const checked = linkedAgentIds.includes(agent.id);
                        return (
                          <label key={agent.id} className="flex items-start gap-3 rounded-md border p-3">
                            <Checkbox checked={checked} onCheckedChange={(value) => toggleAgentLink(agent.id, value === true)} />
                            <div className="flex-1 space-y-1">
                              <p className="text-sm font-medium">{agent.name}</p>
                              <p className="text-xs text-muted-foreground">{agent.email ?? agent.phone ?? "No contact on file."}</p>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          }
          right={
            <ResourceFormSidebar
              actions={
                <>
                  <Button type="submit" className="w-full" disabled={isSaving}>
                    {isSaving ? "Saving..." : "Save Changes"}
                  </Button>
                  <Button type="button" variant="outline" className="w-full" asChild>
                    <Link href={`/agencies/${toSlugIdSegment(agency.name, agency.id)}`}>Cancel</Link>
                  </Button>
                </>
              }
              tips={AGENCY_TIPS}
            />
          }
        />
      </form>
    </div>
  );
}
