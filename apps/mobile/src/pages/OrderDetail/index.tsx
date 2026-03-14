import "./order-detail.css";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useHistory, useParams } from "react-router-dom";
import { IonButton, IonModal, IonSpinner, IonText, IonTextarea } from "@ionic/react";
import { Capacitor } from "@capacitor/core";
import { deriveInitialInspectionWorkflowState, formatOrderScheduleFriendly } from "@inspectos/domains/orders";
import { MobilePageLayout } from "../../components/MobilePageLayout";
import { InfoCard, SectionTitle, StatusChipRow, StickyButtonRow } from "../../components/ui";
import { fetchQuickCaptures, getOrder, transitionOrderInspectionState } from "../../services/api";
import { mobileQueryKeys } from "../../lib/query-keys";
import { buildInspectionTransitionRequest, validateInspectionTransition } from "../../lib/inspection-state-machine";
import type { InspectionTransitionCheck, InspectionTransitionTrigger, InspectionWorkflowState } from "../../../../../shared/types/inspection-state-machine";

type TransitionAction = {
  label: string;
  toState: InspectionWorkflowState;
  trigger: InspectionTransitionTrigger;
  successMessage: string;
};

type LocalBlockerState = {
  workflowState: InspectionWorkflowState;
  blockerType: string | null;
  blockerNotes: string | null;
  resolutionNotes: string | null;
  updatedAt: string;
};

const DEVICE_ID_STORAGE_KEY = "inspectos_mobile_device_id";
const ORDER_WORKFLOW_STORAGE_PREFIX = "inspectos_mobile_order_workflow";
const BLOCKER_OPTIONS = [
  "Access Issue",
  "Client Answer",
  "Utilities Off",
  "Safety Concern",
  "Missing Docs",
  "Other",
] as const;

function matchesArrivalPropertyPhoto(note: string | null | undefined, orderId: string): boolean {
  if (!note) return false;
  return note.includes("[ARRIVAL_PHOTO]") && note.includes(`order_id=${orderId}`) && note.includes("type=front_exterior");
}

function buildOrderWorkflowStorageKey(tenantSlug: string, orderId: string) {
  return `${ORDER_WORKFLOW_STORAGE_PREFIX}:${tenantSlug}:${orderId}`;
}

