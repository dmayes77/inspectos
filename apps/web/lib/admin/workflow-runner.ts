import { supabaseAdmin } from "@/lib/supabase/server";

type WorkflowAction = {
  type?: string;
  config?: Record<string, unknown>;
};

type WorkflowRecord = {
  id: string;
  name: string;
  trigger_tag_id: string | null;
  actions: WorkflowAction[] | null;
  delay_minutes: number;
  conditions?: Record<string, unknown> | null;
};

type RunContext = {
  tenantId: string;
  scope: string;
  entityId: string;
  triggerType: "tag_added" | "tag_removed" | "status_changed";
  tagId?: string;
  status?: string;
  assignedTagIds?: string[];
};

type LeadRecord = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  source: string | null;
  notes: string | null;
  client_id: string | null;
};

const findOrCreateClientForLead = async (tenantId: string, lead: LeadRecord) => {
  if (lead.client_id) return lead.client_id;

  if (lead.email) {
    const { data: existingByEmail } = await supabaseAdmin
      .from("clients")
      .select("id")
      .eq("tenant_id", tenantId)
      .ilike("email", lead.email)
      .maybeSingle();
    if (existingByEmail?.id) {
      return existingByEmail.id;
    }
  }

  const { data: existingByName } = await supabaseAdmin
    .from("clients")
    .select("id")
    .eq("tenant_id", tenantId)
    .ilike("name", lead.name)
    .maybeSingle();
  if (existingByName?.id) {
    return existingByName.id;
  }

  const { data: createdClient, error: clientError } = await supabaseAdmin
    .from("clients")
    .insert({
      tenant_id: tenantId,
      name: lead.name,
      email: lead.email ?? null,
      phone: lead.phone ?? null,
      notes: lead.notes ?? null,
      company: null,
      inspections_count: 0,
      total_spent: 0,
      last_inspection_date: null,
    })
    .select("id")
    .single();

  if (clientError || !createdClient) {
    throw new Error(clientError?.message ?? "Failed to create client.");
  }

  return createdClient.id;
};

const executeAction = async (context: RunContext, action: WorkflowAction) => {
  const type = action.type;
  const config = action.config ?? {};

  if (type === "add_tag" && context.scope) {
    const tagId = config.tagId as string | undefined;
    if (!tagId) return { type, status: "skipped", reason: "missing_tag" };
    await supabaseAdmin.from("tag_assignments").upsert(
      {
        tenant_id: context.tenantId,
        scope: context.scope,
        entity_id: context.entityId,
        tag_id: tagId,
      },
      { onConflict: "tenant_id,scope,entity_id,tag_id" }
    );
    return { type, status: "ok" };
  }

  if (type === "remove_tag" && context.scope) {
    const tagId = config.tagId as string | undefined;
    if (!tagId) return { type, status: "skipped", reason: "missing_tag" };
    await supabaseAdmin
      .from("tag_assignments")
      .delete()
      .eq("tenant_id", context.tenantId)
      .eq("scope", context.scope)
      .eq("entity_id", context.entityId)
      .eq("tag_id", tagId);
    return { type, status: "ok" };
  }

  if (type === "send_email") {
    const templateId = config.templateId as string | undefined;
    return { type, status: "queued", templateId: templateId ?? null };
  }

  if (type === "notify") {
    const message = config.message as string | undefined;
    return { type, status: "noted", message: message ?? "" };
  }

  if (type === "wait") {
    const minutes = Number(config.minutes ?? 0);
    return { type, status: "wait", minutes };
  }

  if (type === "convert_lead_to_client" && context.scope === "lead") {
    const deleteLead = Boolean((config as { deleteLead?: boolean }).deleteLead);
    const { data: lead } = await supabaseAdmin
      .from("leads")
      .select("id, name, email, phone, source, notes, client_id")
      .eq("tenant_id", context.tenantId)
      .eq("id", context.entityId)
      .maybeSingle();

    if (!lead) return { type, status: "skipped", reason: "lead_not_found" };

    const clientId = await findOrCreateClientForLead(context.tenantId, lead);
    await supabaseAdmin
      .from("leads")
      .update({ stage: "won", client_id: clientId })
      .eq("tenant_id", context.tenantId)
      .eq("id", context.entityId);

    if (deleteLead) {
      await supabaseAdmin.from("leads").delete().eq("tenant_id", context.tenantId).eq("id", context.entityId);
    }

    return { type, status: "converted", clientId };
  }

  return { type: type ?? "unknown", status: "skipped" };
};

const getAssignedTagIds = async (tenantId: string, scope: string, entityId: string) => {
  const { data } = await supabaseAdmin
    .from("tag_assignments")
    .select("tag_id")
    .eq("tenant_id", tenantId)
    .eq("scope", scope)
    .eq("entity_id", entityId);
  return (data ?? []).map((row) => row.tag_id);
};

const shouldRunWorkflow = async (workflow: WorkflowRecord, context: RunContext) => {
  const conditions = (workflow.conditions ?? {}) as {
    includeTagIds?: string[];
    excludeTagIds?: string[];
    statusEquals?: string;
    statusIn?: string[];
  };

  if (conditions.statusEquals && context.status && conditions.statusEquals !== context.status) {
    return false;
  }

  if (conditions.statusIn && context.status && !conditions.statusIn.includes(context.status)) {
    return false;
  }

  if (conditions.includeTagIds?.length || conditions.excludeTagIds?.length) {
    const assigned = context.assignedTagIds ?? (await getAssignedTagIds(context.tenantId, context.scope, context.entityId));
    const assignedSet = new Set(assigned);

    if (conditions.includeTagIds?.length) {
      const hasAll = conditions.includeTagIds.every((id) => assignedSet.has(id));
      if (!hasAll) return false;
    }

    if (conditions.excludeTagIds?.length) {
      const hasExcluded = conditions.excludeTagIds.some((id) => assignedSet.has(id));
      if (hasExcluded) return false;
    }
  }

  return true;
};

