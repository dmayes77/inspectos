import './inspection-item.css';
import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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
import { mobileQueryKeys } from '../../lib/query-keys';
import {
  createOrderInspectionMedia,
  getOrderInspectionDetail,
  getOrderInspectionMedia,
  saveOrderInspectionAnswers,
  saveInspectionCustomAnswers,
  type InspectionMediaPayload,
} from '../../services/api';
import {
  enqueueInspectionCustomAnswerMutation,
  enqueueInspectionTemplateAnswerMutation,
} from '../../services/inspectionOfflineQueue';
import { useCamera } from '../../hooks/useCamera';

type Detail = Awaited<ReturnType<typeof getOrderInspectionDetail>>;

type FlattenedInspectionItem = NonNullable<Detail['template']>['sections'][number]['items'][number] & {
  sectionId: string;
  sectionName: string;
  sourceSectionId: string;
  sourceTemplateItemId: string | null;
};

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

function flattenInspectionItems(detail: Detail | null): FlattenedInspectionItem[] {
  return (
    detail?.template?.sections.flatMap((section) =>
      section.items.map((entry) => ({
        ...entry,
        sectionId: section.id,
        sectionName: section.name,
        sourceSectionId: entry.source_section_id ?? section.source_template_section_id ?? section.id,
        sourceTemplateItemId: entry.source_template_item_id ?? null,
      }))
    ) ?? []
  );
}

function applyAnswerState(detail: Detail | null, itemId: string): { item: FlattenedInspectionItem | null; value: string; notes: string; mediaKey: string | null } {
  const flattened = flattenInspectionItems(detail);
  const resolvedItem = flattened.find((entry) => entry.id === itemId) ?? null;
  if (!resolvedItem) {
    return {
      item: null,
      value: '',
      notes: '',
      mediaKey: null,
    };
  }

  const answerLookupId = resolvedItem.sourceTemplateItemId ?? itemId;
  const existingAnswer = detail?.answers.find((row) => row.template_item_id === answerLookupId);
  const existingCustomAnswer = (detail?.custom_answers ?? []).find((row) => row.custom_item_id === itemId);
  const answerRow = existingCustomAnswer ?? existingAnswer;

  return {
    item: resolvedItem,
    value: stringifyValue(answerRow?.value),
    notes: stringifyValue(answerRow?.notes),
    mediaKey: answerLookupId,
  };
}

function upsertSavedAnswer(detail: Detail, item: FlattenedInspectionItem, nextValue: string, nextNotes: string): Detail {
  if (item.sourceTemplateItemId) {
    const answers = [...detail.answers];
    const existingIndex = answers.findIndex((row) => row.template_item_id === item.sourceTemplateItemId);
    const nextAnswer = {
      ...(existingIndex >= 0 ? answers[existingIndex] : {}),
      template_item_id: item.sourceTemplateItemId,
      section_id: item.sourceSectionId ?? item.sectionId,
      value: nextValue || null,
      notes: nextNotes || null,
    };

    if (existingIndex >= 0) {
      answers[existingIndex] = nextAnswer;
    } else {
      answers.push(nextAnswer);
    }

    return {
      ...detail,
      answers,
    };
  }

  const customAnswers = [...(detail.custom_answers ?? [])];
  const existingIndex = customAnswers.findIndex((row) => row.custom_item_id === item.id);
  const nextAnswer = {
    ...(existingIndex >= 0 ? customAnswers[existingIndex] : {}),
    custom_item_id: item.id,
    section_id: item.sectionId,
    value: nextValue || null,
    notes: nextNotes || null,
  };

  if (existingIndex >= 0) {
    customAnswers[existingIndex] = nextAnswer;
  } else {
    customAnswers.push(nextAnswer);
  }

  return {
    ...detail,
    custom_answers: customAnswers,
  };
}

