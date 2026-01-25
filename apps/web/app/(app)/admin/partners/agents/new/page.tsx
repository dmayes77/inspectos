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
import { useAgencies } from "@/hooks/use-agencies";
import { useCreateAgent } from "@/hooks/use-agents";
import { mockAdminUser } from "@/lib/constants/mock-users";
import { toast } from "sonner";

const DEFAULT_TENANT_SLUG = "demo";
const AGENT_TIPS = [
  "Assign the agent to an agency so referral payments reconcile quickly.",
  "Preferred formats keep delivery expectations aligned with their workflow.",
  "Notification toggles control how much noise they receive during inspections.",
];

const emptyForm: AgentFormValues = {
  name: "",
  avatarUrl: null,
  agencyId: null,
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

export default function NewAgentPage() {
  const router = useRouter();
  const { data: agencies = [] } = useAgencies();
  const createAgent = useCreateAgent();
  const [form, setForm] = useState<AgentFormValues>(emptyForm);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.name.trim()) {
      toast.error("Agent name is required");
      return;
    }

    createAgent.mutate(
      {
        tenant_slug: DEFAULT_TENANT_SLUG,
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
        onSuccess: (agent) => {
          toast.success("Agent created");
          router.push(`/admin/partners/agents/${agent.id}`);
        },
        onError: (error) => {
          const message = error instanceof Error ? error.message : "Failed to create agent";
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
            </>
          }
          title="Add Agent"
          description="Invite referring agents and control portal access"
          backHref="/admin/partners/agents"
        />

        <form onSubmit={handleSubmit}>
          <ResourceFormLayout
            left={<AgentForm form={form} setForm={setForm} agencies={agencies} />}
            right={
              <ResourceFormSidebar
                actions={
                  <>
                    <Button type="submit" className="w-full" disabled={createAgent.isPending}>
                      {createAgent.isPending ? "Saving..." : "Create Agent"}
                    </Button>
                    <Button type="button" variant="outline" className="w-full" asChild>
                      <Link href="/admin/partners/agents">Cancel</Link>
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
