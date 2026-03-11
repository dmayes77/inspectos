import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CameraSource } from '@capacitor/camera';
import {
  IonButton,
  IonModal,
  IonSpinner,
  IonText,
  IonTextarea,
} from '@ionic/react';
import { Geolocation } from '@capacitor/geolocation';
import { useHistory, useLocation, useParams } from 'react-router-dom';
import { MobilePageLayout } from '../components/MobilePageLayout';
import { useCamera } from '../hooks/useCamera';
import {
  createQuickCapture,
  fetchQuickCaptures,
  getOrder,
  getOrderArrivalChecklist,
  saveOrderArrivalChecklist,
  transitionOrderInspectionState,
  type ArrivalChecklistPayload,
  type QuickCaptureMediaPayload,
} from '../services/api';
import { mobileQueryKeys } from '../lib/query-keys';
import { enqueueQuickCapture } from '../services/quickCaptureOfflineQueue';
import { buildInspectionTransitionRequest, validateInspectionTransition } from '../lib/inspection-state-machine';
import type {
  InspectionTransitionCheck,
} from '../../../../shared/types/inspection-state-machine';

const DEVICE_ID_STORAGE_KEY = 'inspectos_mobile_device_id';
const ARRIVAL_DRAFT_STORAGE_KEY_PREFIX = 'inspectos_mobile_arrival_draft';

type ArrivalModalKey = 'safety' | 'access' | 'occupancy' | 'utilities' | null;

type ArrivalPhotoKind = 'front_exterior' | 'street_number';

type ArrivalPhotoDraft = {
  kind: ArrivalPhotoKind;
  label: string;
  required: boolean;
  imageBlob: Blob | null;
  previewUrl: string;
  capturedAt: string | null;
  latitude: number | null;
  longitude: number | null;
  accuracyMeters: number | null;
  queued: boolean;
};

type LocalArrivalChecklistDraft = {
  checklist: ArrivalChecklistPayload;
  updated_at: string;
  dirty: boolean;
};

function buildArrivalDraftStorageKey(tenantSlug: string, orderId: string) {
  return `${ARRIVAL_DRAFT_STORAGE_KEY_PREFIX}:${tenantSlug}:${orderId}`;
}

function readLocalArrivalChecklistDraft(
  tenantSlug: string,
  orderId: string
): LocalArrivalChecklistDraft | null {
  const raw = window.localStorage.getItem(buildArrivalDraftStorageKey(tenantSlug, orderId));
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as LocalArrivalChecklistDraft;
    if (!parsed || typeof parsed !== 'object' || !parsed.checklist || typeof parsed.updated_at !== 'string') {
      return null;
    }
    return {
      checklist: parsed.checklist,
      updated_at: parsed.updated_at,
      dirty: Boolean(parsed.dirty),
    };
  } catch {
    return null;
  }
}

function writeLocalArrivalChecklistDraft(
  tenantSlug: string,
  orderId: string,
  draft: LocalArrivalChecklistDraft
) {
  window.localStorage.setItem(buildArrivalDraftStorageKey(tenantSlug, orderId), JSON.stringify(draft));
}