function readLocalBlockerState(tenantSlug: string, orderId: string): LocalBlockerState | null {
  const raw = window.localStorage.getItem(buildOrderWorkflowStorageKey(tenantSlug, orderId));
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as LocalBlockerState;
    if (!parsed || typeof parsed !== "object" || typeof parsed.workflowState !== "string") return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeLocalBlockerState(tenantSlug: string, orderId: string, value: LocalBlockerState) {
  window.localStorage.setItem(buildOrderWorkflowStorageKey(tenantSlug, orderId), JSON.stringify(value));
}

function clearLocalBlockerState(tenantSlug: string, orderId: string) {
  window.localStorage.removeItem(buildOrderWorkflowStorageKey(tenantSlug, orderId));
}

export default function OrderDetail() {
  const history = useHistory();
  const { tenantSlug, orderId } = useParams<{ tenantSlug: string; orderId: string }>();
  const [actionNote, setActionNote] = useState<string>("");
  const [workflowState, setWorkflowState] = useState<InspectionWorkflowState>("assigned");
  const [transitionBusy, setTransitionBusy] = useState(false);
  const [isNeedInfoOpen, setIsNeedInfoOpen] = useState(false);
  const [blockerType, setBlockerType] = useState<(typeof BLOCKER_OPTIONS)[number] | "">("");
  const [blockerNotes, setBlockerNotes] = useState("");
  const [isResolveBlockerOpen, setIsResolveBlockerOpen] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [activeBlocker, setActiveBlocker] = useState<LocalBlockerState | null>(null);

  const deviceId = useMemo(() => {
    const existing = window.localStorage.getItem(DEVICE_ID_STORAGE_KEY);
    if (existing) return existing;
    const generated = crypto.randomUUID();
    window.localStorage.setItem(DEVICE_ID_STORAGE_KEY, generated);
    return generated;
  }, []);

  const orderQuery = useQuery({
    queryKey: mobileQueryKeys.order(tenantSlug, orderId),
    queryFn: () => getOrder(tenantSlug, orderId),
  });
  const quickCapturesQuery = useQuery({
    queryKey: mobileQueryKeys.quickCaptures(tenantSlug),
    queryFn: () => fetchQuickCaptures(tenantSlug),
  });
  const detail = orderQuery.data ?? null;
  const loading = orderQuery.isPending;
  const error = orderQuery.error instanceof Error ? orderQuery.error.message : null;

  const order = useMemo(() => detail?.order ?? null, [detail]);
  const totalTemplateItems = detail?.progress_summary?.total_items ?? 0;
  const answeredCount = detail?.progress_summary?.answered_count ?? 0;
  const customAnsweredCount = detail?.progress_summary?.custom_answered_count ?? 0;
  const findingsCount = detail?.progress_summary?.findings_count ?? 0;
  const mediaCount = detail?.progress_summary?.media_count ?? 0;
  const hasStarted = answeredCount > 0 || customAnsweredCount > 0 || findingsCount > 0 || mediaCount > 0;
  const completionPct = totalTemplateItems > 0 ? Math.min(100, Math.round(((answeredCount + customAnsweredCount) / totalTemplateItems) * 100)) : 0;
  const hasRequiredEvidence = mediaCount > 0;
  const hasRequiredItemsCompleted = totalTemplateItems === 0 || completionPct >= 100;
  const isPendingFieldIntake = (order?.source ?? "").startsWith("mobile_field_intake:") && order?.status === "pending";
  const propertyAddress = useMemo(
    () =>
      [order?.property?.address_line1, order?.property?.address_line2, order?.property?.city, order?.property?.state, order?.property?.zip_code]
        .filter((value): value is string => Boolean(value && String(value).trim().length > 0))
        .join(", "),
    [order],
  );
  const hasMappableAddress = propertyAddress.length > 0;
  const mapEmbedUrl = hasMappableAddress ? `https://www.google.com/maps?q=${encodeURIComponent(propertyAddress)}&output=embed` : null;
  const propertyImageUrl = useMemo(() => {
    const items = quickCapturesQuery.data ?? [];
    const match = items.find((item) => matchesArrivalPropertyPhoto(item.note, orderId));
    return match?.image_url ?? null;
  }, [orderId, quickCapturesQuery.data]);
  const statusChips = [order?.status, workflowState.replace(/_/g, " "), isPendingFieldIntake ? "Awaiting Dispatch" : null].filter((chip): chip is string =>
    Boolean(chip),
  );

  const openNativeMaps = () => {
    if (!hasMappableAddress) return;

    const encodedAddress = encodeURIComponent(propertyAddress);
    const platform = Capacitor.getPlatform();

    if (platform === "ios") {
      window.location.href = `maps://?q=${encodedAddress}`;
      return;
    }

    if (platform === "android") {
      window.location.href = `geo:0,0?q=${encodedAddress}`;
      return;
    }

    window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, "_blank", "noopener,noreferrer");
  };

  useEffect(() => {
    if (!order) return;
    const derived = deriveInitialInspectionWorkflowState(order.status, hasStarted);
    const localBlockerState = readLocalBlockerState(tenantSlug, orderId);
    if (derived === "completed") {
      clearLocalBlockerState(tenantSlug, orderId);
      setActiveBlocker(null);
      setWorkflowState(derived);
      return;
    }

    if (localBlockerState) {
      setWorkflowState(localBlockerState.workflowState);
      setActiveBlocker(localBlockerState);
      return;
    }

    setActiveBlocker(null);
    setWorkflowState(derived);
  }, [order, hasStarted, orderId, tenantSlug]);

  const primaryAction = useMemo<TransitionAction | null>(() => {
    switch (workflowState) {
      case "assigned":
        return {
          label: "Mark Arrived",
          toState: "arrived",
          trigger: "ARRIVAL_CONFIRMED",
          successMessage: "Arrival confirmed.",
        };
      case "arrived":
        return {
          label: "Begin Inspection",
          toState: "in_progress",
          trigger: "INSPECTION_STARTED",
          successMessage: "Inspection started.",
        };
      case "paused":
        return {
          label: "Resume Inspection",
          toState: "in_progress",
          trigger: "INSPECTION_RESUMED",
          successMessage: "Inspection resumed.",
        };
      case "waiting_for_info":
        return {
          label: "Resolve Blocker",
          toState: "in_progress",
          trigger: "BLOCKER_CLEARED",
          successMessage: "Blocker resolved.",
        };
      case "in_progress":
        return null;
      case "uploading":
        return {
          label: "Mark Ready for Review",
          toState: "ready_for_review",
          trigger: "SYNC_COMPLETED",
          successMessage: "Inspection is ready for review.",
        };
      case "ready_for_review":
        return {
          label: "Complete Inspection",
          toState: "completed",
          trigger: "QA_APPROVED",
          successMessage: "Inspection completed.",
        };
      case "corrections_required":
        return {
          label: "Resume Corrections",
          toState: "in_progress",
          trigger: "CORRECTIONS_ACKNOWLEDGED",
          successMessage: "Corrections acknowledged.",
        };
      default:
        return null;
    }
  }, [workflowState]);

  const secondaryActions = useMemo<TransitionAction[]>(() => {
    if (workflowState === "in_progress") {
      return [
        {
          label: "Pause",
          toState: "paused",
          trigger: "INSPECTION_PAUSED",
          successMessage: "Inspection paused.",
        },
        {
          label: "Need Info",
          toState: "waiting_for_info",
          trigger: "BLOCKER_REPORTED",
          successMessage: "Marked as waiting for info.",
        },
      ];
    }
    return [];
  }, [workflowState]);
  const canOpenGuidedInspection = workflowState === "in_progress";
  const canReviewArrival =
    !isPendingFieldIntake &&
    [
      "arrived",
      "in_progress",
      "paused",
      "waiting_for_info",
      "uploading",
      "ready_for_review",
      "corrections_required",
      "completed",
    ].includes(workflowState);

  const buildChecksForTransition = (fromState: InspectionWorkflowState, toState: InspectionWorkflowState, trigger: InspectionTransitionTrigger) => {
    const checks: Partial<Record<InspectionTransitionCheck, boolean>> = {};
    const guardChecks: InspectionTransitionCheck[] = [
      "inspector_membership_verified",
      "order_assigned_to_inspector",
      "checklist_version_matches",
      "checklist_payload_present",
      "active_session_exists",
      "blocker_open",
      "required_evidence_uploaded",
      "required_items_completed",
      "reviewer_permission_verified",
      "no_open_corrections",
    ];

    guardChecks.forEach((check) => {
      switch (check) {
        case "required_evidence_uploaded":
          checks[check] = hasRequiredEvidence;
          break;
        case "required_items_completed":
          checks[check] = hasRequiredItemsCompleted;
          break;
        case "checklist_payload_present":
          checks[check] = Boolean(detail?.template);
          break;
        case "blocker_open":
          checks[check] = fromState === "waiting_for_info";
          break;
        case "active_session_exists":
          checks[check] = hasStarted || fromState === "in_progress" || fromState === "paused";
          break;
        case "no_open_corrections":
          checks[check] = workflowState !== "corrections_required";
          break;
        default:
          checks[check] = true;
      }
    });

    const guardResult = validateInspectionTransition(fromState, toState, trigger, checks);
    return { checks, guardResult };
  };

  const runTransition = async (
    action: TransitionAction,
    metadata?: Record<string, string | number | boolean | null>
  ) => {
    if (!order) return;
    if (workflowState === "arrived" && action.trigger === "INSPECTION_STARTED") {
      history.push(`/t/${tenantSlug}/order/${order.id}/arrival`);
      return;
    }

    const { checks, guardResult } = buildChecksForTransition(workflowState, action.toState, action.trigger);
    if (!guardResult.ok) {
      setActionNote(guardResult.reason);
      return;
    }

    setTransitionBusy(true);
    setActionNote("");
    try {
      const payload = buildInspectionTransitionRequest({
        deviceId,
        fromState: workflowState,
        toState: action.toState,
        trigger: action.trigger,
        checklistVersion: detail?.template?.id,
        checks,
        metadata: {
          completion_pct: completionPct,
          answered_count: answeredCount,
          findings_count: findingsCount,
          media_count: mediaCount,
          has_required_items_completed: hasRequiredItemsCompleted,
          has_required_evidence: hasRequiredEvidence,
          ...metadata,
        },
      });

      const response = await transitionOrderInspectionState(tenantSlug, order.id, payload);
      setWorkflowState(response.to_state);
      if (action.trigger === "BLOCKER_REPORTED") {
        const nextBlockerState: LocalBlockerState = {
          workflowState: response.to_state,
          blockerType: typeof metadata?.blocker_type === "string" ? metadata.blocker_type : null,
          blockerNotes: typeof metadata?.blocker_notes === "string" ? metadata.blocker_notes : null,
          resolutionNotes: null,
          updatedAt: new Date().toISOString(),
        };
        writeLocalBlockerState(tenantSlug, order.id, nextBlockerState);
        setActiveBlocker(nextBlockerState);
      } else if (action.trigger === "BLOCKER_CLEARED") {
        clearLocalBlockerState(tenantSlug, order.id);
        setActiveBlocker(null);
      }
      setActionNote(action.successMessage);
      if (action.trigger === "ARRIVAL_CONFIRMED") {
        history.push(`/t/${tenantSlug}/order/${order.id}/arrival`);
        return;
      }
    } catch (transitionError) {
      setActionNote(transitionError instanceof Error ? transitionError.message : "Transition failed");
    } finally {
      setTransitionBusy(false);
    }
  };

  const needInfoAction = secondaryActions.find((action) => action.trigger === "BLOCKER_REPORTED") ?? null;
  const resolveBlockerAction = primaryAction?.trigger === "BLOCKER_CLEARED" ? primaryAction : null;

  const submitNeedInfo = async () => {
    if (!needInfoAction || !blockerType) return;
    await runTransition(needInfoAction, {
      blocker_type: blockerType,
      blocker_notes: blockerNotes.trim() || null,
    });
    setIsNeedInfoOpen(false);
    setBlockerType("");
    setBlockerNotes("");
  };

  const submitResolveBlocker = async () => {
    if (!resolveBlockerAction) return;
    await runTransition(resolveBlockerAction, {
      blocker_resolution_notes: resolutionNotes.trim() || null,
      blocker_type: activeBlocker?.blockerType ?? null,
    });
    setIsResolveBlockerOpen(false);
    setResolutionNotes("");
  };

  return (
    <MobilePageLayout
      title={order?.order_number || "Inspection Order"}
      showBack
      defaultHref={`/t/${tenantSlug}/orders`}
      contentClassName="order-detail-content"
    >
      {loading ? <IonSpinner name="crescent" /> : null}
      {error ? (
        <IonText color="danger">
          <p>{error}</p>
        </IonText>
      ) : null}
      {!loading && !error && !order ? (
        <IonText color="medium">
          <p>Order not found.</p>
        </IonText>
      ) : null}
      {!loading && !error && order ? (
        <div className="inspector-order">
          <div className="inspector-hero">
            <StatusChipRow chips={statusChips} />

            <p className="inspector-order-address">
              {order.property?.address_line1 || "Property address unavailable"}
              {order.property?.city ? `, ${order.property.city}` : ""}
              {order.property?.state ? `, ${order.property.state}` : ""}
            </p>
          </div>

          {propertyImageUrl ? (
            <div className="inspector-property-photo-card">
              <img src={propertyImageUrl} alt={order.property?.address_line1 || "Property"} className="inspector-property-photo" />
            </div>
          ) : null}

          {mapEmbedUrl ? (
            <div className="inspector-map-block">
              <iframe
                title="Property location map"
                src={mapEmbedUrl}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="inspector-map-embed"
              />
            </div>
          ) : null}

          <SectionTitle>Inspection Details</SectionTitle>
          <div className="inspector-meta-cards">
            <InfoCard label="Scheduled" value={formatOrderScheduleFriendly(order.scheduled_date, order.scheduled_time, { includeYear: true })} tone="scheduled" />
            <button
              type="button"
              className="inspector-meta-card-button"
              onClick={() => order.client && history.push(`/t/${tenantSlug}/order/${order.id}/client`)}
              disabled={!order.client}
            >
              <InfoCard label="Client" value={order.client?.name || "Not assigned"} tone="client" />
            </button>
          </div>

          {isPendingFieldIntake ? (
            <div className="inspector-status-note inspector-secondary-actions inspector-secondary-actions--stacked">
              <IonText color="warning">
                <p>
                  Field Intake is waiting for dispatch deployment. You can edit name/address, but inspection workflow is locked until dispatch deploys this
                  order.
                </p>
              </IonText>
            </div>
          ) : null}

          {!isPendingFieldIntake && (secondaryActions.length > 0 || canReviewArrival) ? (
            <div className="inspector-secondary-actions">
              {secondaryActions.map((secondaryAction) => (
                <IonButton
                  key={`${secondaryAction.trigger}-${secondaryAction.toState}`}
                  fill="outline"
                  onClick={() =>
                    secondaryAction.trigger === "BLOCKER_REPORTED"
                      ? setIsNeedInfoOpen(true)
                      : void runTransition(secondaryAction)
                  }
                  disabled={transitionBusy}
                >
                  {secondaryAction.label}
                </IonButton>
              ))}
              {canReviewArrival ? (
                <IonButton fill="outline" onClick={() => history.push(`/t/${tenantSlug}/order/${order.id}/arrival?mode=review`)}>
                  Review Arrival
                </IonButton>
              ) : null}
            </div>
          ) : null}

          {workflowState === "waiting_for_info" && activeBlocker ? (
            <section className="inspector-blocker-card">
              <div className="inspector-blocker-card-head">
                <span className="inspector-progress-label">Open Blocker</span>
                <strong>{activeBlocker.blockerType || "Info Needed"}</strong>
              </div>
              <p className="inspector-order-subtle">
                {activeBlocker.blockerNotes || "Waiting for additional information before inspection can continue."}
              </p>
              <IonButton fill="outline" onClick={() => setIsResolveBlockerOpen(true)} disabled={transitionBusy}>
                Resolve Blocker
              </IonButton>
            </section>
          ) : null}

          {actionNote ? (
            <IonText color="medium" className="inspector-status-note">
              <p className="inspector-order-subtle">{actionNote}</p>
            </IonText>
          ) : null}

          <SectionTitle>Progress</SectionTitle>
          <div className="inspector-progress">
            <InfoCard label="Progress" value={`${completionPct}%`} />
            <InfoCard label="Findings" value={findingsCount} />
            <InfoCard label="Photos" value={mediaCount} />
          </div>

          <StickyButtonRow>
            <IonButton expand="block" fill="outline" onClick={openNativeMaps} disabled={isPendingFieldIntake || !hasMappableAddress}>
              Get Directions
            </IonButton>
            {isPendingFieldIntake ? (
              <IonButton expand="block" onClick={() => history.push(`/t/${tenantSlug}/order/${order.id}/field-intake`)}>
                Edit Field Intake
              </IonButton>
            ) : canOpenGuidedInspection ? (
              <IonButton expand="block" onClick={() => history.push(`/t/${tenantSlug}/order/${order.id}/inspection`)}>
                Continue Inspection
              </IonButton>
            ) : primaryAction && primaryAction.trigger !== "BLOCKER_CLEARED" ? (
              <IonButton expand="block" className="inspector-primary-action" onClick={() => void runTransition(primaryAction)} disabled={transitionBusy}>
                {transitionBusy ? <IonSpinner name="crescent" /> : primaryAction.label}
              </IonButton>
            ) : null}
          </StickyButtonRow>

          <IonModal
            isOpen={isNeedInfoOpen}
            onDidDismiss={() => setIsNeedInfoOpen(false)}
            initialBreakpoint={0.62}
            breakpoints={[0, 0.62, 0.86]}
            className="inspector-blocker-modal"
          >
            <div className="inspector-blocker-sheet">
              <div className="inspector-blocker-sheet-head">
                <h3>What do you need?</h3>
                <p>Capture the blocker before pausing this inspection.</p>
              </div>

              <div className="inspector-blocker-chip-row">
                {BLOCKER_OPTIONS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    className={`inspector-blocker-chip ${blockerType === option ? "is-on" : ""}`}
                    onClick={() => setBlockerType(option)}
                  >
                    {option}
                  </button>
                ))}
              </div>

              <IonTextarea
                label="Notes"
                labelPlacement="stacked"
                className="inspector-blocker-notes"
                value={blockerNotes}
                onIonInput={(event) => setBlockerNotes(String(event.detail.value ?? ""))}
                placeholder="What is missing, who is needed, and what should happen next?"
                autoGrow
              />

              <div className="inspector-blocker-actions">
                <IonButton fill="outline" onClick={() => setIsNeedInfoOpen(false)} disabled={transitionBusy}>
                  Cancel
                </IonButton>
                <IonButton onClick={() => void submitNeedInfo()} disabled={!blockerType || transitionBusy}>
                  {transitionBusy ? <IonSpinner name="crescent" /> : "Save and Pause"}
                </IonButton>
              </div>
            </div>
          </IonModal>

          <IonModal
            isOpen={isResolveBlockerOpen}
            onDidDismiss={() => setIsResolveBlockerOpen(false)}
            initialBreakpoint={0.5}
            breakpoints={[0, 0.5, 0.8]}
            className="inspector-blocker-modal"
          >
            <div className="inspector-blocker-sheet">
              <div className="inspector-blocker-sheet-head">
                <h3>Resolve blocker</h3>
                <p>Capture what changed before returning to the inspection.</p>
              </div>

              <div className="inspector-blocker-summary">
                <span className="inspector-progress-label">Open Issue</span>
                <strong>{activeBlocker?.blockerType || "Info Needed"}</strong>
                <p>{activeBlocker?.blockerNotes || "No blocker notes provided."}</p>
              </div>

              <IonTextarea
                label="Resolution Notes"
                labelPlacement="stacked"
                className="inspector-blocker-notes"
                value={resolutionNotes}
                onIonInput={(event) => setResolutionNotes(String(event.detail.value ?? ""))}
                placeholder="What did you receive or verify so inspection can continue?"
                autoGrow
              />

              <div className="inspector-blocker-actions">
                <IonButton fill="outline" onClick={() => setIsResolveBlockerOpen(false)} disabled={transitionBusy}>
                  Cancel
                </IonButton>
                <IonButton onClick={() => void submitResolveBlocker()} disabled={transitionBusy}>
                  {transitionBusy ? <IonSpinner name="crescent" /> : "Resolve and Resume"}
                </IonButton>
              </div>
            </div>
          </IonModal>
        </div>
      ) : null}
    </MobilePageLayout>
  );
}
