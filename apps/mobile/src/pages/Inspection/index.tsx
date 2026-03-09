import './inspection.css';
import { useEffect, useMemo, useState } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import { IonButton, IonInput, IonSpinner, IonText } from '@ionic/react';
import { MobilePageLayout } from '../../components/MobilePageLayout';
import { InfoCard, SectionTitle } from '../../components/ui';
import { createInspectionCustomItem, createInspectionCustomSection, fetchInspectionMedia, fetchOrderDetail } from '../../services/api';

type OrderDetailData = Awaited<ReturnType<typeof fetchOrderDetail>>;

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

  for (const row of detail?.answers ?? []) {
    const templateItemId = typeof row.template_item_id === 'string' ? row.template_item_id : null;
    const sectionId = typeof row.section_id === 'string' ? row.section_id : '';
    if (!templateItemId) continue;

    map[templateItemId] = {
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
  const { tenantSlug, orderId } = useParams<{ tenantSlug: string; orderId: string }>();
  const [detail, setDetail] = useState<OrderDetailData | null>(null);
  const [mediaCountByItem, setMediaCountByItem] = useState<Record<string, number>>({});
  const [answersByItem, setAnswersByItem] = useState<Record<string, ItemAnswerState>>({});
  const [loading, setLoading] = useState(true);
  const [addingSection, setAddingSection] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');
  const [addingItemSectionId, setAddingItemSectionId] = useState<string | null>(null);
  const [newItemName, setNewItemName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [statusNote, setStatusNote] = useState('');

  const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [data, media] = await Promise.all([
          fetchOrderDetail(tenantSlug, orderId),
          fetchInspectionMedia(tenantSlug, orderId),
        ]);
        setDetail(data);
        setAnswersByItem(toAnswerMap(data));
        const counts: Record<string, number> = {};
        for (const item of media) {
          const key = item.template_item_id ?? '';
          if (!key) continue;
          counts[key] = (counts[key] ?? 0) + 1;
        }
        setMediaCountByItem(counts);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Failed to load inspection template');
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    void run();
    async function run() {
      await loadData();
    }
  }, [tenantSlug, orderId]);

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
  const answeredItems = allItems.filter((item) => (answersByItem[item.id]?.value ?? '').trim().length > 0);
  const answeredRequired = requiredItems.filter((item) => (answersByItem[item.id]?.value ?? '').trim().length > 0);
  const completionPct = totalItems > 0 ? Math.min(100, Math.round((answeredItems.length / totalItems) * 100)) : 0;
  const itemSummaries = useMemo<ItemSummary[]>(
    () =>
      allItems.map((item) => ({
        id: item.id,
        name: item.name,
        isRequired: Boolean(item.is_required),
        sectionId: item.sectionId,
        value: answersByItem[item.id]?.value ?? '',
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
      await loadData();
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
      await loadData();
      setStatusNote('Custom item added.');
    } catch (createError) {
      setStatusNote(createError instanceof Error ? createError.message : 'Failed to add item');
    }
  };

  return (
    <MobilePageLayout
      title={detail?.order?.property?.address_line1 || detail?.order?.order_number || 'Guided Inspection'}
      subtitle={detail?.order?.order_number || 'Inspection'}
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
              <h3>{section.name}</h3>
              {section.description ? <p className="inspection-flow-section-description">{section.description}</p> : null}

              <div className="inspection-flow-items">
                {itemSummaries
                  .filter((item) => item.sectionId === section.id)
                  .map((item) => {
                  const status = item.value.trim().length > 0 ? 'Complete' : 'Not started';
                  return (
                    <button type="button" key={item.id} className="inspection-flow-item inspection-flow-item-link" onClick={() => openItem(item)}>
                      <div className="inspection-flow-item-header">
                        <strong>{item.name}</strong>
                        <span>{item.isRequired ? 'Required' : 'Optional'}</span>
                      </div>
                      <p className="inspection-flow-item-description">
                        {status}
                        {item.photoCount > 0 ? ` • ${item.photoCount} photo${item.photoCount === 1 ? '' : 's'}` : ' • No photos'}
                      </p>
                    </button>
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
