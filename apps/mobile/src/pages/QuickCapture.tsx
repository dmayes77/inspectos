import { useEffect, useMemo, useState } from 'react';
import { IonButton, IonIcon, IonSpinner, IonText, IonTextarea } from '@ionic/react';
import { CameraSource } from '@capacitor/camera';
import { cameraOutline, locationOutline, timeOutline } from 'ionicons/icons';
import { useHistory, useParams } from 'react-router-dom';
import { MobilePageLayout } from '../components/MobilePageLayout';
import { useCamera } from '../hooks/useCamera';
import {
  fetchQuickCaptures,
  type QuickCaptureMediaPayload,
} from '../services/api';
import {
  enqueueQuickCapture,
  listPendingQuickCaptures,
  syncPendingQuickCaptures,
  type PendingQuickCaptureRecord,
} from '../services/quickCaptureOfflineQueue';

type CaptureDraft = {
  imageBlob: Blob;
  previewUrl: string;
  capturedAt: string;
  latitude: number;
  longitude: number;
  accuracyMeters: number | null;
};

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

export default function QuickCapture() {
  const history = useHistory();
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const { capture, isCancelError } = useCamera();
  const [items, setItems] = useState<QuickCaptureMediaPayload[]>([]);
  const [pendingItems, setPendingItems] = useState<PendingQuickCaptureRecord[]>([]);
  const [draft, setDraft] = useState<CaptureDraft | null>(null);
  const [note, setNote] = useState('');
  const [capturing, setCapturing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const reloadItems = () => {
    setStatus(null);
    void (async () => {
      try {
        const [data, pending] = await Promise.all([
          fetchQuickCaptures(tenantSlug),
          listPendingQuickCaptures(tenantSlug),
        ]);
        setItems(data);
        setPendingItems(pending);
      } catch (error) {
        setStatus(error instanceof Error ? error.message : 'Failed to load capture gallery.');
      }
    })();
  };

  useEffect(() => {
    reloadItems();
  }, [tenantSlug]);

  useEffect(() => {
    return () => {
      if (draft?.previewUrl) {
        URL.revokeObjectURL(draft.previewUrl);
      }
    };
  }, [draft]);

  const syncPending = () => {
    void (async () => {
      if (!navigator.onLine) return;
      const result = await syncPendingQuickCaptures(tenantSlug);
      if (result.synced > 0) {
        setStatus(`Synced ${result.synced} offline capture${result.synced === 1 ? '' : 's'}.`);
      } else if (result.stoppedByNetwork) {
        setStatus('Offline. Your captures are queued and safe.');
      }
      reloadItems();
    })();
  };

  useEffect(() => {
    syncPending();
    const onOnline = () => syncPending();
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
  }, [tenantSlug]);

  const locationLabel = useMemo(() => {
    if (!draft) return '';
    const accuracy = draft.accuracyMeters ? ` ±${Math.round(draft.accuracyMeters)}m` : '';
    return `${draft.latitude.toFixed(6)}, ${draft.longitude.toFixed(6)}${accuracy}`;
  }, [draft]);

  const pendingWithPreview = useMemo(
    () =>
      pendingItems.map((item) => ({
        ...item,
        previewUrl: URL.createObjectURL(item.image_blob),
      })),
    [pendingItems]
  );

  useEffect(
    () => () => {
      pendingWithPreview.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    },
    [pendingWithPreview]
  );

  const capturePhoto = async () => {
    setCapturing(true);
    setStatus(null);
    try {
      const result = await capture({
        source: CameraSource.Camera,
        withLocation: true,
        filePrefix: 'quick-capture',
      });
      if (result.latitude == null || result.longitude == null) {
        throw new Error('Quick Capture requires location to save.');
      }

      setDraft({
        imageBlob: result.blob,
        previewUrl: result.previewUrl,
        capturedAt: result.capturedAt,
        latitude: result.latitude,
        longitude: result.longitude,
        accuracyMeters: result.accuracyMeters ?? null,
      });
      setNote('');
    } catch (error) {
      if (isCancelError(error)) {
        return;
      }
      setStatus(
        error instanceof Error
          ? error.message
          : 'Quick Capture failed. Location and timestamp are required to save.'
      );
    } finally {
      setCapturing(false);
    }
  };

  const saveCapture = async () => {
    if (!draft) return;

    setSaving(true);
    setStatus(null);
    try {
      await enqueueQuickCapture({
        tenantSlug,
        note: note.trim(),
        capturedAt: draft.capturedAt,
        latitude: draft.latitude,
        longitude: draft.longitude,
        accuracyMeters: draft.accuracyMeters,
        imageBlob: draft.imageBlob,
      });
      URL.revokeObjectURL(draft.previewUrl);
      setDraft(null);
      setNote('');
      setStatus('Saved offline. Uploading when connected.');
      reloadItems();

      if (navigator.onLine) {
        syncPending();
      }
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Failed to save capture.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <MobilePageLayout title="Quick Capture" showBack defaultHref={`/t/${tenantSlug}/dashboard`}>
      <div className="quick-capture-page">
        <section className="quick-capture-header-actions">
          <IonButton expand="block" onClick={() => void capturePhoto()} disabled={capturing || saving}>
            <IonIcon slot="start" icon={cameraOutline} />
            {capturing ? 'Capturing...' : 'Take Photo'}
          </IonButton>
          <p className="quick-capture-hint">Requires native timestamp + location before save.</p>
        </section>

        {draft ? (
          <section className="quick-capture-draft">
            <img src={draft.previewUrl} alt="Draft capture" className="quick-capture-image" />
            <div className="quick-capture-meta-row">
              <IonIcon icon={timeOutline} />
              <span>{formatDateTime(draft.capturedAt)}</span>
            </div>
            <div className="quick-capture-meta-row">
              <IonIcon icon={locationOutline} />
              <span>{locationLabel}</span>
            </div>
            <IonTextarea
              className="profile-input profile-textarea"
              label="Required Note"
              labelPlacement="stacked"
              autoGrow
              value={note}
              onIonInput={(e) => setNote(String(e.detail.value ?? ''))}
              placeholder="What are we capturing and why?"
            />
            <div className="quick-capture-draft-actions">
              <IonButton fill="outline" onClick={() => setDraft(null)} disabled={saving || capturing}>
                Discard
              </IonButton>
              <IonButton onClick={() => void saveCapture()} disabled={!note.trim() || saving || capturing}>
                {saving ? <IonSpinner name="crescent" /> : 'Save Capture'}
              </IonButton>
            </div>
          </section>
        ) : null}

        <section className="quick-capture-gallery">
          <div className="briefing-section-head">
            <h3>Capture Inbox</h3>
            <small>{items.length} uploaded • {pendingItems.length} pending</small>
          </div>
          {pendingItems.length > 0 ? (
            <div className="quick-capture-grid">
              {pendingWithPreview.map((item) => (
                <div key={item.local_id} className="quick-capture-tile quick-capture-tile-pending">
                  <img src={item.previewUrl} alt="Pending quick capture" />
                  <strong>Pending Upload</strong>
                  <small>{formatDateTime(item.captured_at)}</small>
                  <small>{item.last_error ? `Retrying: ${item.last_error}` : 'Will sync automatically'}</small>
                </div>
              ))}
            </div>
          ) : null}
          {items.length === 0 ? (
            <p className="briefing-empty">No captures yet.</p>
          ) : (
            <div className="quick-capture-grid">
              {items.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  className="quick-capture-tile"
                  onClick={() => history.push(`/t/${tenantSlug}/quick-capture/${item.id}`)}
                >
                  <img src={item.image_url} alt={item.name} />
                  <strong>{item.name}</strong>
                  <small>{formatDateTime(item.captured_at)}</small>
                </button>
              ))}
            </div>
          )}
        </section>

        {status ? (
          <IonText color="danger">
            <p>{status}</p>
          </IonText>
        ) : null}
      </div>
    </MobilePageLayout>
  );
}