const runWorkflow = async (workflow: WorkflowRecord, context: RunContext) => {
  const shouldRun = await shouldRunWorkflow(workflow, context);
  if (!shouldRun) {
    return;
  }
  const { data: run } = await supabaseAdmin
    .from("workflow_runs")
    .insert({
      tenant_id: context.tenantId,
      workflow_id: workflow.id,
      scope: context.scope,
      entity_id: context.entityId,
      status: workflow.delay_minutes > 0 ? "pending" : "running",
      result:
        workflow.delay_minutes > 0
          ? { scheduled_for: new Date(Date.now() + workflow.delay_minutes * 60_000).toISOString(), nextIndex: 0, actions: [] }
          : { actions: [] },
    })
    .select("id")
    .single();

  if (!run?.id) {
    return;
  }

  if (workflow.delay_minutes > 0) {
    return;
  }

  await executeWorkflowFromIndex(workflow, context, run.id, 0, []);
};

const executeWorkflowFromIndex = async (
  workflow: WorkflowRecord,
  context: RunContext,
  runId: string,
  startIndex: number,
  existingResults: Array<Record<string, unknown>>
) => {
  const actions = Array.isArray(workflow.actions) ? workflow.actions : [];
  const results: Array<Record<string, unknown>> = [...existingResults];
  for (let index = startIndex; index < actions.length; index += 1) {
    const action = actions[index];
    const result = await executeAction(context, action);
    results.push(result);
    if (result.status === "wait") {
      await supabaseAdmin
        .from("workflow_runs")
        .update({
          status: "pending",
          result: {
            actions: results,
            nextIndex: index + 1,
            scheduled_for: new Date(Date.now() + (result.minutes as number) * 60_000).toISOString(),
          },
        })
        .eq("tenant_id", context.tenantId)
        .eq("id", runId);
      return;
    }
  }

  await supabaseAdmin
    .from("workflow_runs")
    .update({
      status: "completed",
      result: { actions: results },
      completed_at: new Date().toISOString(),
    })
    .eq("tenant_id", context.tenantId)
    .eq("id", runId);
};

export const processPendingWorkflowRuns = async (tenantId: string) => {
  const { data: runs } = await supabaseAdmin
    .from("workflow_runs")
    .select("id, workflow_id, scope, entity_id, result")
    .eq("tenant_id", tenantId)
    .eq("status", "pending");

  if (!runs || runs.length === 0) return;

  const workflowIds = Array.from(new Set(runs.map((run) => run.workflow_id)));
  const { data: workflows } = await supabaseAdmin
    .from("workflows")
    .select("id, name, trigger_tag_id, actions, delay_minutes, conditions")
    .eq("tenant_id", tenantId)
    .in("id", workflowIds);

  const workflowMap = new Map((workflows ?? []).map((workflow) => [workflow.id, workflow as WorkflowRecord]));

  const now = Date.now();
  for (const run of runs) {
    const result = (run.result ?? {}) as { scheduled_for?: string; nextIndex?: number; actions?: Array<Record<string, unknown>> };
    if (!result.scheduled_for) continue;
    const scheduledTime = new Date(result.scheduled_for).getTime();
    if (Number.isNaN(scheduledTime) || scheduledTime > now) continue;

    const workflow = workflowMap.get(run.workflow_id);
    if (!workflow) continue;

    await supabaseAdmin
      .from("workflow_runs")
      .update({ status: "running" })
      .eq("tenant_id", tenantId)
      .eq("id", run.id);

    await executeWorkflowFromIndex(
      workflow,
      {
        tenantId,
        scope: run.scope,
        entityId: run.entity_id,
        triggerType: "status_changed",
      },
      run.id,
      result.nextIndex ?? 0,
      result.actions ?? []
    );
  }
};

export const runWorkflowsForTagChange = async (context: RunContext) => {
  const { tenantId, scope, triggerType, tagId } = context;
  if (!tagId) return;
  const { data: workflows } = await supabaseAdmin
    .from("workflows")
    .select("id, name, trigger_tag_id, actions, delay_minutes, conditions")
    .eq("tenant_id", tenantId)
    .eq("trigger_scope", scope)
    .eq("trigger_type", triggerType)
    .eq("is_active", true);

  const matches = (workflows ?? []).filter((workflow) => !workflow.trigger_tag_id || workflow.trigger_tag_id === tagId);
  const assignedTagIds = await getAssignedTagIds(tenantId, scope, context.entityId);
  for (const workflow of matches) {
    await runWorkflow(workflow as WorkflowRecord, { ...context, assignedTagIds });
  }
};

export const runWorkflowsForStatusChange = async (context: RunContext) => {
  const { tenantId, scope, triggerType, status } = context;
  if (!status) return;
  const { data: workflows } = await supabaseAdmin
    .from("workflows")
    .select("id, name, trigger_tag_id, actions, delay_minutes, conditions")
    .eq("tenant_id", tenantId)
    .eq("trigger_scope", scope)
    .eq("trigger_type", triggerType)
    .eq("is_active", true);

  const assignedTagIds = await getAssignedTagIds(tenantId, scope, context.entityId);
  for (const workflow of workflows ?? []) {
    await runWorkflow(workflow as WorkflowRecord, { ...context, assignedTagIds });
  }
};
