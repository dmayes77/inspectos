import type { MobileOrderDetailPayload } from '../../services/api';

export type InspectionDetail = MobileOrderDetailPayload;

export type FlattenedInspectionItem = NonNullable<InspectionDetail['template']>['sections'][number]['items'][number] & {
  sectionId: string;
  sectionName: string;
  sourceSectionId: string;
  sourceTemplateItemId: string | null;
};

export function stringifyValue(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  try {
    return JSON.stringify(value);
  } catch {
    return '';
  }
}

export function flattenInspectionItems(detail: InspectionDetail | null): FlattenedInspectionItem[] {
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

export function buildAnswerStateMap(detail: InspectionDetail | null): Record<string, { sectionId: string; value: string; notes: string }> {
  const map: Record<string, { sectionId: string; value: string; notes: string }> = {};
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

export function isInspectionItemComplete(
  answersByItem: Record<string, { value: string; notes: string }>,
  mediaCountByItem: Record<string, number>,
  itemId: string
) {
  const answer = answersByItem[itemId];
  return (answer?.value ?? '').trim().length > 0 || (answer?.notes ?? '').trim().length > 0 || (mediaCountByItem[itemId] ?? 0) > 0;
}

export function getInspectionResumeItemId(
  detail: InspectionDetail | null,
  mediaCountByItem: Record<string, number>
) {
  const items = flattenInspectionItems(detail);
  if (items.length === 0) return null;
  const answersByItem = buildAnswerStateMap(detail);
  const firstIncomplete = items.find((item) => !isInspectionItemComplete(answersByItem, mediaCountByItem, item.id));
  return firstIncomplete?.id ?? items[0]?.id ?? null;
}
