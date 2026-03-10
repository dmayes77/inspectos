import {
  saveInspectionCustomAnswers,
  saveOrderInspectionAnswers,
  type InspectionAnswerPayload,
  type InspectionCustomAnswerPayload,
} from './api';

type QueueDb = IDBDatabase;

type PendingInspectionMutationRecord =
  | {
      local_id: string;
      tenant_slug: string;
      order_id: string;
      kind: 'template_answer';
      answers: InspectionAnswerPayload[];
      created_at: string;
      last_error: string | null;
    }
  | {
      local_id: string;
      tenant_slug: string;
      order_id: string;
      kind: 'custom_answer';
      answers: InspectionCustomAnswerPayload[];
      created_at: string;
      last_error: string | null;
    };

const DB_NAME = 'inspectos-mobile-offline';
const DB_VERSION = 2;
const QUICK_CAPTURE_STORE_NAME = 'quick_capture_queue';
const INSPECTION_MUTATION_STORE_NAME = 'inspection_mutation_queue';

function isNetworkError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const msg = error.message.toLowerCase();
  return msg.includes('failed to fetch') || msg.includes('network') || msg.includes('timeout');
}

function openQueueDb(): Promise<QueueDb> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(QUICK_CAPTURE_STORE_NAME)) {
        const quickCaptureStore = db.createObjectStore(QUICK_CAPTURE_STORE_NAME, { keyPath: 'local_id' });
        quickCaptureStore.createIndex('tenant_created', ['tenant_slug', 'created_at'], { unique: false });
      }
      if (!db.objectStoreNames.contains(INSPECTION_MUTATION_STORE_NAME)) {
        const inspectionStore = db.createObjectStore(INSPECTION_MUTATION_STORE_NAME, { keyPath: 'local_id' });
        inspectionStore.createIndex('tenant_order_created', ['tenant_slug', 'order_id', 'created_at'], { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Failed to open offline queue DB'));
  });
}

function withStore<T>(storeName: string, mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return new Promise(async (resolve, reject) => {
    let db: QueueDb | null = null;
    try {
      db = await openQueueDb();
    } catch (error) {
      reject(error);
      return;
    }

    const tx = db.transaction(storeName, mode);
    const store = tx.objectStore(storeName);
    const request = run(store);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Queue operation failed'));
    tx.oncomplete = () => db?.close();
    tx.onerror = () => db?.close();
    tx.onabort = () => db?.close();
  });
}

export async function enqueueInspectionTemplateAnswerMutation(
  tenantSlug: string,
  orderId: string,
  answers: InspectionAnswerPayload[]
): Promise<PendingInspectionMutationRecord> {
  const record: PendingInspectionMutationRecord = {
    local_id: `inspection-answer-${crypto.randomUUID()}`,
    tenant_slug: tenantSlug,
    order_id: orderId,
    kind: 'template_answer',
    answers,
    created_at: new Date().toISOString(),
    last_error: null,
  };

  await withStore('inspection_mutation_queue', 'readwrite', (store) => store.put(record));
  return record;
}

export async function enqueueInspectionCustomAnswerMutation(
  tenantSlug: string,
  orderId: string,
  answers: InspectionCustomAnswerPayload[]
): Promise<PendingInspectionMutationRecord> {
  const record: PendingInspectionMutationRecord = {
    local_id: `inspection-custom-answer-${crypto.randomUUID()}`,
    tenant_slug: tenantSlug,
    order_id: orderId,
    kind: 'custom_answer',
    answers,
    created_at: new Date().toISOString(),
    last_error: null,
  };

  await withStore('inspection_mutation_queue', 'readwrite', (store) => store.put(record));
  return record;
}

export async function listPendingInspectionMutations(tenantSlug: string): Promise<PendingInspectionMutationRecord[]> {
  const rows = await withStore<PendingInspectionMutationRecord[]>('inspection_mutation_queue', 'readonly', (store) => store.getAll());
  return (rows ?? [])
    .filter((row) => row.tenant_slug === tenantSlug)
    .sort((a, b) => a.created_at.localeCompare(b.created_at));
}

async function removePendingInspectionMutation(localId: string): Promise<void> {
  await withStore('inspection_mutation_queue', 'readwrite', (store) => store.delete(localId));
}

async function markPendingInspectionMutationError(localId: string, message: string): Promise<void> {
  const row = await withStore<PendingInspectionMutationRecord | undefined>('inspection_mutation_queue', 'readonly', (store) => store.get(localId));
  if (!row) return;
  row.last_error = message;
  await withStore('inspection_mutation_queue', 'readwrite', (store) => store.put(row));
}

export async function syncPendingInspectionMutations(tenantSlug: string): Promise<{ synced: number; stoppedByNetwork: boolean }> {
  const pending = await listPendingInspectionMutations(tenantSlug);
  if (pending.length === 0) {
    return { synced: 0, stoppedByNetwork: false };
  }

  let synced = 0;
  for (const row of pending) {
    try {
      if (row.kind === 'template_answer') {
        await saveOrderInspectionAnswers(row.tenant_slug, row.order_id, row.answers);
      } else {
        await saveInspectionCustomAnswers(row.tenant_slug, row.order_id, row.answers);
      }

      await removePendingInspectionMutation(row.local_id);
      synced += 1;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sync failed';
      await markPendingInspectionMutationError(row.local_id, message);
      if (isNetworkError(error)) {
        return { synced, stoppedByNetwork: true };
      }
    }
  }

  return { synced, stoppedByNetwork: false };
}

