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
import { useAgentById, useUpdateAgent } from "@/hooks/use-agents";
import { useAgencies } from "@/hooks/use-agencies";
import { mockAdminUser } from "@/lib/constants/mock-users";
import { toast } from "sonner";
import type { Agent } from "@/lib/data/agents";

type Params = { id: string };

const normalize = (value: string) => {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const toFormValues = (agent?: Agent | null): AgentFormValues => ({
  name: agent?.name ?? "",
  avatarUrl: agent?.avatar_url ?? null,
  agencyId: agent?.agency_id ?? null,
  status: agent?.status ?? "active",
  email: agent?.email ?? "",
  phone: agent?.phone ?? "",
  licenseNumber: agent?.license_number ?? "",
  preferredReportFormat: agent?.preferred_report_format ?? "pdf",
  notifyOnSchedule: agent?.notify_on_schedule ?? true,
  notifyOnComplete: agent?.notify_on_complete ?? true,
  notifyOnReport: agent?.notify_on_report ?? true,
  notes: agent?.notes ?? "",
});

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
              <Link href="/admin/partners" className="hover:text-foreground">
                Partners
              </Link>
              <span className="text-muted-foreground">/</span>
              <Link href="/admin/partners/agents" className="hover:text-foreground">
                Agents
              </Link>
            </>
          }
          title="Agent Not Found"
          description="We couldn't locate that agent record."
          backHref="/admin/partners/agents"
        />
      </AdminShell>
    );
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.name.trim()) {
      toast.error("Agent name is required");
      return;
    }

    updateAgent.mutate(
      {
        id: agent.id,
        agency_id: form.agencyId,
        name: form.name.trim(),
        status: form.status,
        email: normalize(form.email),
        phone: normalize(form.phone),
        license_number: normalize(form.licenseNumber),
        preferred_report_format: form.preferredReportFormat,
        notify_on_schedule: form.notifyOnSchedule,
        notify_on_complete: form.notifyOnComplete,
        notify_on_report: form.notifyOnReport,
        notes: normalize(form.notes),
        avatar_url: form.avatarUrl ?? null,
      },
      {
        onSuccess: () => {
          toast.success("Agent updated");
          router.push(`/admin/partners/agents/${agent.id}`);
        },
        onError: (error) => {
          const message = error instanceof Error ? error.message : "Failed to update agent";
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
              <Link href="/admin/partners/agents" className="hover:text-foreground">
                Agents
              </Link>
              <span className="text-muted-foreground">/</span>
              <Link href={`/admin/partners/agents/${agent.id}`} className="hover:text-foreground">
                {agent.name}
              </Link>
            </>
          }
          title="Edit Agent"
          description="Adjust relationship details and portal settings"
          backHref={`/admin/partners/agents/${agent.id}`}
        />

        <form onSubmit={handleSubmit}>
          <ResourceFormLayout
            left={<AgentForm form={form} setForm={setForm} agencies={agencies} agentId={agent.id} />}
            right={
              <ResourceFormSidebar
                actions={
                  <>
                    <Button type="submit" className="w-full" disabled={updateAgent.isPending}>
                      {updateAgent.isPending ? "Saving..." : "Save Changes"}
                    </Button>
                    <Button type="button" variant="outline" className="w-full" asChild>
                      <Link href={`/admin/partners/agents/${agent.id}`}>Cancel</Link>
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
