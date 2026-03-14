import './inspection-item.css';
import { useEffect, useMemo, useRef, useState, type TouchEvent } from 'react';
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
import { cameraOutline, chevronBackOutline, chevronDownOutline, chevronForwardOutline, chevronUpOutline } from 'ionicons/icons';
import { MobilePageLayout } from '../../components/MobilePageLayout';
import { SectionTitle, StickyButtonRow } from '../../components/ui';
import { mobileQueryKeys } from '../../lib/query-keys';
import {
  createOrderInspectionMedia,
  getOrderInspectionDetail,
  getOrderInspectionMedia,
  saveInspectionCustomAnswers,
  saveOrderInspectionAnswers,
  type InspectionMediaPayload,
} from '../../services/api';
import {
  enqueueInspectionCustomAnswerMutation,
  enqueueInspectionTemplateAnswerMutation,
} from '../../services/inspectionOfflineQueue';
import { useCamera } from '../../hooks/useCamera';
import { buildAnswerStateMap, flattenInspectionItems, stringifyValue, type FlattenedInspectionItem } from '../Inspection/inspection-flow';

type Detail = Awaited<ReturnType<typeof getOrderInspectionDetail>>;

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

function applyAnswerState(detail: Detail | null, itemId: string): { item: FlattenedInspectionItem | null; value: string; notes: string } {
  const flattened = flattenInspectionItems(detail);
  const resolvedItem = flattened.find((entry) => entry.id === itemId) ?? null;
  if (!resolvedItem) {
    return {
      item: null,
      value: '',
      notes: '',
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

function shouldIgnoreSwipeTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return Boolean(
    target.closest(
      'input, textarea, select, button, a, ion-input, ion-textarea, ion-select, ion-segment, ion-segment-button, [data-no-swipe="true"]'
    )
  );
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
  const [autosaveState, setAutosaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const touchIgnoreRef = useRef(false);
  const hydratedItemIdRef = useRef<string | null>(null);
  const lastSavedSnapshotRef = useRef<{ itemId: string; value: string; notes: string } | null>(null);

  const detailQuery = useQuery({
    queryKey: mobileQueryKeys.orderInspectionDetail(tenantSlug, orderId),
    queryFn: () => getOrderInspectionDetail(tenantSlug, orderId),
  });
  const detail = detailQuery.data ?? null;
  const flattenedItems = useMemo(() => flattenInspectionItems(detail), [detail]);
  const itemIndex = flattenedItems.findIndex((entry) => entry.id === itemId);
  const item = itemIndex >= 0 ? flattenedItems[itemIndex] : null;
  const currentSectionItems = useMemo(
    () => (item ? flattenedItems.filter((entry) => entry.sectionId === item.sectionId) : []),
    [flattenedItems, item]
  );
  const currentSectionIndex = useMemo(() => {
    if (!item) return -1;
    return (detail?.template?.sections ?? []).findIndex((section) => section.id === item.sectionId);
  }, [detail, item]);
  const currentSection = currentSectionIndex >= 0 ? detail?.template?.sections[currentSectionIndex] ?? null : null;
  const itemIndexInSection = item ? currentSectionItems.findIndex((entry) => entry.id === item.id) : -1;
  const nextItem = itemIndex >= 0 && itemIndex < flattenedItems.length - 1 ? flattenedItems[itemIndex + 1] : null;
  const previousItem = itemIndex > 0 ? flattenedItems[itemIndex - 1] : null;
  const nextItemInSection =
    itemIndexInSection >= 0 && itemIndexInSection < currentSectionItems.length - 1 ? currentSectionItems[itemIndexInSection + 1] : null;
  const previousItemInSection = itemIndexInSection > 0 ? currentSectionItems[itemIndexInSection - 1] : null;
  const nextSection = currentSectionIndex >= 0 ? detail?.template?.sections[currentSectionIndex + 1] ?? null : null;
  const previousSection = currentSectionIndex > 0 ? detail?.template?.sections[currentSectionIndex - 1] ?? null : null;
  const nextSectionItem = nextSection?.items?.[0] ?? null;
  const previousSectionItem = previousSection?.items?.[0] ?? null;
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
    if (!detail) return;
    const itemState = applyAnswerState(detail, itemId);
    setValue(itemState.value);
    setNotes(itemState.notes);
    hydratedItemIdRef.current = itemId;
    lastSavedSnapshotRef.current = {
      itemId,
      value: itemState.value.trim(),
      notes: itemState.notes.trim(),
    };
    setAutosaveState('idle');
  }, [detail, itemId]);

  const previousHref = `/t/${tenantSlug}/order/${orderId}/inspection`;
  const itemType = (item?.item_type ?? 'text').toLowerCase();
  const options = normalizeOptions(item?.options);
  const isChoiceType =
    options.length > 0 || itemType === 'select' || itemType === 'dropdown' || itemType === 'radio' || itemType === 'choice';
  const isBooleanType = itemType === 'boolean' || itemType === 'yes_no' || itemType === 'pass_fail' || itemType === 'toggle';
  const isLongTextType = itemType === 'textarea' || itemType === 'long_text' || itemType === 'comment' || itemType === 'notes';
  const isNumberType = itemType === 'number' || itemType === 'integer' || itemType === 'decimal';
  const sourceTemplateItemId = typeof item?.source_template_item_id === 'string' ? item.sourceTemplateItemId : null;
  const sourceSectionId = typeof item?.source_section_id === 'string' ? item.source_section_id : item?.sourceSectionId ?? null;
  const isCustomItem = !sourceTemplateItemId;
  const overallIndexLabel = itemIndex >= 0 ? `${itemIndex + 1} of ${flattenedItems.length}` : null;
  const sectionIndexLabel =
    itemIndexInSection >= 0 && currentSectionItems.length > 0 ? `${itemIndexInSection + 1} of ${currentSectionItems.length}` : null;

  const saveAnswer = async (mode: 'manual' | 'auto' | 'navigate' = 'manual') => {
    if (!item) return false;
    const trimmedValue = value.trim();
    const trimmedNotes = notes.trim();
    const snapshot = { itemId: item.id, value: trimmedValue, notes: trimmedNotes };

    if (
      lastSavedSnapshotRef.current &&
      lastSavedSnapshotRef.current.itemId === snapshot.itemId &&
      lastSavedSnapshotRef.current.value === snapshot.value &&
      lastSavedSnapshotRef.current.notes === snapshot.notes
    ) {
      if (mode === 'auto') setAutosaveState('saved');
      return true;
    }

    if (mode === 'auto') setAutosaveState('saving');
    setSaving(mode !== 'auto');
    if (mode !== 'auto') setStatusNote('');

    try {
      if (isCustomItem) {
        const payload = [
          {
            custom_item_id: item.id,
            value: trimmedValue || null,
            notes: trimmedNotes || null,
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
            value: trimmedValue || null,
            notes: trimmedNotes || null,
          },
        ];
        if (!navigator.onLine) {
          await enqueueInspectionTemplateAnswerMutation(tenantSlug, orderId, payload);
        } else {
          await saveOrderInspectionAnswers(tenantSlug, orderId, payload);
        }
      }

      lastSavedSnapshotRef.current = snapshot;
      setAutosaveState('saved');
      if (mode !== 'auto') {
        setStatusNote(navigator.onLine ? 'Item response saved.' : 'Saved offline. Will sync automatically.');
      }
      if (detail && item) {
        const nextDetail = upsertSavedAnswer(detail, item, trimmedValue, trimmedNotes);
        queryClient.setQueryData(mobileQueryKeys.orderInspectionDetail(tenantSlug, orderId), nextDetail);
        const answerMap = buildAnswerStateMap(nextDetail);
        void queryClient.invalidateQueries({ queryKey: mobileQueryKeys.order(tenantSlug, orderId) });
        if (answerMap[item.id] == null) {
          void queryClient.invalidateQueries({ queryKey: mobileQueryKeys.orderInspectionDetail(tenantSlug, orderId) });
        }
      }
      return true;
    } catch (saveError) {
      setAutosaveState('error');
      setStatusNote(saveError instanceof Error ? saveError.message : 'Failed to save item response');
      return false;
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (!item || hydratedItemIdRef.current !== itemId) return;
    const timeout = window.setTimeout(() => {
      void saveAnswer('auto');
    }, isLongTextType ? 800 : 450);

    return () => window.clearTimeout(timeout);
  }, [item, itemId, value, notes, isLongTextType]);

  const navigateToItem = async (nextTargetId: string | null) => {
    if (!nextTargetId || !item) return;
    const saved = await saveAnswer('navigate');
    if (!saved) return;
    history.push(`/t/${tenantSlug}/order/${orderId}/inspection/item/${nextTargetId}`);
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
    const targetId = nextItem?.id ?? null;
    if (!targetId) {
      const saved = await saveAnswer('navigate');
      if (saved) history.push(previousHref);
      return;
    }
    await navigateToItem(targetId);
  };

  const saveAndReturn = async () => {
    const saved = await saveAnswer('navigate');
    if (!saved) return;
    history.push(previousHref);
  };

  const handleTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    touchIgnoreRef.current = shouldIgnoreSwipeTarget(event.target);
    if (touchIgnoreRef.current) return;
    const touch = event.changedTouches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = async (event: TouchEvent<HTMLDivElement>) => {
    if (touchIgnoreRef.current || !touchStartRef.current || saving || uploadingPhoto) {
      touchStartRef.current = null;
      touchIgnoreRef.current = false;
      return;
    }

    const touch = event.changedTouches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;
    touchStartRef.current = null;
    touchIgnoreRef.current = false;

    const absX = Math.abs(dx);
    const absY = Math.abs(dy);
    const threshold = 56;

    if (absX < threshold && absY < threshold) return;

    if (absX > absY) {
      if (dx < 0) {
        await navigateToItem(nextSectionItem?.id ?? null);
      } else {
        await navigateToItem(previousSectionItem?.id ?? null);
      }
      return;
    }

    if (dy < 0) {
      await navigateToItem(nextItemInSection?.id ?? null);
    } else {
      await navigateToItem(previousItemInSection?.id ?? null);
    }
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
        <div className="inspection-item-page" onTouchStart={handleTouchStart} onTouchEnd={(event) => void handleTouchEnd(event)}>
          <section className="inspection-item-shell">
            <div className="inspection-item-rail inspection-item-rail--horizontal">
              <button
                type="button"
                className="inspection-item-nav-chip"
                onClick={() => void navigateToItem(previousSectionItem?.id ?? null)}
                disabled={!previousSectionItem || saving || uploadingPhoto}
              >
                <IonIcon icon={chevronBackOutline} />
                <span>{previousSection?.name ?? 'Prev Section'}</span>
              </button>
              <div className="inspection-item-position">
                <span>{currentSection?.name ?? item.sectionName}</span>
                <strong>{sectionIndexLabel ? `${sectionIndexLabel} in section` : 'Item'}</strong>
              </div>
              <button
                type="button"
                className="inspection-item-nav-chip"
                onClick={() => void navigateToItem(nextSectionItem?.id ?? null)}
                disabled={!nextSectionItem || saving || uploadingPhoto}
              >
                <span>{nextSection?.name ?? 'Next Section'}</span>
                <IonIcon icon={chevronForwardOutline} />
              </button>
            </div>

            <div className="inspection-item-focus-card">
              <div className="inspection-item-progress-head">
                <div>
                  <span className="inspection-item-progress-label">Inspection Flow</span>
                  <h2>{item.name}</h2>
                </div>
                <div className="inspection-item-progress-badges">
                  {overallIndexLabel ? <span>{overallIndexLabel}</span> : null}
                  <strong>{item.is_required ? 'Required' : 'Optional'}</strong>
                </div>
              </div>

              {item.description ? <p className="inspection-item-description">{item.description}</p> : null}

              {isChoiceType ? (
                <IonItem lines="none" className="inspection-item-field" data-no-swipe="true">
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
                <IonSegment value={value} onIonChange={(event) => setValue(String(event.detail.value ?? ''))} data-no-swipe="true">
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

              <div className="inspection-item-save-row">
                <span className={`inspection-item-save-state is-${autosaveState}`}>
                  {autosaveState === 'saving'
                    ? 'Saving...'
                    : autosaveState === 'saved'
                      ? navigator.onLine
                        ? 'Saved'
                        : 'Saved offline'
                      : autosaveState === 'error'
                        ? 'Save failed'
                        : navigator.onLine
                          ? 'Ready'
                          : 'Offline'}
                </span>
                <span className="inspection-item-gesture-hint">Swipe up/down for items, left/right for sections</span>
              </div>
            </div>

            <div className="inspection-item-rail inspection-item-rail--vertical">
              <button
                type="button"
                className="inspection-item-nav-pill"
                onClick={() => void navigateToItem(previousItemInSection?.id ?? null)}
                disabled={!previousItemInSection || saving || uploadingPhoto}
              >
                <IonIcon icon={chevronUpOutline} />
                <span>{previousItemInSection?.name ?? 'Previous Item'}</span>
              </button>
              <button
                type="button"
                className="inspection-item-nav-pill"
                onClick={() => void navigateToItem(nextItemInSection?.id ?? null)}
                disabled={!nextItemInSection || saving || uploadingPhoto}
              >
                <span>{nextItemInSection?.name ?? 'Next Item'}</span>
                <IonIcon icon={chevronDownOutline} />
              </button>
            </div>
          </section>

          <section className="inspection-item-card">
            <SectionTitle>Item Photos</SectionTitle>
            <p className="inspection-item-note">Capture evidence tied to this item. Photos include timestamp and location metadata.</p>
            <IonButton expand="block" fill="outline" onClick={() => void capturePhoto()} disabled={uploadingPhoto} data-no-swipe="true">
              <IonIcon slot="start" icon={cameraOutline} />
              {uploadingPhoto ? 'Uploading Photo...' : 'Add Photo'}
            </IonButton>

            {media.length > 0 ? (
              <div className="inspection-item-media-grid" data-no-swipe="true">
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