export default function InspectionItem() {
  const history = useHistory();
  const queryClient = useQueryClient();
  const { capture, isCancelError } = useCamera();
  const { tenantSlug, orderId, itemId } = useParams<{ tenantSlug: string; orderId: string; itemId: string }>();
  const [value, setValue] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [statusNote, setStatusNote] = useState('');
  const detailQuery = useQuery({
    queryKey: mobileQueryKeys.orderInspectionDetail(tenantSlug, orderId),
    queryFn: () => getOrderInspectionDetail(tenantSlug, orderId),
  });
  const detail = detailQuery.data ?? null;
  const flattenedItems = useMemo(() => flattenInspectionItems(detail), [detail]);
  const itemIndex = flattenedItems.findIndex((entry) => entry.id === itemId);
  const item = itemIndex >= 0 ? flattenedItems[itemIndex] : null;
  const nextItem = itemIndex >= 0 && itemIndex < flattenedItems.length - 1 ? flattenedItems[itemIndex + 1] : null;
  const mediaKey = item?.sourceTemplateItemId ?? itemId;
  const mediaQuery = useQuery({
    queryKey: mobileQueryKeys.orderInspectionMedia(tenantSlug, orderId, mediaKey),
    queryFn: () => getOrderInspectionMedia(tenantSlug, orderId, mediaKey),
    enabled: Boolean(item),
  });
  const media = mediaQuery.data ?? [];
  const loading = detailQuery.isPending || mediaQuery.isPending;
  const error = detailQuery.error instanceof Error
    ? detailQuery.error.message
    : mediaQuery.error instanceof Error
      ? mediaQuery.error.message
      : null;

  useEffect(() => {
    if (detail) {
      const itemState = applyAnswerState(detail, itemId);
      setValue(itemState.value);
      setNotes(itemState.notes);
    }
  }, [detail, itemId, orderId, tenantSlug]);

  const previousHref = `/t/${tenantSlug}/order/${orderId}/inspection`;

  const itemType = (item?.item_type ?? 'text').toLowerCase();
  const options = normalizeOptions(item?.options);
  const isChoiceType =
    options.length > 0 || itemType === 'select' || itemType === 'dropdown' || itemType === 'radio' || itemType === 'choice';
  const isBooleanType = itemType === 'boolean' || itemType === 'yes_no' || itemType === 'pass_fail' || itemType === 'toggle';
  const isLongTextType = itemType === 'textarea' || itemType === 'long_text' || itemType === 'comment' || itemType === 'notes';
  const isNumberType = itemType === 'number' || itemType === 'integer' || itemType === 'decimal';
  const sourceTemplateItemId = typeof item?.source_template_item_id === 'string' ? item.source_template_item_id : null;
  const sourceSectionId = typeof item?.source_section_id === 'string' ? item.source_section_id : null;
  const isCustomItem = !sourceTemplateItemId;

  const saveAnswer = async () => {
    if (!item) return;
    setSaving(true);
    setStatusNote('');
    try {
      if (isCustomItem) {
        const payload = [
          {
            custom_item_id: item.id,
            value: value.trim() || null,
            notes: notes.trim() || null,
          },
        ];
        if (!navigator.onLine) {
          await enqueueInspectionCustomAnswerMutation(tenantSlug, orderId, payload);
        } else {
          await saveInspectionCustomAnswers(tenantSlug, orderId, payload);
        }
      } else {
        if (!sourceTemplateItemId) {
          throw new Error('Missing source template item for inspection response.');
        }
        const payload = [
          {
            template_item_id: sourceTemplateItemId,
            section_id: sourceSectionId ?? item.sectionId,
            value: value.trim() || null,
            notes: notes.trim() || null,
          },
        ];
        if (!navigator.onLine) {
          await enqueueInspectionTemplateAnswerMutation(tenantSlug, orderId, payload);
        } else {
          await saveOrderInspectionAnswers(tenantSlug, orderId, payload);
        }
      }
      setStatusNote(navigator.onLine ? 'Item response saved.' : 'Saved offline. Will sync automatically.');
      if (detail && item) {
        const nextDetail = upsertSavedAnswer(detail, item, value.trim(), notes.trim());
        queryClient.setQueryData(mobileQueryKeys.orderInspectionDetail(tenantSlug, orderId), nextDetail);
        void queryClient.invalidateQueries({ queryKey: mobileQueryKeys.order(tenantSlug, orderId) });
      }
      return true;
    } catch (saveError) {
      setStatusNote(saveError instanceof Error ? saveError.message : 'Failed to save item response');
      return false;
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

      const uploaded = await createOrderInspectionMedia(tenantSlug, orderId, {
        file: captureResult.file,
        template_item_id: sourceTemplateItemId ?? item.id,
        section_id: sourceSectionId ?? item.sectionId,
        captured_at: captureResult.capturedAt,
        latitude: captureResult.latitude,
        longitude: captureResult.longitude,
        accuracy_meters: captureResult.accuracyMeters ?? null,
      });
      queryClient.setQueryData<InspectionMediaPayload[]>(
        mobileQueryKeys.orderInspectionMedia(tenantSlug, orderId, mediaKey),
        (current) => [uploaded, ...(current ?? [])]
      );
      void queryClient.invalidateQueries({ queryKey: mobileQueryKeys.orderInspectionMedia(tenantSlug, orderId) });
      void queryClient.invalidateQueries({ queryKey: mobileQueryKeys.order(tenantSlug, orderId) });
      setStatusNote('Photo uploaded.');
    } catch (captureError) {
      if (isCancelError(captureError)) return;
      setStatusNote(captureError instanceof Error ? captureError.message : 'Failed to capture/upload photo');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const saveAndNext = async () => {
    const saved = await saveAnswer();
    if (!saved) return;
    if (nextItem) {
      history.push(`/t/${tenantSlug}/order/${orderId}/inspection/item/${nextItem.id}`);
      return;
    }
    history.push(previousHref);
  };

  const saveAndReturn = async () => {
    const saved = await saveAnswer();
    if (!saved) return;
    history.push(previousHref);
  };

  return (
    <MobilePageLayout title={item?.name || 'Inspection Item'} showBack defaultHref={previousHref}>
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
              <IonItem lines="none" className="inspection-item-field">
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
              <IonTextarea className="inspection-item-field" label="Response" labelPlacement="stacked" autoGrow value={value} onIonInput={(event) => setValue(String(event.detail.value ?? ''))} />
            ) : (
              <IonInput
                className="inspection-item-field"
                label="Response"
                labelPlacement="stacked"
                type={isNumberType ? 'number' : 'text'}
                value={value}
                onIonInput={(event) => setValue(String(event.detail.value ?? ''))}
              />
            )}

            <IonTextarea className="inspection-item-field" label="Notes" labelPlacement="stacked" autoGrow value={notes} onIonInput={(event) => setNotes(String(event.detail.value ?? ''))} />
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
            <IonButton expand="block" fill="outline" onClick={() => void saveAndReturn()} disabled={saving}>
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
