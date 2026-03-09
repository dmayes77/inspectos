import "./order-detail.css";
import { useEffect, useMemo, useState } from "react";
import { useHistory, useParams } from "react-router-dom";
import { IonButton, IonSpinner, IonText } from "@ionic/react";
import { Capacitor } from "@capacitor/core";
import { MobilePageLayout } from "../../components/MobilePageLayout";
import { InfoCard, SectionTitle, StatusChipRow, StickyButtonRow } from "../../components/ui";
import { fetchOrderDetail, transitionOrderInspectionState } from "../../services/api";
import { buildInspectionTransitionRequest, validateInspectionTransition } from "../../lib/inspection-state-machine";
import type { InspectionTransitionCheck, InspectionTransitionTrigger, InspectionWorkflowState } from "../../../../../shared/types/inspection-state-machine";

type TransitionAction = {
  label: string;
  toState: InspectionWorkflowState;
  trigger: InspectionTransitionTrigger;
  successMessage: string;
};

const DEVICE_ID_STORAGE_KEY = "inspectos_mobile_device_id";

function deriveInitialWorkflowState(orderStatus?: string | null, hasStarted?: boolean): InspectionWorkflowState {
  const normalized = (orderStatus ?? "").toLowerCase();
  if (normalized === "completed" || normalized === "submitted") return "completed";
  if (normalized === "in_progress") return "in_progress";
  if (hasStarted) return "in_progress";
  return "assigned";
}

function formatScheduleFriendly(scheduledDate?: string | null, scheduledTime?: string | null): string {
  if (!scheduledDate) return "Unscheduled";

  const [yearRaw, monthRaw, dayRaw] = scheduledDate.split("-");
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  const day = Number(dayRaw);

  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return [scheduledDate, scheduledTime].filter(Boolean).join(" ");
  }

  let hours = 0;
  let minutes = 0;
  if (scheduledTime) {
    const [hoursRaw, minutesRaw] = scheduledTime.split(":");
    hours = Number(hoursRaw);
    minutes = Number(minutesRaw);
  }

  const date = new Date(year, month - 1, day, hours, minutes);
  if (Number.isNaN(date.getTime())) {
    return [scheduledDate, scheduledTime].filter(Boolean).join(" ");
  }

  const datePart = new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);

  if (!scheduledTime) return datePart;

  const timePart = new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);

  return `${datePart} at ${timePart}`;
}

export default function OrderDetail() {
  const history = useHistory();
  const { tenantSlug, orderId } = useParams<{ tenantSlug: string; orderId: string }>();
  const [detail, setDetail] = useState<Awaited<ReturnType<typeof fetchOrderDetail>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionNote, setActionNote] = useState<string>("");
  const [workflowState, setWorkflowState] = useState<InspectionWorkflowState>("assigned");
  const [transitionBusy, setTransitionBusy] = useState(false);

  const deviceId = useMemo(() => {
    const existing = window.localStorage.getItem(DEVICE_ID_STORAGE_KEY);
    if (existing) return existing;
    const generated = crypto.randomUUID();
    window.localStorage.setItem(DEVICE_ID_STORAGE_KEY, generated);
    return generated;
  }, []);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchOrderDetail(tenantSlug, orderId);
        setDetail(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load order");
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, [tenantSlug, orderId]);

  const order = useMemo(() => detail?.order ?? null, [detail]);
  const totalTemplateItems = useMemo(() => detail?.template?.sections?.reduce((count, section) => count + section.items.length, 0) ?? 0, [detail]);
  const answeredCount = detail?.answers?.length ?? 0;
  const customAnsweredCount = detail?.custom_answers?.length ?? 0;
  const findingsCount = detail?.findings?.length ?? 0;
  const mediaCount = detail?.media?.length ?? 0;
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
    setWorkflowState(deriveInitialWorkflowState(order.status, hasStarted));
  }, [order, hasStarted]);

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

  const runTransition = async (action: TransitionAction) => {
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
        },
      });

      const response = await transitionOrderInspectionState(tenantSlug, order.id, payload);
      setWorkflowState(response.to_state);
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
            <InfoCard label="Scheduled" value={formatScheduleFriendly(order.scheduled_date, order.scheduled_time)} tone="scheduled" />
            <InfoCard label="Client" value={order.client?.name || "Not assigned"} tone="client" />
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

          {!isPendingFieldIntake && secondaryActions.length > 0 ? (
            <div className="inspector-secondary-actions">
              {secondaryActions.map((secondaryAction) => (
                <IonButton
                  key={`${secondaryAction.trigger}-${secondaryAction.toState}`}
                  fill="outline"
                  onClick={() => void runTransition(secondaryAction)}
                  disabled={transitionBusy}
                >
                  {secondaryAction.label}
                </IonButton>
              ))}
            </div>
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
            ) : primaryAction ? (
              <IonButton expand="block" className="inspector-primary-action" onClick={() => void runTransition(primaryAction)} disabled={transitionBusy}>
                {transitionBusy ? <IonSpinner name="crescent" /> : primaryAction.label}
              </IonButton>
            ) : null}
          </StickyButtonRow>
        </div>
      ) : null}
    </MobilePageLayout>
  );
}