function formatDateTime(dateIso: string) {
  const date = new Date(dateIso);
  if (Number.isNaN(date.getTime())) return dateIso;
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

function buildDefaultPhotos(): ArrivalPhotoDraft[] {
  return [
    {
      kind: 'front_exterior',
      label: 'Full Front of House',
      required: true,
      imageBlob: null,
      previewUrl: '',
      capturedAt: null,
      latitude: null,
      longitude: null,
      accuracyMeters: null,
      queued: false,
    },
    {
      kind: 'street_number',
      label: 'Street Number (Optional)',
      required: false,
      imageBlob: null,
      previewUrl: '',
      capturedAt: null,
      latitude: null,
      longitude: null,
      accuracyMeters: null,
      queued: false,
    },
  ];
}

function buildArrivalPhotoNote(kind: ArrivalPhotoKind, orderId: string) {
  return `[ARRIVAL_PHOTO] type=${kind}; order_id=${orderId}; keep_for_property_avatar=true`;
}

function matchesArrivalPhoto(item: QuickCaptureMediaPayload, orderId: string, kind: ArrivalPhotoKind) {
  return item.note.includes(`[ARRIVAL_PHOTO]`) && item.note.includes(`order_id=${orderId}`) && item.note.includes(`type=${kind}`);
}

export default function ArrivalConfirmed() {
  const history = useHistory();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { tenantSlug, orderId } = useParams<{ tenantSlug: string; orderId: string }>();
  const { capture, isCancelError } = useCamera();
  const isReviewMode = new URLSearchParams(location.search).get('mode') === 'review';

  const [actionNote, setActionNote] = useState<string>('');
  const [transitionBusy, setTransitionBusy] = useState(false);
  const [capturedAt, setCapturedAt] = useState<string>(new Date().toISOString());
  const [coords, setCoords] = useState<{ latitude: number; longitude: number; accuracy: number | null } | null>(null);

  const [activeModal, setActiveModal] = useState<ArrivalModalKey>(null);

  const [safetyReady, setSafetyReady] = useState(false);
  const [safetyPpe, setSafetyPpe] = useState<'yes' | 'no' | ''>('');
  const [safetyNotes, setSafetyNotes] = useState('');

  const [accessReady, setAccessReady] = useState(false);
  const [accessMethod, setAccessMethod] = useState<'lockbox' | 'client' | 'agent' | 'other' | ''>('');
  const [accessNotes, setAccessNotes] = useState('');

  const [occupancyLogged, setOccupancyLogged] = useState(false);
  const [occupancyStatus, setOccupancyStatus] = useState<'vacant' | 'occupied' | 'unknown' | ''>('');
  const [occupancyNotes, setOccupancyNotes] = useState('');

  const [utilitiesLogged, setUtilitiesLogged] = useState(false);
  const [electricityStatus, setElectricityStatus] = useState<'on' | 'off' | 'limited' | ''>('');
  const [waterStatus, setWaterStatus] = useState<'on' | 'off' | 'limited' | ''>('');
  const [gasStatus, setGasStatus] = useState<'on' | 'off' | 'not_present' | ''>('');
  const [utilitiesNotes, setUtilitiesNotes] = useState('');

  const [photos, setPhotos] = useState<ArrivalPhotoDraft[]>(buildDefaultPhotos);
  const [photoBusyKey, setPhotoBusyKey] = useState<ArrivalPhotoKind | null>(null);
  const didHydrateArrivalDraftRef = useRef(false);
  const orderQuery = useQuery({
    queryKey: mobileQueryKeys.order(tenantSlug, orderId),
    queryFn: () => getOrder(tenantSlug, orderId),
  });
  const arrivalChecklistQuery = useQuery({
    queryKey: mobileQueryKeys.orderArrivalChecklist(tenantSlug, orderId),
    queryFn: () => getOrderArrivalChecklist(tenantSlug, orderId),
  });
  const quickCapturesQuery = useQuery({
    queryKey: mobileQueryKeys.quickCaptures(tenantSlug),
    queryFn: () => fetchQuickCaptures(tenantSlug),
  });
  const saveArrivalChecklistMutation = useMutation({
    mutationFn: (checklist: ArrivalChecklistPayload) => saveOrderArrivalChecklist(tenantSlug, orderId, checklist),
    onSuccess: (saved) => {
      queryClient.setQueryData(mobileQueryKeys.orderArrivalChecklist(tenantSlug, orderId), saved);
    },
  });
  const detail = orderQuery.data ?? null;
  const loading = orderQuery.isPending || arrivalChecklistQuery.isPending;
  const error = orderQuery.error instanceof Error
    ? orderQuery.error.message
    : arrivalChecklistQuery.error instanceof Error
      ? arrivalChecklistQuery.error.message
      : quickCapturesQuery.error instanceof Error
        ? quickCapturesQuery.error.message
      : null;

  const buildChecklistPayload = (
    overrides: Partial<ArrivalChecklistPayload> = {}
  ): ArrivalChecklistPayload => ({
    safety_ready: safetyReady,
    safety_ppe: safetyPpe,
    safety_notes: safetyNotes,
    access_ready: accessReady,
    access_method: accessMethod,
    access_notes: accessNotes,
    occupancy_logged: occupancyLogged,
    occupancy_status: occupancyStatus,
    occupancy_notes: occupancyNotes,
    utilities_logged: utilitiesLogged,
    electricity_status: electricityStatus,
    water_status: waterStatus,
    gas_status: gasStatus,
    utilities_notes: utilitiesNotes,
    ...overrides,
  });

  const applyChecklistPayload = (checklist: ArrivalChecklistPayload) => {
    setSafetyReady(Boolean(checklist.safety_ready));
    setSafetyPpe((checklist.safety_ppe as 'yes' | 'no' | '') || '');
    setSafetyNotes(checklist.safety_notes || '');

    setAccessReady(Boolean(checklist.access_ready));
    setAccessMethod((checklist.access_method as 'lockbox' | 'client' | 'agent' | 'other' | '') || '');
    setAccessNotes(checklist.access_notes || '');

    setOccupancyLogged(Boolean(checklist.occupancy_logged));
    setOccupancyStatus((checklist.occupancy_status as 'vacant' | 'occupied' | 'unknown' | '') || '');
    setOccupancyNotes(checklist.occupancy_notes || '');

    setUtilitiesLogged(Boolean(checklist.utilities_logged));
    setElectricityStatus((checklist.electricity_status as 'on' | 'off' | 'limited' | '') || '');
    setWaterStatus((checklist.water_status as 'on' | 'off' | 'limited' | '') || '');
    setGasStatus((checklist.gas_status as 'on' | 'off' | 'not_present' | '') || '');
    setUtilitiesNotes(checklist.utilities_notes || '');
  };

  const persistChecklistDraft = useCallback(async (checklist: ArrivalChecklistPayload) => {
    const now = new Date().toISOString();
    writeLocalArrivalChecklistDraft(tenantSlug, orderId, {
      checklist,
      updated_at: now,
      dirty: true,
    });

    if (!navigator.onLine) return;

    try {
      const saved = await saveArrivalChecklistMutation.mutateAsync(checklist);
      writeLocalArrivalChecklistDraft(tenantSlug, orderId, {
        checklist: saved.checklist,
        updated_at: saved.updated_at,
        dirty: false,
      });
    } catch (saveError) {
      setActionNote(saveError instanceof Error ? saveError.message : 'Failed to save arrival draft');
    }
  }, [orderId, saveArrivalChecklistMutation, tenantSlug]);

  const deviceId = useMemo(() => {
    const existing = window.localStorage.getItem(DEVICE_ID_STORAGE_KEY);
    if (existing) return existing;
    const generated = crypto.randomUUID();
    window.localStorage.setItem(DEVICE_ID_STORAGE_KEY, generated);
    return generated;
  }, []);

  useEffect(() => {
    if (didHydrateArrivalDraftRef.current) return;
    if (arrivalChecklistQuery.isPending) return;

    const localDraft = readLocalArrivalChecklistDraft(tenantSlug, orderId);
    if (localDraft?.checklist) {
      applyChecklistPayload(localDraft.checklist);
    }

    void (async () => {
      try {
        const remoteDraft = arrivalChecklistQuery.data;
        if (!remoteDraft) {
          if (localDraft?.dirty) {
            await persistChecklistDraft(localDraft.checklist);
          }
          didHydrateArrivalDraftRef.current = true;
          return;
        }

        const hasLocalDirty = Boolean(localDraft?.dirty && localDraft.checklist);
        if (hasLocalDirty && localDraft) {
          await persistChecklistDraft(localDraft.checklist);
          didHydrateArrivalDraftRef.current = true;
          return;
        }

        const localUpdatedAt = localDraft?.updated_at ? new Date(localDraft.updated_at).getTime() : 0;
        const remoteUpdatedAt = new Date(remoteDraft.updated_at).getTime();
        if (!localDraft || remoteUpdatedAt >= localUpdatedAt) {
          applyChecklistPayload(remoteDraft.checklist);
          writeLocalArrivalChecklistDraft(tenantSlug, orderId, {
            checklist: remoteDraft.checklist,
            updated_at: remoteDraft.updated_at,
            dirty: false,
          });
        }
        didHydrateArrivalDraftRef.current = true;
      } catch (syncError) {
        setActionNote(syncError instanceof Error ? syncError.message : 'Failed to sync arrival draft');
        didHydrateArrivalDraftRef.current = true;
      }
    })();
  }, [arrivalChecklistQuery.data, arrivalChecklistQuery.isPending, orderId, persistChecklistDraft, tenantSlug]);

  useEffect(() => {
    didHydrateArrivalDraftRef.current = false;
  }, [orderId, tenantSlug]);

  useEffect(() => {
    const onOnline = () => {
      const localDraft = readLocalArrivalChecklistDraft(tenantSlug, orderId);
      if (!localDraft?.dirty) return;
      void persistChecklistDraft(localDraft.checklist);
    };

    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
  }, [orderId, persistChecklistDraft, tenantSlug]);

  useEffect(() => {
    return () => {
      photos.forEach((photo) => {
        if (photo.previewUrl) {
          URL.revokeObjectURL(photo.previewUrl);
        }
      });
    };
  }, [photos]);

  useEffect(() => {
    const items = quickCapturesQuery.data ?? [];
    if (items.length === 0) return;

    setPhotos((prev) =>
      prev.map((photo) => {
        if (photo.imageBlob || photo.previewUrl) return photo;
        const match = items.find((item) => matchesArrivalPhoto(item, orderId, photo.kind));
        if (!match) return photo;
        return {
          ...photo,
          previewUrl: match.image_url,
          capturedAt: match.captured_at,
          latitude: match.latitude,
          longitude: match.longitude,
          accuracyMeters: match.accuracy_meters ?? null,
          queued: true,
        };
      })
    );
  }, [orderId, quickCapturesQuery.data]);

  const refreshLocation = async () => {
    try {
      const geo = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 15000,
      });
      setCoords({
        latitude: geo.coords.latitude,
        longitude: geo.coords.longitude,
        accuracy: Number.isFinite(geo.coords.accuracy) ? geo.coords.accuracy : null,
      });
      setCapturedAt(new Date().toISOString());
      setActionNote('');
    } catch (geoError) {
      setActionNote(geoError instanceof Error ? geoError.message : 'Could not capture location');
    }
  };

  useEffect(() => {
    void refreshLocation();
  }, []);

  const order = detail?.order ?? null;
  const frontPhoto = photos.find((photo) => photo.kind === 'front_exterior') ?? null;
  const requiredPhotoReady = Boolean(frontPhoto?.imageBlob || frontPhoto?.queued);
  const workflowState = 'arrived';

  const checklistReady = safetyReady && accessReady && occupancyLogged && utilitiesLogged;
  const locationReady = Boolean(coords);
  const canBeginInspection =
    workflowState === 'arrived' && checklistReady && locationReady && requiredPhotoReady;

  const propertyAddress = [
    order?.property?.address_line1,
    order?.property?.city,
    order?.property?.state,
    order?.property?.zip_code,
  ]
    .filter((value): value is string => Boolean(value && value.trim().length > 0))
    .join(', ');

  const captureArrivalPhoto = async (kind: ArrivalPhotoKind) => {
    setPhotoBusyKey(kind);
    setActionNote('');
    try {
      const result = await capture({
        source: CameraSource.Camera,
        withLocation: true,
        filePrefix: `arrival-${kind}`,
      });
      if (result.latitude == null || result.longitude == null) {
        throw new Error('Arrival photos require location.');
      }

      setPhotos((prev) =>
        prev.map((photo) => {
          if (photo.kind !== kind) return photo;
          if (photo.previewUrl) {
            URL.revokeObjectURL(photo.previewUrl);
          }
          return {
            ...photo,
            imageBlob: result.blob,
            previewUrl: result.previewUrl,
            capturedAt: result.capturedAt,
            latitude: result.latitude ?? null,
            longitude: result.longitude ?? null,
            accuracyMeters: result.accuracyMeters ?? null,
            queued: false,
          };
        })
      );
    } catch (captureError) {
      if (isCancelError(captureError)) {
        return;
      }
      setActionNote(captureError instanceof Error ? captureError.message : 'Failed to capture arrival photo');
    } finally {
      setPhotoBusyKey(null);
    }
  };

  const queueArrivalPhotos = async () => {
    const photosToQueue = photos.filter(
      (photo) =>
        !photo.queued &&
        Boolean(photo.imageBlob && photo.capturedAt && photo.latitude != null && photo.longitude != null)
    );

    for (const photo of photosToQueue) {
      const note = buildArrivalPhotoNote(photo.kind, orderId);
      if (navigator.onLine) {
        const file = new File([photo.imageBlob as Blob], `arrival-${photo.kind}-${Date.now()}.jpg`, {
          type: (photo.imageBlob as Blob).type || 'image/jpeg',
        });
        await createQuickCapture(tenantSlug, {
          file,
          note,
          captured_at: photo.capturedAt as string,
          latitude: photo.latitude as number,
          longitude: photo.longitude as number,
          accuracy_meters: photo.accuracyMeters,
        });
      } else {
        await enqueueQuickCapture({
          tenantSlug,
          note,
          capturedAt: photo.capturedAt as string,
          latitude: photo.latitude as number,
          longitude: photo.longitude as number,
          accuracyMeters: photo.accuracyMeters,
          imageBlob: photo.imageBlob as Blob,
        });
      }
    }

    if (photosToQueue.length > 0) {
      setPhotos((prev) =>
        prev.map((photo) =>
          photosToQueue.some((queued) => queued.kind === photo.kind)
            ? { ...photo, queued: true }
            : photo
        )
      );
      await queryClient.invalidateQueries({ queryKey: mobileQueryKeys.quickCaptures(tenantSlug) });
      await queryClient.invalidateQueries({ queryKey: mobileQueryKeys.pendingQuickCaptures(tenantSlug) });
    }
  };

  const beginInspection = async () => {
    if (!order) return;

    const checks: Partial<Record<InspectionTransitionCheck, boolean>> = {
      inspector_membership_verified: true,
      order_assigned_to_inspector: true,
      checklist_version_matches: true,
      checklist_payload_present: Boolean(detail?.template),
    };
    const guard = validateInspectionTransition('arrived', 'in_progress', 'INSPECTION_STARTED', checks);
    if (!guard.ok) {
      setActionNote(guard.reason);
      return;
    }

    setTransitionBusy(true);
    setActionNote('');
    try {
      await queueArrivalPhotos();

      const payload = buildInspectionTransitionRequest({
        deviceId,
        fromState: 'arrived',
        toState: 'in_progress',
        trigger: 'INSPECTION_STARTED',
        checklistVersion: detail?.template?.id,
        checks,
        metadata: {
          arrival_confirmed_at: capturedAt,
          arrival_latitude: coords?.latitude,
          arrival_longitude: coords?.longitude,
          arrival_accuracy_meters: coords?.accuracy ?? null,
          safety_ready: safetyReady,
          safety_ppe: safetyPpe,
          safety_notes: safetyNotes,
          access_ready: accessReady,
          access_method: accessMethod,
          access_notes: accessNotes,
          occupancy_logged: occupancyLogged,
          occupancy_status: occupancyStatus,
          occupancy_notes: occupancyNotes,
          utilities_logged: utilitiesLogged,
          electricity_status: electricityStatus,
          water_status: waterStatus,
          gas_status: gasStatus,
          utilities_notes: utilitiesNotes,
          arrival_photos: photos
            .filter((photo) => photo.queued || photo.imageBlob)
            .map((photo) => ({
              type: photo.kind,
              captured_at: photo.capturedAt,
              latitude: photo.latitude,
              longitude: photo.longitude,
              accuracy_meters: photo.accuracyMeters,
              queued: photo.queued,
            })),
        },
      });
      await transitionOrderInspectionState(tenantSlug, order.id, payload);
      await queryClient.invalidateQueries({ queryKey: mobileQueryKeys.order(tenantSlug, orderId) });
      await queryClient.invalidateQueries({ queryKey: mobileQueryKeys.orders(tenantSlug) });
      history.replace(`/t/${tenantSlug}/order/${order.id}/inspection`);
    } catch (transitionError) {
      setActionNote(transitionError instanceof Error ? transitionError.message : 'Failed to begin inspection');
    } finally {
      setTransitionBusy(false);
    }
  };

  const saveArrivalReview = async () => {
    setTransitionBusy(true);
    setActionNote('');
    try {
      const checklist = buildChecklistPayload();
      await persistChecklistDraft(checklist);
      await queueArrivalPhotos();
      await queryClient.invalidateQueries({ queryKey: mobileQueryKeys.orderArrivalChecklist(tenantSlug, orderId) });
      await queryClient.invalidateQueries({ queryKey: mobileQueryKeys.order(tenantSlug, orderId) });
      await queryClient.invalidateQueries({ queryKey: mobileQueryKeys.orders(tenantSlug) });
      history.replace(`/t/${tenantSlug}/order/${orderId}`);
    } catch (saveError) {
      setActionNote(saveError instanceof Error ? saveError.message : 'Failed to save arrival review');
    } finally {
      setTransitionBusy(false);
    }
  };

  const closeModal = () => setActiveModal(null);

  const renderModalBody = () => {
    if (activeModal === 'safety') {
      const canConfirm = safetyPpe.length > 0;
      return (
        <div className="arrival-modal-body">
          <h3>Safety/PPE</h3>
          <p>Confirm PPE is in use before beginning.</p>
          <div className="arrival-option-row">
            <button
              type="button"
              className={`arrival-option-chip ${safetyPpe === 'yes' ? 'is-on' : ''}`}
              onClick={() => setSafetyPpe('yes')}
            >
              PPE in use
            </button>
            <button
              type="button"
              className={`arrival-option-chip ${safetyPpe === 'no' ? 'is-on' : ''}`}
              onClick={() => setSafetyPpe('no')}
            >
              PPE not in use
            </button>
          </div>
          <IonTextarea
            label="Notes"
            labelPlacement="stacked"
            className="profile-input profile-textarea"
            value={safetyNotes}
            onIonInput={(event) => setSafetyNotes(String(event.detail.value ?? ''))}
            placeholder="Optional site safety notes"
          />
          <IonButton
            expand="block"
            disabled={!canConfirm}
            onClick={() => {
              const next = buildChecklistPayload({ safety_ready: true });
              setSafetyReady(true);
              void persistChecklistDraft(next);
              closeModal();
            }}
          >
            Confirm Safety
          </IonButton>
        </div>
      );
    }

    if (activeModal === 'access') {
      const canConfirm = accessMethod.length > 0;
      return (
        <div className="arrival-modal-body">
          <h3>Access Method</h3>
          <p>Log how you gained entry.</p>
          <div className="arrival-option-row">
            <button type="button" className={`arrival-option-chip ${accessMethod === 'lockbox' ? 'is-on' : ''}`} onClick={() => setAccessMethod('lockbox')}>Lockbox</button>
            <button type="button" className={`arrival-option-chip ${accessMethod === 'client' ? 'is-on' : ''}`} onClick={() => setAccessMethod('client')}>Client present</button>
            <button type="button" className={`arrival-option-chip ${accessMethod === 'agent' ? 'is-on' : ''}`} onClick={() => setAccessMethod('agent')}>Agent present</button>
            <button type="button" className={`arrival-option-chip ${accessMethod === 'other' ? 'is-on' : ''}`} onClick={() => setAccessMethod('other')}>Other</button>
          </div>
          <IonTextarea
            label="Access Notes"
            labelPlacement="stacked"
            className="profile-input profile-textarea"
            value={accessNotes}
            onIonInput={(event) => setAccessNotes(String(event.detail.value ?? ''))}
            placeholder="Code, callout, or instructions"
          />
          <IonButton
            expand="block"
            disabled={!canConfirm}
            onClick={() => {
              const next = buildChecklistPayload({ access_ready: true });
              setAccessReady(true);
              void persistChecklistDraft(next);
              closeModal();
            }}
          >
            Confirm Access
          </IonButton>
        </div>
      );
    }

    if (activeModal === 'occupancy') {
      const canConfirm = occupancyStatus.length > 0;
      return (
        <div className="arrival-modal-body">
          <h3>Occupancy</h3>
          <p>Record occupancy status at arrival.</p>
          <div className="arrival-option-row">
            <button type="button" className={`arrival-option-chip ${occupancyStatus === 'vacant' ? 'is-on' : ''}`} onClick={() => setOccupancyStatus('vacant')}>Vacant</button>
            <button type="button" className={`arrival-option-chip ${occupancyStatus === 'occupied' ? 'is-on' : ''}`} onClick={() => setOccupancyStatus('occupied')}>Occupied</button>
            <button type="button" className={`arrival-option-chip ${occupancyStatus === 'unknown' ? 'is-on' : ''}`} onClick={() => setOccupancyStatus('unknown')}>Unknown</button>
          </div>
          <IonTextarea
            label="Notes"
            labelPlacement="stacked"
            className="profile-input profile-textarea"
            value={occupancyNotes}
            onIonInput={(event) => setOccupancyNotes(String(event.detail.value ?? ''))}
            placeholder="Who was present or other details"
          />
          <IonButton
            expand="block"
            disabled={!canConfirm}
            onClick={() => {
              const next = buildChecklistPayload({ occupancy_logged: true });
              setOccupancyLogged(true);
              void persistChecklistDraft(next);
              closeModal();
            }}
          >
            Confirm Occupancy
          </IonButton>
        </div>
      );
    }

    if (activeModal === 'utilities') {
      const canConfirm = electricityStatus.length > 0 && waterStatus.length > 0 && gasStatus.length > 0;
      return (
        <div className="arrival-modal-body">
          <h3>Utilities</h3>
          <p>Log utility status at arrival.</p>
          <div className="arrival-modal-row">
            <span className="arrival-modal-label">Electricity</span>
            <div className="arrival-option-row">
              <button type="button" className={`arrival-option-chip ${electricityStatus === 'on' ? 'is-on' : ''}`} onClick={() => setElectricityStatus('on')}>On</button>
              <button type="button" className={`arrival-option-chip ${electricityStatus === 'off' ? 'is-on' : ''}`} onClick={() => setElectricityStatus('off')}>Off</button>
              <button type="button" className={`arrival-option-chip ${electricityStatus === 'limited' ? 'is-on' : ''}`} onClick={() => setElectricityStatus('limited')}>Limited</button>
            </div>
          </div>
          <div className="arrival-modal-row">
            <span className="arrival-modal-label">Water</span>
            <div className="arrival-option-row">
              <button type="button" className={`arrival-option-chip ${waterStatus === 'on' ? 'is-on' : ''}`} onClick={() => setWaterStatus('on')}>On</button>
              <button type="button" className={`arrival-option-chip ${waterStatus === 'off' ? 'is-on' : ''}`} onClick={() => setWaterStatus('off')}>Off</button>
              <button type="button" className={`arrival-option-chip ${waterStatus === 'limited' ? 'is-on' : ''}`} onClick={() => setWaterStatus('limited')}>Limited</button>
            </div>
          </div>
          <div className="arrival-modal-row">
            <span className="arrival-modal-label">Gas</span>
            <div className="arrival-option-row">
              <button type="button" className={`arrival-option-chip ${gasStatus === 'on' ? 'is-on' : ''}`} onClick={() => setGasStatus('on')}>On</button>
              <button type="button" className={`arrival-option-chip ${gasStatus === 'off' ? 'is-on' : ''}`} onClick={() => setGasStatus('off')}>Off</button>
              <button type="button" className={`arrival-option-chip ${gasStatus === 'not_present' ? 'is-on' : ''}`} onClick={() => setGasStatus('not_present')}>Not Present</button>
            </div>
          </div>
          <IonTextarea
            label="Notes"
            labelPlacement="stacked"
            className="profile-input profile-textarea"
            value={utilitiesNotes}
            onIonInput={(event) => setUtilitiesNotes(String(event.detail.value ?? ''))}
            placeholder="Utility issues or hazards"
          />
          <IonButton
            expand="block"
            disabled={!canConfirm}
            onClick={() => {
              const next = buildChecklistPayload({ utilities_logged: true });
              setUtilitiesLogged(true);
              void persistChecklistDraft(next);
              closeModal();
            }}
          >
            Confirm Utilities
          </IonButton>
        </div>
      );
    }

    return null;
  };

  return (
    <MobilePageLayout
      title={propertyAddress || 'Arrival Confirmed'}
      showBack
      defaultHref={`/t/${tenantSlug}/order/${orderId}`}
    >
      {loading ? <IonSpinner name="crescent" /> : null}
      {error ? (
        <IonText color="danger">
          <p>{error}</p>
        </IonText>
      ) : null}

      {!loading && !error && order ? (
        <div className="inspector-order">
          <section className="inspector-arrival-block">
            <p className="inspector-section-title">On-Site Check-In</p>
            <div className="inspector-arrival-meta">
              <div>
                <span className="inspector-progress-label">Timestamp</span>
                <strong>{formatDateTime(capturedAt)}</strong>
              </div>
              <div>
                <span className="inspector-progress-label">Location</span>
                <strong>
                  {coords
                    ? `${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}${
                        coords.accuracy ? ` ±${Math.round(coords.accuracy)}m` : ''
                      }`
                    : 'Location required'}
                </strong>
              </div>
            </div>
            <IonButton fill="outline" onClick={() => void refreshLocation()}>
              Refresh Location
            </IonButton>
          </section>

          <section className="inspector-arrival-block">
            <p className="inspector-section-title">Required Before Start</p>
            <div className="inspector-arrival-checks">
              <button type="button" className={`inspector-arrival-check ${safetyReady ? 'is-on' : ''}`} onClick={() => setActiveModal('safety')}>
                <span>Safety/PPE</span>
                <small>{safetyReady ? 'Confirmed' : 'Tap to confirm'}</small>
              </button>
              <button type="button" className={`inspector-arrival-check ${accessReady ? 'is-on' : ''}`} onClick={() => setActiveModal('access')}>
                <span>Access Method</span>
                <small>{accessReady ? 'Logged' : 'Tap to log'}</small>
              </button>
              <button type="button" className={`inspector-arrival-check ${occupancyLogged ? 'is-on' : ''}`} onClick={() => setActiveModal('occupancy')}>
                <span>Occupancy</span>
                <small>{occupancyLogged ? 'Logged' : 'Tap to log'}</small>
              </button>
              <button type="button" className={`inspector-arrival-check ${utilitiesLogged ? 'is-on' : ''}`} onClick={() => setActiveModal('utilities')}>
                <span>Utilities</span>
                <small>{utilitiesLogged ? 'Logged' : 'Tap to log'}</small>
              </button>
            </div>
          </section>

          <section className="inspector-arrival-block">
            <p className="inspector-section-title">Arrival Photos</p>
            <p className="inspector-order-subtle">Capture a full-front image for property identity and future avatar use.</p>
            <div className="inspector-arrival-photo-grid">
              {photos.map((photo) => (
                <div key={photo.kind} className="inspector-arrival-photo-card">
                  <strong>{photo.label}</strong>
                  {photo.previewUrl ? <img src={photo.previewUrl} alt={photo.label} className="inspector-arrival-photo-preview" /> : null}
                  <small>
                    {photo.required ? 'Required' : 'Optional'}
                    {photo.capturedAt ? ` • ${formatDateTime(photo.capturedAt)}` : ''}
                    {photo.queued ? ' • queued' : ''}
                  </small>
                  <IonButton
                    fill="outline"
                    disabled={photoBusyKey === photo.kind || transitionBusy}
                    onClick={() => void captureArrivalPhoto(photo.kind)}
                  >
                    {photoBusyKey === photo.kind ? <IonSpinner name="crescent" /> : photo.previewUrl ? 'Retake' : 'Capture'}
                  </IonButton>
                </div>
              ))}
            </div>
          </section>

          <div className="inspector-bottom-actions">
            <IonButton
              expand="block"
              className="inspector-primary-action"
              disabled={isReviewMode ? transitionBusy : !canBeginInspection || transitionBusy}
              onClick={() => void (isReviewMode ? saveArrivalReview() : beginInspection())}
            >
              {transitionBusy ? <IonSpinner name="crescent" /> : isReviewMode ? 'Save Arrival' : 'Begin Inspection'}
            </IonButton>
          </div>
          {!isReviewMode && !canBeginInspection ? (
            <IonText color="medium" className="inspector-status-note">
              <p className="inspector-order-subtle">
                Complete all required confirmations, capture location, and add the full-front photo to continue.
              </p>
            </IonText>
          ) : null}
          {actionNote ? (
            <IonText color="medium" className="inspector-status-note">
              <p className="inspector-order-subtle">{actionNote}</p>
            </IonText>
          ) : null}

          <IonModal isOpen={activeModal !== null} onDidDismiss={closeModal} initialBreakpoint={0.64} breakpoints={[0, 0.64, 0.9]} className="arrival-confirm-modal">
            {renderModalBody()}
          </IonModal>
        </div>
      ) : null}
    </MobilePageLayout>
  );
}
