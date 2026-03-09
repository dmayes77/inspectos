import './inspection-item.css';
import { useEffect, useMemo, useState } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import {
  IonButton,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonSegment,
  IonSegmentButton,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonText,
  IonTextarea,
} from '@ionic/react';
import { CameraSource } from '@capacitor/camera';
import { cameraOutline, chevronForwardOutline } from 'ionicons/icons';
import { MobilePageLayout } from '../../components/MobilePageLayout';
import { SectionTitle, StickyButtonRow } from '../../components/ui';
import {
  createInspectionMedia,
  fetchInspectionMedia,
  fetchOrderDetail,
  saveInspectionAnswers,
  saveInspectionCustomAnswers,
  type InspectionMediaPayload,
} from '../../services/api';
import { useCamera } from '../../hooks/useCamera';

type Detail = Awaited<ReturnType<typeof fetchOrderDetail>>;

function stringifyValue(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  try {
    return JSON.stringify(value);
  } catch {
    return '';
  }
}

function normalizeOptions(options: unknown): string[] {
  if (!Array.isArray(options)) return [];
  return options
    .map((option) => {
      if (typeof option === 'string') return option;
      if (option && typeof option === 'object') {
        const row = option as { label?: unknown; value?: unknown };
        if (typeof row.label === 'string') return row.label;
        if (typeof row.value === 'string') return row.value;
      }
      return null;
    })
    .filter((option): option is string => Boolean(option));
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

export default function InspectionItem() {
  const history = useHistory();
  const { capture, isCancelError } = useCamera();
  const { tenantSlug, orderId, itemId } = useParams<{ tenantSlug: string; orderId: string; itemId: string }>();
  const [detail, setDetail] = useState<Detail | null>(null);
  const [value, setValue] = useState('');
  const [notes, setNotes] = useState('');
  const [media, setMedia] = useState<InspectionMediaPayload[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [statusNote, setStatusNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const [orderDetail, mediaItems] = await Promise.all([
          fetchOrderDetail(tenantSlug, orderId),
          fetchInspectionMedia(tenantSlug, orderId, itemId),
        ]);
        setDetail(orderDetail);

        const existingAnswer = orderDetail.answers.find((row) => row.template_item_id === itemId);
        const existingCustomAnswer = (orderDetail.custom_answers ?? []).find((row) => row.custom_item_id === itemId);
        const answerRow = existingCustomAnswer ?? existingAnswer;
        setValue(stringifyValue(answerRow?.value));
        setNotes(stringifyValue(answerRow?.notes));
        setMedia(mediaItems);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Failed to load inspection item');
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, [tenantSlug, orderId, itemId]);

  const flattenedItems = useMemo(
    () =>
      detail?.template?.sections.flatMap((section) =>
        section.items.map((item) => ({
          ...item,
          sectionId: section.id,
          sectionName: section.name,
        }))
      ) ?? [],
    [detail]
  );

  const itemIndex = flattenedItems.findIndex((item) => item.id === itemId);
  const item = itemIndex >= 0 ? flattenedItems[itemIndex] : null;
  const nextItem = itemIndex >= 0 && itemIndex < flattenedItems.length - 1 ? flattenedItems[itemIndex + 1] : null;
  const previousHref = `/t/${tenantSlug}/order/${orderId}/inspection`;

  const itemType = (item?.item_type ?? 'text').toLowerCase();
  const options = normalizeOptions(item?.options);
  const isChoiceType =
    options.length > 0 || itemType === 'select' || itemType === 'dropdown' || itemType === 'radio' || itemType === 'choice';
  const isBooleanType = itemType === 'boolean' || itemType === 'yes_no' || itemType === 'pass_fail' || itemType === 'toggle';
  const isLongTextType = itemType === 'textarea' || itemType === 'long_text' || itemType === 'comment' || itemType === 'notes';
  const isNumberType = itemType === 'number' || itemType === 'integer' || itemType === 'decimal';
  const isCustomItem = Boolean(item?.is_custom);

  const saveAnswer = async () => {
    if (!item) return;
    setSaving(true);
    setStatusNote('');
    try {
      if (isCustomItem) {
        await saveInspectionCustomAnswers(tenantSlug, orderId, [
          {
            custom_item_id: item.id,
            value: value.trim() || null,
            notes: notes.trim() || null,
          },
        ]);
      } else {
        await saveInspectionAnswers(tenantSlug, orderId, [
          {
            template_item_id: item.id,
            section_id: item.sectionId,
            value: value.trim() || null,
            notes: notes.trim() || null,
          },
        ]);
      }
      setStatusNote('Item response saved.');
    } catch (saveError) {
      setStatusNote(saveError instanceof Error ? saveError.message : 'Failed to save item response');
    } finally {
      setSaving(false);
    }
  };

  const capturePhoto = async () => {
    if (!item) return;
    setUploadingPhoto(true);
    setStatusNote('');
    try {
      const captureResult = await capture({
        source: CameraSource.Camera,
        withLocation: true,
        filePrefix: `inspection-${item.id}`,
      });

      if (captureResult.latitude == null || captureResult.longitude == null) {
        throw new Error('Location is required for inspection photos.');
      }

      const uploaded = await createInspectionMedia(tenantSlug, orderId, {
        file: captureResult.file,
        template_item_id: item.id,
        section_id: item.sectionId,
        captured_at: captureResult.capturedAt,
        latitude: captureResult.latitude,
        longitude: captureResult.longitude,
        accuracy_meters: captureResult.accuracyMeters ?? null,
      });
      setMedia((current) => [uploaded, ...current]);
      setStatusNote('Photo uploaded.');
    } catch (captureError) {
      if (isCancelError(captureError)) return;
      setStatusNote(captureError instanceof Error ? captureError.message : 'Failed to capture/upload photo');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const saveAndNext = async () => {
    await saveAnswer();
    if (nextItem) {
      history.push(`/t/${tenantSlug}/order/${orderId}/inspection/item/${nextItem.id}`);
    } else {
      history.push(previousHref);
    }
  };

  return (
    <MobilePageLayout title={item?.name || 'Inspection Item'} subtitle={detail?.order?.order_number || 'Inspection'} showBack defaultHref={previousHref}>
      {loading ? <IonSpinner name="crescent" /> : null}
      {error ? (
        <IonText color="danger">
          <p>{error}</p>
        </IonText>
      ) : null}

      {!loading && !error && !item ? (
        <IonText color="medium">
          <p>Inspection item not found in this template.</p>
        </IonText>
      ) : null}

      {!loading && !error && item ? (
        <div className="inspection-item-page">
          <section className="inspection-item-card">
            <div className="inspection-item-meta">
              <span>{item.sectionName}</span>
              {item.is_required ? <strong>Required</strong> : <strong>Optional</strong>}
            </div>
            {item.description ? <p>{item.description}</p> : null}

            {isChoiceType ? (
              <IonItem lines="none">
                <IonLabel position="stacked">Response</IonLabel>
                <IonSelect value={value} placeholder="Select response" interface="action-sheet" onIonChange={(event) => setValue(String(event.detail.value ?? ''))}>
                  {options.map((option) => (
                    <IonSelectOption key={option} value={option}>
                      {option}
                    </IonSelectOption>
                  ))}
                </IonSelect>
              </IonItem>
            ) : isBooleanType ? (
              <IonSegment value={value} onIonChange={(event) => setValue(String(event.detail.value ?? ''))}>
                <IonSegmentButton value="yes">
                  <IonLabel>Yes</IonLabel>
                </IonSegmentButton>
                <IonSegmentButton value="no">
                  <IonLabel>No</IonLabel>
                </IonSegmentButton>
                <IonSegmentButton value="n/a">
                  <IonLabel>N/A</IonLabel>
                </IonSegmentButton>
              </IonSegment>
            ) : isLongTextType ? (
              <IonTextarea label="Response" labelPlacement="stacked" autoGrow value={value} onIonInput={(event) => setValue(String(event.detail.value ?? ''))} />
            ) : (
              <IonInput
                label="Response"
                labelPlacement="stacked"
                type={isNumberType ? 'number' : 'text'}
                value={value}
                onIonInput={(event) => setValue(String(event.detail.value ?? ''))}
              />
            )}

            <IonTextarea label="Notes" labelPlacement="stacked" autoGrow value={notes} onIonInput={(event) => setNotes(String(event.detail.value ?? ''))} />
          </section>

          <section className="inspection-item-card">
            <SectionTitle>Item Photos</SectionTitle>
            <p className="inspection-item-note">Capture evidence tied to this item. Photos include timestamp and location metadata.</p>
            <IonButton expand="block" fill="outline" onClick={() => void capturePhoto()} disabled={uploadingPhoto}>
              <IonIcon slot="start" icon={cameraOutline} />
              {uploadingPhoto ? 'Uploading Photo...' : 'Add Photo'}
            </IonButton>

            {media.length > 0 ? (
              <div className="inspection-item-media-grid">
                {media.map((asset) => (
                  <figure key={asset.id} className="inspection-item-media-card">
                    {asset.image_url ? <img src={asset.image_url} alt={asset.file_name} /> : null}
                    <figcaption>{formatDateTime(asset.captured_at || asset.created_at)}</figcaption>
                  </figure>
                ))}
              </div>
            ) : (
              <p className="inspection-item-note">No photos added yet.</p>
            )}
          </section>

          {statusNote ? (
            <IonText color="medium">
              <p className="inspection-item-note">{statusNote}</p>
            </IonText>
          ) : null}

          <StickyButtonRow>
            <IonButton expand="block" fill="outline" onClick={() => void saveAnswer()} disabled={saving}>
              {saving ? <IonSpinner name="crescent" /> : 'Save'}
            </IonButton>
            <IonButton expand="block" onClick={() => void saveAndNext()} disabled={saving}>
              {nextItem ? (
                <>
                  Save + Next
                  <IonIcon slot="end" icon={chevronForwardOutline} />
                </>
              ) : (
                'Save + Finish'
              )}
            </IonButton>
          </StickyButtonRow>
        </div>
      ) : null}
    </MobilePageLayout>
  );
}
