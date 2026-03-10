import './inspection.css';
import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useHistory, useParams } from 'react-router-dom';
import { IonButton, IonIcon, IonInput, IonSpinner, IonText } from '@ionic/react';
import { checkmarkCircle, removeCircleOutline, trashOutline } from 'ionicons/icons';
import { MobilePageLayout } from '../../components/MobilePageLayout';
import { InfoCard, SectionTitle } from '../../components/ui';
import { mobileQueryKeys } from '../../lib/query-keys';
import {
  createInspectionCustomItem,
  createInspectionCustomSection,
  getOrderInspectionDetail,
  getOrderInspectionMedia,
  removeInspectionOutlineItem,
  removeInspectionOutlineSection,
} from '../../services/api';

type OrderDetailData = Awaited<ReturnType<typeof getOrderInspectionDetail>>;

type ItemAnswerState = {
  sectionId: string;
  value: string;
  notes: string;
};

type ItemSummary = {
  id: string;
  name: string;
  isRequired: boolean;
  sectionId: string;
  value: string;
  notes: string;
  photoCount: number;
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

function toAnswerMap(detail: OrderDetailData | null): Record<string, ItemAnswerState> {
  const map: Record<string, ItemAnswerState> = {};
  const snapshotIdBySourceId = new Map<string, string>();

  for (const section of detail?.template?.sections ?? []) {
    for (const item of section.items ?? []) {
      const sourceId = typeof item.source_template_item_id === 'string' ? item.source_template_item_id : null;
      if (sourceId) {
        snapshotIdBySourceId.set(sourceId, item.id);
      }
    }
  }

  for (const row of detail?.answers ?? []) {
    const templateItemId = typeof row.template_item_id === 'string' ? row.template_item_id : null;
    const sectionId = typeof row.section_id === 'string' ? row.section_id : '';
    if (!templateItemId) continue;
    const targetId = snapshotIdBySourceId.get(templateItemId) ?? templateItemId;

    map[targetId] = {
      sectionId,
      value: stringifyValue(row.value),
      notes: stringifyValue(row.notes),
    };
  }

  for (const row of detail?.custom_answers ?? []) {
    const customItemId = typeof row.custom_item_id === 'string' ? row.custom_item_id : null;
    if (!customItemId) continue;
    map[customItemId] = {
      sectionId: typeof row.section_id === 'string' ? row.section_id : '',
      value: stringifyValue(row.value),
      notes: stringifyValue(row.notes),
    };
  }

  return map;
}

export default function Inspection() {
  const history = useHistory();
  const queryClient = useQueryClient();
  const { tenantSlug, orderId } = useParams<{ tenantSlug: string; orderId: string }>();
  const [addingSection, setAddingSection] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');
  const [addingItemSectionId, setAddingItemSectionId] = useState<string | null>(null);
  const [newItemName, setNewItemName] = useState('');
  const [removingSectionId, setRemovingSectionId] = useState<string | null>(null);
  const [removingItemId, setRemovingItemId] = useState<string | null>(null);
  const [statusNote, setStatusNote] = useState('');
  const detailQuery = useQuery({
    queryKey: mobileQueryKeys.orderInspectionDetail(tenantSlug, orderId),
    queryFn: () => getOrderInspectionDetail(tenantSlug, orderId),
  });
  const mediaQuery = useQuery({
    queryKey: mobileQueryKeys.orderInspectionMedia(tenantSlug, orderId),
    queryFn: () => getOrderInspectionMedia(tenantSlug, orderId),
  });
  const invalidateInspectionQueries = async () => {
    await queryClient.invalidateQueries({ queryKey: mobileQueryKeys.orderInspectionDetail(tenantSlug, orderId) });
    await queryClient.invalidateQueries({ queryKey: mobileQueryKeys.orderInspectionMedia(tenantSlug, orderId) });
    await queryClient.invalidateQueries({ queryKey: mobileQueryKeys.order(tenantSlug, orderId) });
  };
  const detail = detailQuery.data ?? null;
  const answersByItem = useMemo(() => toAnswerMap(detail), [detail]);
  const mediaCountByItem = useMemo(() => {
    const snapshotIdBySourceId = new Map<string, string>();
    for (const section of detail?.template?.sections ?? []) {
      for (const item of section.items ?? []) {
        const sourceId = typeof item.source_template_item_id === 'string' ? item.source_template_item_id : null;
        if (sourceId) {
          snapshotIdBySourceId.set(sourceId, item.id);
        }
      }
    }
    const counts: Record<string, number> = {};
    for (const item of mediaQuery.data ?? []) {
      const rawKey = item.template_item_id ?? '';
      const key = snapshotIdBySourceId.get(rawKey) ?? rawKey;
      if (!key) continue;
      counts[key] = (counts[key] ?? 0) + 1;
    }
    return counts;
  }, [detail, mediaQuery.data]);
  const loading = detailQuery.isPending || mediaQuery.isPending;
  const error = detailQuery.error instanceof Error
    ? detailQuery.error.message
    : mediaQuery.error instanceof Error
      ? mediaQuery.error.message
      : null;

  const template = detail?.template ?? null;
  const allItems = useMemo(
    () =>
      template?.sections.flatMap((section) =>
        section.items.map((item) => ({
          ...item,
          sectionId: section.id,
          sectionName: section.name,
        }))
      ) ?? [],
    [template]
  );
  const totalItems = allItems.length;
  const requiredItems = allItems.filter((item) => Boolean(item.is_required));
  const isItemComplete = (itemId: string) => {
    const answer = answersByItem[itemId];
    return (answer?.value ?? '').trim().length > 0 || (answer?.notes ?? '').trim().length > 0 || (mediaCountByItem[itemId] ?? 0) > 0;
  };

  const answeredItems = allItems.filter((item) => isItemComplete(item.id));
  const answeredRequired = requiredItems.filter((item) => isItemComplete(item.id));
  const completionPct = totalItems > 0 ? Math.min(100, Math.round((answeredItems.length / totalItems) * 100)) : 0;
  const itemSummaries = useMemo<ItemSummary[]>(
    () =>
      allItems.map((item) => ({
        id: item.id,
        name: item.name,
        isRequired: Boolean(item.is_required),
        sectionId: item.sectionId,
        value: answersByItem[item.id]?.value ?? '',
        notes: answersByItem[item.id]?.notes ?? '',
        photoCount: mediaCountByItem[item.id] ?? 0,
      })),
    [allItems, answersByItem, mediaCountByItem]
  );

  const openItem = (item: ItemSummary) => {
    history.push(`/t/${tenantSlug}/order/${orderId}/inspection/item/${item.id}`);
  };

  const addSection = async () => {
    const name = newSectionName.trim();
    if (!name) return;
    setAddingSection(true);
    setStatusNote('');
    try {
      await createInspectionCustomSection(tenantSlug, orderId, { name });
      setNewSectionName('');
      await invalidateInspectionQueries();
      setStatusNote('Custom section added.');
    } catch (createError) {
      setStatusNote(createError instanceof Error ? createError.message : 'Failed to add section');
    } finally {
      setAddingSection(false);
    }
  };

  const addItemToSection = async (sectionId: string) => {
    const name = newItemName.trim();
    if (!name) return;
    setStatusNote('');
    try {
      await createInspectionCustomItem(tenantSlug, orderId, {
        section_id: sectionId,
        name,
      });
      setNewItemName('');
      setAddingItemSectionId(null);
      await invalidateInspectionQueries();
      setStatusNote('Custom item added.');
    } catch (createError) {
      setStatusNote(createError instanceof Error ? createError.message : 'Failed to add item');
    }
  };

  const removeSection = async (sectionId: string) => {
    setRemovingSectionId(sectionId);
    setStatusNote('');
    try {
      await removeInspectionOutlineSection(tenantSlug, orderId, sectionId);
      await invalidateInspectionQueries();
      setStatusNote('Section removed from this inspection.');
    } catch (removeError) {
      setStatusNote(removeError instanceof Error ? removeError.message : 'Failed to remove section');
    } finally {
      setRemovingSectionId(null);
    }
  };

  const removeItem = async (itemId: string) => {
    setRemovingItemId(itemId);
    setStatusNote('');
    try {
      await removeInspectionOutlineItem(tenantSlug, orderId, itemId);
      await invalidateInspectionQueries();
      setStatusNote('Item removed from this inspection.');
    } catch (removeError) {
      setStatusNote(removeError instanceof Error ? removeError.message : 'Failed to remove item');
    } finally {
      setRemovingItemId(null);
    }
  };

  return (
    <MobilePageLayout
      title={detail?.order?.property?.address_line1 || detail?.order?.order_number || 'Guided Inspection'}
      showBack
      defaultHref={`/t/${tenantSlug}/order/${orderId}`}
    >
      {loading ? <IonSpinner name="crescent" /> : null}
      {error ? (
        <IonText color="danger">
          <p>{error}</p>
        </IonText>
      ) : null}

      {!loading && !error && !template ? (
        <IonText color="medium">
          <p>No inspection template is assigned to this order yet.</p>
        </IonText>
      ) : null}

      {!loading && !error && template ? (
        <div className="inspection-flow-page">
          <SectionTitle>Progress</SectionTitle>
          <div className="inspection-flow-progress">
            <InfoCard label="Completed" value={`${completionPct}%`} />
            <InfoCard label="Answered" value={`${answeredItems.length}/${totalItems}`} />
            <InfoCard label="Required" value={`${answeredRequired.length}/${requiredItems.length}`} />
          </div>

          <section className="inspection-flow-section">
            <h3>Add Building Blocks</h3>
            <p className="inspection-flow-section-description">
              Add custom sections and items for on-site conditions, like Interior &gt; Master Bedroom.
            </p>
            <div className="inspection-flow-add-row">
              <IonInput
                value={newSectionName}
                placeholder="New section name"
                onIonInput={(event) => setNewSectionName(String(event.detail.value ?? ''))}
              />
              <IonButton onClick={() => void addSection()} disabled={addingSection || newSectionName.trim().length === 0}>
                {addingSection ? <IonSpinner name="crescent" /> : 'Add Section'}
              </IonButton>
            </div>
          </section>

          {template.sections.map((section) => (
            <section key={section.id} className="inspection-flow-section">
              <div className="inspection-flow-section-head">
                <div className="inspection-flow-section-copy">
                  <h3>{section.name}</h3>
                  {section.description ? <p className="inspection-flow-section-description">{section.description}</p> : null}
                </div>
                <IonButton
                  size="small"
                  fill="clear"
                  color="danger"
                  className="inspection-flow-icon-action"
                  onClick={() => void removeSection(section.id)}
                  disabled={removingSectionId === section.id}
                  aria-label={`Remove ${section.name} section from this inspection`}
                >
                  {removingSectionId === section.id ? <IonSpinner name="crescent" /> : <IonIcon icon={trashOutline} />}
                </IonButton>
              </div>

              <div className="inspection-flow-items">
                {itemSummaries
                  .filter((item) => item.sectionId === section.id)
                  .map((item) => {
                  const hasValue = item.value.trim().length > 0;
                  const hasNotes = item.notes.trim().length > 0;
                  const hasPhotos = item.photoCount > 0;
                  const isComplete = hasValue || (hasNotes && hasPhotos);
                  const isInProgress = !isComplete && (hasNotes || hasPhotos);
                  return (
                    <div key={item.id} className="inspection-flow-item">
                      <button type="button" className="inspection-flow-item-link" onClick={() => openItem(item)}>
                        <div className="inspection-flow-item-header">
                          <strong>{item.name}</strong>
                          <span>{item.isRequired ? 'Required' : 'Optional'}</span>
                        </div>
                        <p className={`inspection-flow-item-description ${isComplete ? 'is-complete' : isInProgress ? 'is-in-progress' : ''}`}>
                          {isComplete ? <IonIcon icon={checkmarkCircle} /> : null}
                          {isComplete ? 'Complete' : isInProgress ? 'In progress' : 'Not started'}
                          {item.photoCount > 0 ? ` • ${item.photoCount} photo${item.photoCount === 1 ? '' : 's'}` : ' • No photos'}
                        </p>
                      </button>
                      <IonButton
                        size="small"
                        fill="clear"
                        color="danger"
                        className="inspection-flow-icon-action"
                        onClick={() => void removeItem(item.id)}
                        disabled={removingItemId === item.id}
                        aria-label={`Remove ${item.name} item from this inspection`}
                      >
                        {removingItemId === item.id ? <IonSpinner name="crescent" /> : <IonIcon icon={removeCircleOutline} />}
                      </IonButton>
                    </div>
                  );
                })}
              </div>
              <div className="inspection-flow-section-actions">
                {addingItemSectionId === section.id ? (
                  <div className="inspection-flow-add-row">
                    <IonInput
                      value={newItemName}
                      placeholder={`Add item under ${section.name}`}
                      onIonInput={(event) => setNewItemName(String(event.detail.value ?? ''))}
                    />
                    <IonButton onClick={() => void addItemToSection(section.id)} disabled={newItemName.trim().length === 0}>
                      Add Item
                    </IonButton>
                    <IonButton
                      fill="clear"
                      onClick={() => {
                        setAddingItemSectionId(null);
                        setNewItemName('');
                      }}
                    >
                      Cancel
                    </IonButton>
                  </div>
                ) : (
                  <IonButton
                    fill="outline"
                    onClick={() => {
                      setAddingItemSectionId(section.id);
                      setNewItemName('');
                    }}
                  >
                    Add Item To {section.name}
                  </IonButton>
                )}
              </div>
            </section>
          ))}

          {statusNote ? (
            <IonText color="medium">
              <p className="inspection-flow-status">{statusNote}</p>
            </IonText>
          ) : null}

          <IonButton expand="block" fill="outline" onClick={() => history.push(`/t/${tenantSlug}/order/${orderId}`)}>
            Back to Order
          </IonButton>
        </div>
      ) : null}
    </MobilePageLayout>
  );
}
